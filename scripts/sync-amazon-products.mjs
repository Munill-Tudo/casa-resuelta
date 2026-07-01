import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const MAP_PATH = path.join(ROOT, 'src/data/amazon-product-map.json');
const SNAPSHOT_PATH = path.join(ROOT, 'src/data/product-commercial.json');
const CANDIDATES_PATH = path.join(ROOT, 'src/data/amazon-product-candidates.json');

const env = process.env;
const args = new Set(process.argv.slice(2));
const mode = args.has('--candidates') ? 'candidates' : 'sync';
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const provider = (env.AMAZON_PRODUCT_API_PROVIDER || env.AMAZON_DATA_PROVIDER || 'creators').toLowerCase();
const common = {
  partnerTag: env.AMAZON_PARTNER_TAG,
  marketplace: env.AMAZON_MARKETPLACE || 'www.amazon.es',
  ttlHours: Number(env.AMAZON_SNAPSHOT_TTL_HOURS || 24),
};
const paapiConfig = {
  accessKey: env.AMAZON_PAAPI_ACCESS_KEY,
  secretKey: env.AMAZON_PAAPI_SECRET_KEY,
  host: env.AMAZON_PAAPI_HOST || 'webservices.amazon.es',
  region: env.AMAZON_PAAPI_REGION || 'eu-west-1',
};
const creatorsConfig = {
  credentialId: env.AMAZON_CREATORS_CREDENTIAL_ID,
  credentialSecret: env.AMAZON_CREATORS_CREDENTIAL_SECRET,
  credentialVersion: env.AMAZON_CREATORS_CREDENTIAL_VERSION || '3.2',
  apiBase: env.AMAZON_CREATORS_API_BASE || 'https://creatorsapi.amazon',
  tokenEndpoint: env.AMAZON_CREATORS_TOKEN_ENDPOINT,
  tokenScope: env.AMAZON_CREATORS_SCOPE,
};

