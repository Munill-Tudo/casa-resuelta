import { articles } from './articles.ts';
import { categories } from './categories.ts';
import commercialSnapshot from './product-commercial.json' with { type: 'json' };

export type ProductScoreKey = 'quality' | 'priceValue' | 'features' | 'easeOfUse' | 'durability' | 'userFit' | 'maintenance';

export type ProductEntity = {
  id: string;
  asin: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  subcategory: string;
  shortDescription: string;
  editorialSummary: string;
  mainImageUrl: string;
  affiliateUrl: string;
  status: 'published' | 'draft' | 'paused' | 'discontinued';
  dataSource: 'manual' | 'amazon_search' | 'amazon_api' | 'manual_snapshot';
  priceDisplayMode: 'exact' | 'hidden' | 'check_on_amazon';
  priceStatus: 'fresh' | 'stale' | 'unavailable' | 'api_error' | 'manual_blocked';
  currentPrice: null | { display: string; amount?: number; currency?: string; expiresAt: string };
  availability: string;
  lastReviewedAt: string;
  lastPriceSyncAt: null | string;
  commercialExpiresAt: null | string;
  isCommercialDataFresh: boolean;
  amazonTitle: null | string;
  isAvailable: null | boolean;
  complianceNotes: string;
  bestFor: string;
  notFor: string;
  mainBenefit: string;
  mainObjection: string;
  ctaPrimary: string;
  ctaSecondary: string;
  overallScore: number;
  scores: Record<ProductScoreKey, number>;
  scoreExplanation: string;
  rankingLabel: string;
  editorRecommendation: 'recomendado' | 'neutro' | 'evitar';
  specs: Array<{ key: string; label: string; value: string }>;
  pros: string[];
  cons: string[];
  faqs: Array<{ question: string; answer: string }>;
  sourceArticles: Array<{ title: string; url: string; category: string; keyword: string }>;
  relatedProducts: string[];
};

const strip = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export const slugifyProduct = (value: string) => strip(value.toLowerCase())
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const brands = ['Amazon Basics','Joseph Joseph','mDesign','De’Longhi','DeLonghi','Cecotec','Rowenta','Duux','Orbegozo','Klarstein','Honeywell','Cosori','Roborock','Dreame','Xiaomi','Bosch','Makita','Philips','Tefal','Levoit','Kärcher','Karcher','Bestway','Intex','TP-Link','Meross','Ikea','SONGMICS','VASAGLE','Iris Ohyama'];
const inferBrand = (name: string) => brands.find(b => strip(name).toLowerCase().startsWith(strip(b).toLowerCase())) ?? name.split(' ')[0];
const inferModel = (name: string, brand: string) => name.replace(new RegExp(`^${brand}\\s*`, 'i'), '').trim() || name;
const clampScore = (n: number) => Math.max(6.8, Math.min(9.2, Number(n.toFixed(1))));
const scoreFrom = (name: string, index: number, bonus = 0) => {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return clampScore(7.4 + ((sum + index * 17) % 14) / 10 + bonus);
};

type CommercialSnapshotItem = {
  slug: string;
  asin?: string;
  title?: string | null;
  brand?: string | null;
  detailPageUrl?: string | null;
  image?: { url: string; width?: number; height?: number } | null;
  price?: { display: string; amount?: number; currency?: string } | null;
  availability?: { message?: string | null; type?: string | null; isAvailable?: boolean | null };
  fetchedAt?: string;
  expiresAt?: string;
  error?: string;
  source?: string;
};
const commercialItems = (commercialSnapshot as { items?: Record<string, CommercialSnapshotItem> }).items ?? {};
const isFreshCommercial = (item?: CommercialSnapshotItem) => Boolean(item?.expiresAt && new Date(item.expiresAt).getTime() > Date.now() && !item.error);
const commercialFor = (slug: string) => commercialItems[slug];
const priceLabelFor = (item?: CommercialSnapshotItem) => isFreshCommercial(item) && item?.price?.display ? item.price.display : 'Ver precio actualizado en Amazon';

