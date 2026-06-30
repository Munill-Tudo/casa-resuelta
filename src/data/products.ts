import { articles } from './articles.ts';
import { categories } from './categories.ts';

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
  dataSource: 'manual' | 'amazon_search' | 'amazon_api';
  priceDisplayMode: 'exact' | 'hidden' | 'check_on_amazon';
  priceStatus: 'fresh' | 'stale' | 'unavailable' | 'api_error' | 'manual_blocked';
  currentPrice: null;
  availability: 'Consultar en Amazon';
  lastReviewedAt: string;
  lastPriceSyncAt: null;
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

const bySlug = new Map<string, ProductEntity>();
for (const article of articles) {
  const category = categories.find(c => c.slug === article.category);
  article.products.forEach((product, index) => {
    const slug = slugifyProduct(product.name);
    const brand = inferBrand(product.name);
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
    bySlug.set(slug, {
      id: `prod-${slug}`,
      asin: 'dato-pendiente',
      slug,
      name: product.name,
      brand,
      model,
      category: article.category,
      subcategory: article.keyword,
      shortDescription: `${product.strength} Encaja especialmente como ${product.bestFor.toLowerCase()} dentro de ${article.keyword}.`,
      editorialSummary: `Es una opción a considerar si buscas ${article.keyword} para este caso: ${article.caseUse.toLowerCase()} La decisión debe apoyarse en su punto fuerte —${product.strength.toLowerCase()}— y en su límite principal: ${product.limitation.toLowerCase()}`,
      mainImageUrl: '',
      affiliateUrl: product.url,
      status: 'published',
      dataSource: 'amazon_search',
      priceDisplayMode: 'check_on_amazon',
      priceStatus: 'manual_blocked',
      currentPrice: null,
      availability: 'Consultar en Amazon',
      lastReviewedAt: article.updatedAt,
      lastPriceSyncAt: null,
      complianceNotes: 'Precio y disponibilidad no sincronizados por API oficial; se oculta precio exacto y se envía a comprobar en Amazon.',
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
        { key: 'price', label: 'Precio', value: 'Ver precio actualizado en Amazon' }
      ],
      pros: [
        product.strength,
        `Encaja bien cuando buscas ${article.keyword} para ${article.caseUse.toLowerCase()}`,
        `Aporta una alternativa clara dentro de la comparativa: ${product.bestFor.toLowerCase()}.`
      ],
      cons: [
        product.limitation,
        'El precio exacto no se muestra porque no está sincronizado mediante fuente oficial actualizada.',
        'Antes de comprar conviene revisar medidas, stock, vendedor, envío y condiciones directamente en Amazon.'
      ],
      faqs: [
        { question: `¿Merece la pena ${product.name}?`, answer: `Puede merecer la pena si tu prioridad coincide con ${product.bestFor.toLowerCase()} y aceptas su límite principal: ${product.limitation.toLowerCase()}` },
        { question: '¿Mostramos precio actualizado?', answer: 'No. Hasta integrar una API oficial o fuente compatible, ocultamos el precio exacto y recomendamos comprobar el precio vigente en Amazon.' },
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
