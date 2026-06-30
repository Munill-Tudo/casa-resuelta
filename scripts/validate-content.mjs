import { articles } from '../src/data/articles.ts';
import { categories } from '../src/data/categories.ts';
const errors=[];
const catSlugs=new Set(categories.map(c=>c.slug));
const slugs=new Set();
for (const a of articles){
 if(!catSlugs.has(a.category)) errors.push(`Categoría inexistente: ${a.category}`);
 const key=`${a.category}/${a.slug}`; if(slugs.has(key)) errors.push(`Slug duplicado: ${key}`); slugs.add(key);
 if(!a.title || !a.description || !a.url || !a.updatedAt) errors.push(`Artículo incompleto: ${key}`);
 if(!a.products || a.products.length < 3) errors.push(`Faltan productos: ${key}`);
}
if(articles.length !== 30) errors.push(`La V1 debe tener 30 artículos; hay ${articles.length}`);
const p1=articles.filter(a=>a.priority==='P1').length;
if(p1 < 20) errors.push(`Pocos P1: ${p1}`);
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Content validation passed: ${articles.length} articles, ${categories.length} categories, ${p1} P1 items.`);
