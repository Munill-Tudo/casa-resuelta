import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const MAP_PATH = path.join(ROOT, 'src/data/amazon-product-map.json');
const SNAPSHOT_PATH = path.join(ROOT, 'src/data/product-commercial.json');
const CANDIDATES_PATH = path.join(ROOT, 'src/data/amazon-product-candidates.json');

const env = process.env;
const config = {
  accessKey: env.AMAZON_PAAPI_ACCESS_KEY,
  secretKey: env.AMAZON_PAAPI_SECRET_KEY,
  partnerTag: env.AMAZON_PARTNER_TAG,
  marketplace: env.AMAZON_MARKETPLACE || 'www.amazon.es',
  host: env.AMAZON_PAAPI_HOST || 'webservices.amazon.es',
  region: env.AMAZON_PAAPI_REGION || 'eu-west-1',
  ttlHours: Number(env.AMAZON_SNAPSHOT_TTL_HOURS || 24),
};
const args = new Set(process.argv.slice(2));
const mode = args.has('--candidates') ? 'candidates' : 'sync';
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const resources = [
  'Images.Primary.Large',
  'Images.Primary.Medium',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'Offers.Listings.Price',
  'Offers.Listings.Availability.Message',
  'Offers.Listings.Availability.Type',
  'Offers.Listings.Condition',
  'Offers.Listings.ProgramEligibility.IsPrimeEligible',
];

const requiredEnv = ['accessKey', 'secretKey', 'partnerTag'];
const missing = requiredEnv.filter(key => !config[key]);
if (missing.length) {
  console.error(`Missing Amazon PA API env vars: ${missing.map(k => ({ accessKey:'AMAZON_PAAPI_ACCESS_KEY', secretKey:'AMAZON_PAAPI_SECRET_KEY', partnerTag:'AMAZON_PARTNER_TAG' }[k])).join(', ')}`);
  console.error('Nothing was synced. Add credentials in Vercel/local env, then run: npm run sync:amazon');
  process.exit(2);
}

const hmac = (key, value, enc) => crypto.createHmac('sha256', key).update(value, 'utf8').digest(enc);
const sha256 = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const amzDate = date => date.toISOString().replace(/[:-]|\.\d{3}/g, '');
const shortDate = date => amzDate(date).slice(0, 8);
function signingKey(secretKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

async function paapi(operation, payload) {
  const service = 'ProductAdvertisingAPI';
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`;
  const endpoint = `/paapi5/${operation === 'GetItems' ? 'getitems' : 'searchitems'}`;
  const body = JSON.stringify(payload);
  const now = new Date();
  const xAmzDate = amzDate(now);
  const dateStamp = shortDate(now);
  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host: config.host,
    'x-amz-date': xAmzDate,
    'x-amz-target': target,
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join('');
  const canonicalRequest = ['POST', endpoint, '', canonicalHeaders, signedHeaders, sha256(body)].join('\n');
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', xAmzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(config.secretKey, dateStamp, config.region, service), stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const res = await fetch(`https://${config.host}${endpoint}`, {
    method: 'POST',
    headers: { ...headers, authorization },
    body,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.Errors?.map(e => `${e.Code}: ${e.Message}`).join(' | ') || text;
    throw new Error(`${operation} HTTP ${res.status}: ${msg}`);
  }
  return json;
}

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const map = await readJson(MAP_PATH);
const mapped = Object.values(map.items).filter(item => item.enabled !== false).slice(0, limit);
const now = new Date();
const expiresAt = new Date(now.getTime() + config.ttlHours * 3600_000).toISOString();

const pickImage = item => item.Images?.Primary?.Large || item.Images?.Primary?.Medium || null;
const normalizeItem = (slug, item) => {
  const offer = item.Offers?.Listings?.[0];
  const price = offer?.Price;
  const image = pickImage(item);
  return {
    slug,
    asin: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue || null,
    brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || null,
    detailPageUrl: item.DetailPageURL || null,
    image: image ? { url: image.URL, width: image.Width, height: image.Height } : null,
    price: price ? { display: price.DisplayAmount, amount: price.Amount, currency: price.Currency } : null,
    availability: {
      message: offer?.Availability?.Message || null,
      type: offer?.Availability?.Type || null,
      isAvailable: offer?.Availability?.Type ? !/out|unavailable|not_available/i.test(offer.Availability.Type) : null,
    },
    isPrimeEligible: offer?.ProgramEligibility?.IsPrimeEligible ?? null,
    fetchedAt: now.toISOString(),
    expiresAt,
    source: 'amazon-paapi5',
  };
};

if (mode === 'candidates') {
  const candidates = { version: 1, provider: 'amazon-paapi5-searchitems', generatedAt: now.toISOString(), items: {} };
  for (const item of mapped) {
    if (item.asin) continue;
    try {
      const result = await paapi('SearchItems', {
        PartnerTag: config.partnerTag,
        PartnerType: 'Associates',
        Marketplace: config.marketplace,
        Keywords: item.searchTerm || item.name,
        ItemCount: 3,
        Resources: resources,
      });
      candidates.items[item.slug] = (result.SearchResult?.Items || []).map(found => normalizeItem(item.slug, found));
      console.log(`candidates ${item.slug}: ${candidates.items[item.slug].length}`);
    } catch (error) {
      candidates.items[item.slug] = { error: error.message };
      console.error(`candidates failed ${item.slug}: ${error.message}`);
    }
  }
  await fs.writeFile(CANDIDATES_PATH, JSON.stringify(candidates, null, 2) + '\n');
  console.log(`Wrote ${CANDIDATES_PATH}. Review candidates, then copy confirmed ASINs to amazon-product-map.json.`);
  process.exit(0);
}

const withAsin = mapped.filter(item => item.asin);
if (!withAsin.length) {
  console.error('No products have confirmed ASINs. Fill src/data/amazon-product-map.json first, or run npm run sync:amazon:candidates to generate review candidates.');
  process.exit(3);
}
const snapshot = { version: 1, provider: 'amazon-paapi5-getitems', generatedAt: now.toISOString(), ttlHours: config.ttlHours, items: {} };
for (let i = 0; i < withAsin.length; i += 10) {
  const batch = withAsin.slice(i, i + 10);
  const result = await paapi('GetItems', {
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Marketplace: config.marketplace,
    ItemIds: batch.map(item => item.asin),
    Resources: resources,
  });
  const byAsin = new Map((result.ItemsResult?.Items || []).map(item => [item.ASIN, item]));
  for (const mappedItem of batch) {
    const found = byAsin.get(mappedItem.asin);
    if (!found) {
      snapshot.items[mappedItem.slug] = { slug: mappedItem.slug, asin: mappedItem.asin, error: 'not_returned_by_paapi', fetchedAt: now.toISOString(), expiresAt };
      continue;
    }
    snapshot.items[mappedItem.slug] = normalizeItem(mappedItem.slug, found);
    console.log(`synced ${mappedItem.slug} ${mappedItem.asin}`);
  }
}
await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${SNAPSHOT_PATH} with ${Object.keys(snapshot.items).length} items.`);