const paapiResources = [
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
const creatorsResources = [
  'images.primary.large',
  'images.primary.medium',
  'itemInfo.title',
  'itemInfo.byLineInfo',
  'offersV2.listings.price',
  'offersV2.listings.availability',
  'offersV2.listings.condition',
  'offersV2.listings.type',
  'offersV2.listings.isBuyBoxWinner',
  'offersV2.listings.merchantInfo',
];

function failMissing(message, vars) {
  console.error(message);
  console.error(`Missing env vars: ${vars.join(', ')}`);
  console.error('Nothing was synced. Product pages will keep the safe fallback: “Ver precio actualizado en Amazon”.');
  process.exit(2);
}
if (!common.partnerTag) failMissing('Amazon partner tag is required for both Creators API and PA API.', ['AMAZON_PARTNER_TAG']);
if (provider === 'creators') {
  const missing = [];
  if (!creatorsConfig.credentialId) missing.push('AMAZON_CREATORS_CREDENTIAL_ID');
  if (!creatorsConfig.credentialSecret) missing.push('AMAZON_CREATORS_CREDENTIAL_SECRET');
  if (!creatorsConfig.credentialVersion) missing.push('AMAZON_CREATORS_CREDENTIAL_VERSION');
  if (missing.length) failMissing('Creators API is the default provider. Configure Creators API credentials before syncing live Amazon data.', missing);
} else if (provider === 'paapi') {
  const missing = [];
  if (!paapiConfig.accessKey) missing.push('AMAZON_PAAPI_ACCESS_KEY');
  if (!paapiConfig.secretKey) missing.push('AMAZON_PAAPI_SECRET_KEY');
  if (missing.length) failMissing('PA API provider selected, but PA API credentials are missing.', missing);
} else {
  console.error(`Unsupported AMAZON_PRODUCT_API_PROVIDER=${provider}. Use "creators" or "paapi".`);
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
    host: paapiConfig.host,
    'x-amz-date': xAmzDate,
    'x-amz-target': target,
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join('');
  const canonicalRequest = ['POST', endpoint, '', canonicalHeaders, signedHeaders, sha256(body)].join('\n');
  const credentialScope = `${dateStamp}/${paapiConfig.region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', xAmzDate, credentialScope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(paapiConfig.secretKey, dateStamp, paapiConfig.region, service), stringToSign, 'hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${paapiConfig.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const res = await fetch(`https://${paapiConfig.host}${endpoint}`, { method: 'POST', headers: { ...headers, authorization }, body });
  return parseAmazonResponse(res, operation);
}

function creatorsTokenEndpoint() {
  if (creatorsConfig.tokenEndpoint) return creatorsConfig.tokenEndpoint;
  const version = creatorsConfig.credentialVersion;
  const endpoints = {
    '2.1': 'https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token',
    '2.2': 'https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token',
    '2.3': 'https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token',
    '3.1': 'https://api.amazon.com/auth/o2/token',
    '3.2': 'https://api.amazon.co.uk/auth/o2/token',
    '3.3': 'https://api.amazon.co.jp/auth/o2/token',
  };
  return endpoints[version] || endpoints['3.2'];
}
let cachedToken = null;
async function getCreatorsToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.accessToken;
  const version = creatorsConfig.credentialVersion;
  const endpoint = creatorsTokenEndpoint();
  const v3 = String(version).startsWith('3.');
  const scope = creatorsConfig.tokenScope || (v3 ? 'creatorsapi::default' : 'creatorsapi/default');
  const body = v3
    ? JSON.stringify({ grant_type: 'client_credentials', client_id: creatorsConfig.credentialId, client_secret: creatorsConfig.credentialSecret, scope })
    : new URLSearchParams({ grant_type: 'client_credentials', client_id: creatorsConfig.credentialId, client_secret: creatorsConfig.credentialSecret, scope }).toString();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': v3 ? 'application/json' : 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await parseAmazonResponse(res, 'Token');
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: now + Number(json.expires_in || 3600) * 1000,
  };
  return cachedToken.accessToken;
}
async function creators(operation, payload) {
  const token = await getCreatorsToken();
  const version = creatorsConfig.credentialVersion;
  const auth = String(version).startsWith('2.') ? `Bearer ${token}, Version ${version}` : `Bearer ${token}`;
  const endpoint = `${creatorsConfig.apiBase.replace(/\/$/, '')}/catalog/v1/${operation === 'GetItems' ? 'getItems' : 'searchItems'}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: auth,
      'content-type': 'application/json',
      'x-marketplace': common.marketplace,
    },
    body: JSON.stringify(payload),
  });
  return parseAmazonResponse(res, operation);
}
async function amazon(operation, payload) {
  return provider === 'creators' ? creators(operation, payload) : paapi(operation, payload);
}
async function parseAmazonResponse(res, operation) {
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.errors?.map(e => `${e.code || e.Code}: ${e.message || e.Message}`).join(' | ')
      || json?.Errors?.map(e => `${e.Code}: ${e.Message}`).join(' | ')
      || text;
    throw new Error(`${operation} HTTP ${res.status}: ${msg}`);
  }
  return json;
}

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const map = await readJson(MAP_PATH);
const mapped = Object.values(map.items).filter(item => item.enabled !== false).slice(0, limit);
const now = new Date();
const expiresAt = new Date(now.getTime() + common.ttlHours * 3600_000).toISOString();

const readPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const first = (...values) => values.find(value => value !== undefined && value !== null);
const pickImage = item => first(
  readPath(item, 'images.primary.large'),
  readPath(item, 'Images.Primary.Large'),
  readPath(item, 'images.primary.medium'),
  readPath(item, 'Images.Primary.Medium'),
  readPath(item, 'images.primary.small')
) || null;
const pickOffer = item => first(item.offersV2?.listings?.[0], item.Offers?.Listings?.[0]) || null;
const pickPrice = offer => first(offer?.price, offer?.Price) || null;
const pickAvailability = offer => first(offer?.availability, offer?.Availability) || null;
const pickTitle = item => first(readPath(item, 'itemInfo.title.displayValue'), readPath(item, 'ItemInfo.Title.DisplayValue')) || null;
const pickBrand = item => first(readPath(item, 'itemInfo.byLineInfo.brand.displayValue'), readPath(item, 'ItemInfo.ByLineInfo.Brand.DisplayValue')) || null;
const pickDetailUrl = item => first(item.detailPageURL, item.DetailPageURL) || null;
const pickAsin = item => first(item.asin, item.ASIN) || null;
const normalizePrice = price => price ? {
  display: first(price.displayAmount, price.DisplayAmount),
  amount: first(price.amount, price.Amount),
  currency: first(price.currency, price.Currency),
} : null;
const normalizeImage = image => image?.url || image?.URL ? { url: image.url || image.URL, width: image.width || image.Width, height: image.height || image.Height } : null;
const normalizeItem = (slug, item) => {
  const offer = pickOffer(item);
  const price = normalizePrice(pickPrice(offer));
  const image = normalizeImage(pickImage(item));
  const availability = pickAvailability(offer);
  const availabilityType = first(availability?.type, availability?.Type);
  return {
    slug,
    asin: pickAsin(item),
    title: pickTitle(item),
    brand: pickBrand(item),
    detailPageUrl: pickDetailUrl(item),
    image,
    price: price?.display ? price : null,
    availability: {
      message: first(availability?.message, availability?.Message) || null,
      type: availabilityType || null,
      isAvailable: availabilityType ? !/out|unavailable|not_available/i.test(availabilityType) : null,
    },
    isPrimeEligible: first(offer?.programEligibility?.isPrimeEligible, offer?.ProgramEligibility?.IsPrimeEligible) ?? null,
    isBuyBoxWinner: first(offer?.isBuyBoxWinner, offer?.IsBuyBoxWinner) ?? null,
    fetchedAt: now.toISOString(),
    expiresAt,
    source: provider === 'creators' ? 'amazon-creators-api' : 'amazon-paapi5',
  };
};
const itemsFromResult = result => result.itemResults?.items || result.itemsResult?.items || result.ItemsResult?.Items || result.SearchResult?.Items || result.searchResult?.items || [];

if (mode === 'candidates') {
  const candidates = { version: 2, provider: provider === 'creators' ? 'amazon-creators-api-searchitems' : 'amazon-paapi5-searchitems', generatedAt: now.toISOString(), marketplace: common.marketplace, items: {} };
  for (const item of mapped) {
    if (item.asin) continue;
    try {
      const result = await amazon('SearchItems', provider === 'creators' ? {
        partnerTag: common.partnerTag,
        marketplace: common.marketplace,
        keywords: item.searchTerm || item.name,
        itemCount: 3,
        resources: creatorsResources,
      } : {
        PartnerTag: common.partnerTag,
        PartnerType: 'Associates',
        Marketplace: common.marketplace,
        Keywords: item.searchTerm || item.name,
        ItemCount: 3,
        Resources: paapiResources,
      });
      candidates.items[item.slug] = itemsFromResult(result).map(found => normalizeItem(item.slug, found));
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
const snapshot = { version: 2, provider: provider === 'creators' ? 'amazon-creators-api-getitems' : 'amazon-paapi5-getitems', generatedAt: now.toISOString(), ttlHours: common.ttlHours, marketplace: common.marketplace, items: {} };
for (let i = 0; i < withAsin.length; i += 10) {
  const batch = withAsin.slice(i, i + 10);
  const result = await amazon('GetItems', provider === 'creators' ? {
    partnerTag: common.partnerTag,
    marketplace: common.marketplace,
    itemIds: batch.map(item => item.asin),
    itemIdType: 'ASIN',
    resources: creatorsResources,
  } : {
    PartnerTag: common.partnerTag,
    PartnerType: 'Associates',
    Marketplace: common.marketplace,
    ItemIds: batch.map(item => item.asin),
    Resources: paapiResources,
  });
  const byAsin = new Map(itemsFromResult(result).map(item => [pickAsin(item), item]));
  for (const mappedItem of batch) {
    const found = byAsin.get(mappedItem.asin);
    if (!found) {
      snapshot.items[mappedItem.slug] = { slug: mappedItem.slug, asin: mappedItem.asin, error: 'not_returned_by_amazon_api', fetchedAt: now.toISOString(), expiresAt };
      continue;
    }
    snapshot.items[mappedItem.slug] = normalizeItem(mappedItem.slug, found);
    console.log(`synced ${mappedItem.slug} ${mappedItem.asin}`);
  }
}
await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${SNAPSHOT_PATH} with ${Object.keys(snapshot.items).length} items.`);