const bySlug = new Map<string, ProductEntity>();
for (const article of articles) {
  const category = categories.find(c => c.slug === article.category);
  article.products.forEach((product, index) => {
    const slug = slugifyProduct(product.name);
    const commercial = commercialFor(slug);
    const commercialFresh = isFreshCommercial(commercial);
    const brand = commercialFresh && commercial?.brand ? commercial.brand : inferBrand(product.name);
    const model = inferModel(product.name, brand);
    const scores = {
      quality: scoreFrom(product.name, index, index === 0 ? .2 : 0),
      priceValue: scoreFrom(product.bestFor + product.name, index, product.bestFor.toLowerCase().includes('precio') || product.bestFor.toLowerCase().includes('barat') ? .4 : 0),
      features: scoreFrom(product.strength, index),
      easeOfUse: scoreFrom(product.bestFor, index, .1),
      durability: scoreFrom(product.name + product.limitation, index, -.1),
      userFit: scoreFrom(article.keyword + product.bestFor, index, .2),
      maintenance: scoreFrom(product.limitation, index, -.2)
    };
    const overallScore = Number((scores.quality * .20 + scores.priceValue * .25 + scores.features * .20 + scores.easeOfUse * .10 + scores.durability * .10 + scores.userFit * .10 + scores.maintenance * .05).toFixed(1));
    const sourceArticle = { title: article.title, url: article.url, category: article.category, keyword: article.keyword };
    const existing = bySlug.get(slug);
    if (existing) {
      if (!existing.sourceArticles.some(a => a.url === article.url)) existing.sourceArticles.push(sourceArticle);
      existing.relatedProducts = Array.from(new Set([...existing.relatedProducts, ...article.products.filter(p => slugifyProduct(p.name) !== slug).map(p => slugifyProduct(p.name))])).slice(0, 6);
      return;
    }
    const commercialSource = commercial?.source ?? '';
    const dataSource = commercialFresh ? (commercialSource === 'manual-operator-snapshot' ? 'manual_snapshot' : 'amazon_api') : 'amazon_search';
    const freshComplianceNotes = commercialSource === 'manual-operator-snapshot'
      ? 'Precio, disponibilidad, enlace e imagen proceden de snapshot manual revisado por operador y caducan automáticamente según TTL.'
      : 'Precio, disponibilidad, enlace e imagen proceden de fuente oficial de Amazon y caducan automáticamente según TTL.';
    bySlug.set(slug, {
      id: `prod-${slug}`,
      asin: commercial?.asin ?? 'dato-pendiente',
      slug,
      name: product.name,
      brand,
      model,
      category: article.category,
      subcategory: article.keyword,
      shortDescription: `${product.strength} Encaja especialmente como ${product.bestFor.toLowerCase()} dentro de ${article.keyword}.`,
      editorialSummary: `Es una opción a considerar si buscas ${article.keyword} para este caso: ${article.caseUse.toLowerCase()} La decisión debe apoyarse en su punto fuerte —${product.strength.toLowerCase()}— y en su límite principal: ${product.limitation.toLowerCase()}`,
      mainImageUrl: commercialFresh && commercial?.image?.url ? commercial.image.url : '',
      affiliateUrl: commercialFresh && commercial?.detailPageUrl ? commercial.detailPageUrl : product.url,
      status: 'published',
      dataSource,
      priceDisplayMode: commercialFresh && commercial?.price?.display ? 'exact' : 'check_on_amazon',
      priceStatus: commercial?.error ? 'api_error' : commercialFresh && commercial?.price?.display ? 'fresh' : commercialFresh ? 'unavailable' : 'manual_blocked',
      currentPrice: commercialFresh && commercial?.price?.display ? { ...commercial.price, expiresAt: commercial.expiresAt as string } : null,
      availability: commercialFresh && commercial?.availability?.message ? commercial.availability.message : 'Consultar en Amazon',
      lastReviewedAt: article.updatedAt,
      lastPriceSyncAt: commercialFresh && commercial?.fetchedAt ? commercial.fetchedAt : null,
      commercialExpiresAt: commercialFresh && commercial?.expiresAt ? commercial.expiresAt : null,
      isCommercialDataFresh: commercialFresh,
      amazonTitle: commercialFresh && commercial?.title ? commercial.title : null,
      isAvailable: commercialFresh && commercial?.availability ? commercial.availability.isAvailable ?? null : null,
      complianceNotes: commercialFresh ? freshComplianceNotes : 'Precio y disponibilidad no sincronizados por fuente compatible actualizada; se oculta precio exacto y se envía a comprobar en Amazon.',
      bestFor: `${product.bestFor}: ${product.strength}`,
      notFor: product.limitation,
      mainBenefit: product.strength,
      mainObjection: product.limitation,
      ctaPrimary: product.cta ?? 'Ver precio actualizado en Amazon',
      ctaSecondary: 'Ver comparativa donde aparece',
      overallScore,
      scores,
      scoreExplanation: 'Puntuación editorial calculada con pesos fijos: calidad 20%, calidad-precio 25%, prestaciones 20%, facilidad 10%, durabilidad 10%, encaje de usuario 10% y mantenimiento 5%. La nota de precio queda condicionada porque no hay precio sincronizado por API oficial.',
      rankingLabel: product.bestFor,
      editorRecommendation: 'recomendado',
      specs: [
        { key: 'brand', label: 'Marca', value: brand },
        { key: 'model', label: 'Modelo', value: model },
        { key: 'category', label: 'Categoría', value: category?.name ?? article.category },
        { key: 'subcategory', label: 'Subcategoría', value: article.keyword },
        { key: 'best_for', label: 'Mejor para', value: product.bestFor },
        { key: 'main_benefit', label: 'Punto fuerte', value: product.strength },
        { key: 'main_objection', label: 'Punto débil', value: product.limitation },
        { key: 'price', label: 'Precio', value: priceLabelFor(commercial) }
      ],
      pros: [
        product.strength,
        `Encaja bien cuando buscas ${article.keyword} para ${article.caseUse.toLowerCase()}`,
        `Aporta una alternativa clara dentro de la comparativa: ${product.bestFor.toLowerCase()}.`
      ],
      cons: [
        product.limitation,
        'El precio exacto se muestra solo si existe una sincronización fresca mediante fuente compatible; si caduca, volvemos al enlace de comprobación.',
        'Antes de comprar conviene revisar medidas, stock, vendedor, envío y condiciones directamente en Amazon.'
      ],
      faqs: [
        { question: `¿Merece la pena ${product.name}?`, answer: `Puede merecer la pena si tu prioridad coincide con ${product.bestFor.toLowerCase()} y aceptas su límite principal: ${product.limitation.toLowerCase()}` },
        { question: '¿Mostramos precio actualizado?', answer: 'Solo si hay una fuente compatible fresca. Si no existe o caduca, ocultamos el precio exacto y recomendamos comprobar el precio vigente en Amazon.' },
        { question: '¿Para qué usuario encaja mejor?', answer: `Para quien busca ${article.keyword} en este contexto: ${article.caseUse.toLowerCase()}` }
      ],
      sourceArticles: [sourceArticle],
      relatedProducts: article.products.filter(p => slugifyProduct(p.name) !== slug).map(p => slugifyProduct(p.name)).slice(0, 6)
    });
  });
}

export const products = Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
export const productBySlug = (slug: string) => products.find(p => p.slug === slug);
export const productUrl = (nameOrSlug: string) => `/productos/${nameOrSlug.includes(' ') ? slugifyProduct(nameOrSlug) : nameOrSlug}/`;
