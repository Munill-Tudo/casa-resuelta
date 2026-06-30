import { articles } from '../src/data/articles.ts';
import { categories } from '../src/data/categories.ts';
import { products, productUrl } from '../src/data/products.ts';
const errors=[];
const catSlugs=new Set(categories.map(c=>c.slug));
const slugs=new Set();
for (const a of articles){
 if(!catSlugs.has(a.category)) errors.push(`Categoría inexistente: ${a.category}`);
 const key=`${a.category}/${a.slug}`; if(slugs.has(key)) errors.push(`Slug duplicado: ${key}`); slugs.add(key);
 if(!a.title || !a.description || !a.url || !a.updatedAt) errors.push(`Artículo incompleto: ${key}`);
 if(!a.products || a.products.length < 3) errors.push(`Faltan productos: ${key}`);
 for (const product of (a.products || [])) {
   if(!product.name || /opción equilibrada|opción económica|opción completa/i.test(product.name)) errors.push(`Producto genérico en ${key}: ${product.name}`);
   if(!product.url || !product.url.startsWith('https://www.amazon.es/')) errors.push(`URL Amazon ausente en ${key}: ${product.name}`);
 }
}
if(articles.length !== 30) errors.push(`La V1 debe tener 30 artículos; hay ${articles.length}`);
const productSlugs=new Set(products.map(p=>p.slug));
for (const a of articles) {
 for (const product of a.products || []) {
   const path=productUrl(product.name).replace('/productos/','').replace('/','');
   if(!productSlugs.has(path)) errors.push(`Producto sin ficha: ${product.name}`);
 }
}
for (const p of products) {
 if(!p.name || !p.slug || !p.brand || !p.model || !p.shortDescription) errors.push(`Ficha producto incompleta: ${p.slug}`);
 if(p.currentPrice !== null || p.priceDisplayMode !== 'check_on_amazon') errors.push(`Precio inseguro visible: ${p.slug}`);
 if(!p.pros || p.pros.length < 3 || !p.cons || p.cons.length < 3) errors.push(`Pros/contras insuficientes: ${p.slug}`);
 if(!p.specs || p.specs.length < 8) errors.push(`Specs insuficientes: ${p.slug}`);
 if(!p.affiliateUrl || !p.affiliateUrl.startsWith('https://www.amazon.es/')) errors.push(`CTA Amazon ausente: ${p.slug}`);
}
const p1=articles.filter(a=>a.priority==='P1').length;
if(p1 < 20) errors.push(`Pocos P1: ${p1}`);
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Content validation passed: ${articles.length} articles, ${categories.length} categories, ${p1} P1 items, ${products.length} product fichas.`);
