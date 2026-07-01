import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const MAP_PATH = path.join(ROOT, 'src/data/amazon-product-map.json');
const SNAPSHOT_PATH = path.join(ROOT, 'src/data/product-commercial.json');
const DEFAULT_CSV_PATH = path.join(ROOT, 'data/manual-amazon-snapshot.csv');

const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const valueOf = (name, fallback = null) => {
  const direct = args.find(a => a.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const ttlHours = Number(valueOf('--ttl-hours', process.env.AMAZON_MANUAL_SNAPSHOT_TTL_HOURS || 6));
const csvPath = path.resolve(ROOT, valueOf('--file', DEFAULT_CSV_PATH));

const headers = [
  'slug',
  'name',
  'asin',
  'detailPageUrl',
  'imageUrl',
  'imageWidth',
  'imageHeight',
  'imageSource',
  'rightsConfirmed',
  'priceDisplay',
  'priceAmount',
  'currency',
  'availabilityMessage',
  'isAvailable',
  'capturedAt',
  'notes',
];

function usage() {
  console.log(`Manual Amazon commercial snapshot helper\n\nUsage:\n  node scripts/manual-commercial-snapshot.mjs --export [--file data/manual-amazon-snapshot.csv]\n  node scripts/manual-commercial-snapshot.mjs --import [--file data/manual-amazon-snapshot.csv] [--ttl-hours 6]\n\nThis script never scrapes Amazon. It only exports a review sheet and imports operator-confirmed values.\n`);
}

function csvEscape(value = '') {
  const text = String(value ?? '');
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function csvRow(values) {
  return values.map(csvEscape).join(',');
}
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  const [header, ...body] = rows.filter(r => r.some(c => c.trim()));
  if (!header) return [];
  return body.map(values => Object.fromEntries(header.map((h, i) => [h, values[i] ?? ''])));
}
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));

function boolFrom(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (['true', '1', 'yes', 'sí', 'si', 'y'].includes(text)) return true;
  if (['false', '0', 'no', 'n'].includes(text)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}
function parseAmount(value) {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const normalized = text.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new Error(`Invalid priceAmount: ${value}`);
  return number;
}
function assertUrl(value, field, { required = false } = {}) {
  const text = String(value ?? '').trim();
  if (!text && !required) return null;
  if (!/^https:\/\//i.test(text)) throw new Error(`${field} must be an https:// URL`);
  return text;
}
function inferAsin(row) {
  if (row.asin) return row.asin.trim();
  const url = row.detailPageUrl || '';
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

async function exportCsv() {
  const map = await readJson(MAP_PATH);
  const snapshot = await readJson(SNAPSHOT_PATH).catch(() => ({ items: {} }));
  const rows = [headers];
  for (const item of Object.values(map.items).filter(item => item.enabled !== false)) {
    const previous = snapshot.items?.[item.slug] ?? {};
    rows.push(headers.map(header => {
      if (header === 'slug') return item.slug;
      if (header === 'name') return item.name;
      if (header === 'asin') return item.asin || previous.asin || '';
      if (header === 'detailPageUrl') return previous.detailPageUrl || '';
      if (header === 'imageUrl') return previous.image?.url || '';
      if (header === 'imageWidth') return previous.image?.width || '';
      if (header === 'imageHeight') return previous.image?.height || '';
      if (header === 'imageSource') return previous.image?.source || '';
      if (header === 'rightsConfirmed') return '';
      if (header === 'priceDisplay') return previous.price?.display || '';
      if (header === 'priceAmount') return previous.price?.amount || '';
      if (header === 'currency') return previous.price?.currency || 'EUR';
      if (header === 'availabilityMessage') return previous.availability?.message || '';
      if (header === 'isAvailable') return previous.availability?.isAvailable ?? '';
      if (header === 'capturedAt') return '';
      if (header === 'notes') return `Buscar: ${item.searchTerm || item.name}`;
      return '';
    }));
  }
  await fs.mkdir(path.dirname(csvPath), { recursive: true });
  await fs.writeFile(csvPath, rows.map(csvRow).join('\n') + '\n');
  console.log(`Wrote ${csvPath}`);
  console.log('Fill only operator-verified rows. Leave price empty if unsure; the site will keep the safe fallback.');
}

async function importCsv() {
  const rows = parseCsv(await fs.readFile(csvPath, 'utf8'));
  const map = await readJson(MAP_PATH);
  const validSlugs = new Set(Object.keys(map.items));
  const now = new Date();
  const items = {};
  const errors = [];
  for (const [index, row] of rows.entries()) {
    try {
      const slug = row.slug?.trim();
      if (!slug || !validSlugs.has(slug)) continue;
      const hasCommercialData = row.detailPageUrl || row.imageUrl || row.priceDisplay || row.availabilityMessage;
      if (!hasCommercialData) continue;

      const capturedAt = row.capturedAt ? new Date(row.capturedAt) : now;
      if (Number.isNaN(capturedAt.getTime())) throw new Error('capturedAt must be an ISO date or empty');
      const expiresAt = new Date(capturedAt.getTime() + ttlHours * 3600_000);
      const detailPageUrl = assertUrl(row.detailPageUrl, 'detailPageUrl', { required: true });
      const imageUrl = assertUrl(row.imageUrl, 'imageUrl');
      const rightsConfirmed = boolFrom(row.rightsConfirmed);
      if (imageUrl && rightsConfirmed !== true) {
        throw new Error('imageUrl requires rightsConfirmed=yes and imageSource documenting the authorised source');
      }
      if (imageUrl && !row.imageSource?.trim()) throw new Error('imageUrl requires imageSource');
      const priceDisplay = row.priceDisplay?.trim();
      const priceAmount = parseAmount(row.priceAmount);
      if (priceDisplay && !row.currency?.trim()) throw new Error('priceDisplay requires currency');
      const isAvailable = boolFrom(row.isAvailable);
      items[slug] = {
        slug,
        asin: inferAsin(row),
        title: row.name?.trim() || map.items[slug].name,
        brand: null,
        detailPageUrl,
        image: imageUrl ? {
          url: imageUrl,
          width: row.imageWidth ? Number(row.imageWidth) : undefined,
          height: row.imageHeight ? Number(row.imageHeight) : undefined,
          source: row.imageSource.trim(),
        } : null,
        price: priceDisplay ? { display: priceDisplay, amount: priceAmount, currency: row.currency.trim() || 'EUR' } : null,
        availability: {
          message: row.availabilityMessage?.trim() || null,
          type: isAvailable === false ? 'OUT_OF_STOCK' : isAvailable === true ? 'IN_STOCK' : null,
          isAvailable,
        },
        fetchedAt: capturedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        source: 'manual-operator-snapshot',
        notes: row.notes?.trim() || undefined,
      };
    } catch (error) {
      errors.push(`row ${index + 2} (${row.slug || 'no-slug'}): ${error.message}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(2);
  }
  const snapshot = {
    version: 2,
    provider: 'manual-operator-snapshot',
    generatedAt: now.toISOString(),
    ttlHours,
    items,
    compliance: {
      note: 'Operator-entered commercial data. No Amazon scraping performed. Prices expire automatically; images require documented rights/authorised source.',
    },
  };
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${SNAPSHOT_PATH} with ${Object.keys(items).length} operator-confirmed items. TTL: ${ttlHours}h.`);
}

if (has('--help') || (!has('--export') && !has('--import'))) {
  usage();
} else if (has('--export')) {
  await exportCsv();
} else if (has('--import')) {
  await importCsv();
}
