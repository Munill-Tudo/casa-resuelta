import { articles } from '../data/articles';
import { categories } from '../data/categories';
import { products } from '../data/products';
export async function GET() {
 const base='https://casa-resuelta.vercel.app';
 const staticPages=['/','/categorias/','/mejores/','/comparativas/','/guias/','/reviews/','/marcas/','/metodologia/','/afiliacion/','/sobre-nosotros/','/contacto/','/aviso-legal/','/privacidad/','/cookies/'];
 const urls=[...staticPages,...categories.map(c=>`/${c.slug}/`),...articles.map(a=>a.url),...products.map(p=>`/productos/${p.slug}/`)];
 const body=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${base}${u}</loc><lastmod>2026-06-30</lastmod></url>`).join('')}</urlset>`;
 return new Response(body,{headers:{'Content-Type':'application/xml'}});
}
