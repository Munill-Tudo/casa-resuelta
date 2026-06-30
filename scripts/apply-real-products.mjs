import { articles } from '../src/data/articles.ts';
import { writeFileSync } from 'node:fs';

const amazonSearch = (q) => `https://www.amazon.es/s?k=${encodeURIComponent(q)}`;
const p = (name, bestFor, strength, limitation, price='Ver precio', query=name) => ({
  name,
  bestFor,
  strength,
  limitation,
  price,
  url: amazonSearch(query),
  cta: 'Ver precio en Amazon'
});

const productsBySlug = {
  'mejores-ventiladores-silenciosos': [
    p('Rowenta Turbo Silence Extreme+ VU5840', 'Mejor global', 'Ventilador de pedestal muy popular por su modo silencioso y buen caudal para dormitorio.', 'Ocupa más que un ventilador de torre y hay que revisar altura/espacio disponible.', 'Ver precio', 'Rowenta Turbo Silence Extreme VU5840'),
    p('Cecotec EnergySilence 890 Skyline', 'Calidad-precio', 'Formato torre, mando y temporizador para habitaciones donde importa guardar fácil.', 'Menos caudal directo que un pedestal grande si buscas aire muy potente.', 'Ver precio', 'Cecotec EnergySilence 890 Skyline'),
    p('Duux Whisper Flex Smart', 'Opción premium', 'Diseño cuidado, app y funcionamiento silencioso para uso diario en dormitorio o salón.', 'Solo compensa si valoras conectividad y acabado premium.', 'Ver precio', 'Duux Whisper Flex Smart')
  ],
  'aire-acondicionado-portatil-sin-instalacion': [
    p('De’Longhi Pinguino PAC N82 ECO', 'Mejor equilibrio', 'Modelo conocido de aire portátil para habitaciones medianas sin instalación fija.', 'Necesita salida de aire a ventana y no sustituye a un split bien instalado.', 'Ver precio', 'DeLonghi Pinguino PAC N82 ECO'),
    p('Cecotec ForceClima 9050', 'Presupuesto contenido', 'Alternativa habitual para quien busca frío puntual con coste más ajustado.', 'Ruido y eficiencia dependen mucho de la estancia y del kit de ventana.', 'Ver precio', 'Cecotec ForceClima 9050'),
    p('Olimpia Splendid Dolceclima Compact 8 P', 'Espacios pequeños', 'Formato compacto para habitaciones donde el tamaño importa más que la potencia máxima.', 'Puede quedarse corto en salones grandes o habitaciones muy soleadas.', 'Ver precio', 'Olimpia Splendid Dolceclima Compact 8 P')
  ],
  'enfriar-habitacion-sin-aire-acondicionado': [
    p('Orbegozo SF 0147 ventilador de pie', 'Mover aire con poco gasto', 'Solución simple para mejorar sensación térmica sin instalación ni obra.', 'No baja la temperatura real: solo mejora ventilación y confort.', 'Ver precio', 'Orbegozo SF 0147 ventilador de pie'),
    p('Amazon Basics cortina opaca térmica', 'Bloquear sol directo', 'Ayuda a reducir entrada de calor en dormitorios con mucha exposición.', 'Debe combinarse con ventilación nocturna y medidas adecuadas.', 'Ver precio', 'Amazon Basics cortina opaca termica'),
    p('Klarstein Skyscraper Ice', 'Climatizador evaporativo', 'Alternativa intermedia para aire más fresco en ambientes secos.', 'No funciona igual en zonas húmedas y no equivale a aire acondicionado.', 'Ver precio', 'Klarstein Skyscraper Ice')
  ],
  'ventilador-torre-vs-pedestal': [
    p('Cecotec EnergySilence 890 Skyline', 'Torre compacta', 'Ocupa poco, se guarda fácil y queda discreto en salón o dormitorio.', 'Menos sensación de chorro directo que un pedestal potente.', 'Ver precio', 'Cecotec EnergySilence 890 Skyline'),
    p('Rowenta Turbo Silence Extreme+ VU5840', 'Pedestal potente', 'Mejor si quieres caudal alto y dirigir el aire con más precisión.', 'Más voluminoso y menos discreto visualmente.', 'Ver precio', 'Rowenta Turbo Silence Extreme VU5840'),
    p('Honeywell QuietSet HYF290E', 'Torre silenciosa', 'Interesante si priorizas ruido bajo y varios niveles de ventilación.', 'Conviene revisar disponibilidad y repuestos antes de elegirlo.', 'Ver precio', 'Honeywell QuietSet HYF290E')
  ],
  'mejores-organizadores-cocina-pequena': [
    p('Joseph Joseph CupboardStore organizador de estante', 'Armarios pequeños', 'Aprovecha altura interior y ayuda a separar platos, tazas o conservas.', 'Hay que medir el armario antes de comprar.', 'Ver precio', 'Joseph Joseph CupboardStore organizador estante'),
    p('mDesign Lazy Susan organizador giratorio', 'Esquinas y despensa', 'Hace visibles botes y especias que suelen quedar al fondo.', 'No encaja bien con envases altos o armarios estrechos.', 'Ver precio', 'mDesign Lazy Susan organizador giratorio'),
    p('Amazon Basics estante organizador apilable', 'Solución barata', 'Estante simple para duplicar espacio útil sin montaje complejo.', 'No es tan robusto como sistemas metálicos premium.', 'Ver precio', 'Amazon Basics estante organizador apilable cocina')
  ],
  'freidora-aire-vs-horno-sobremesa': [
    p('Cosori Turbo Blaze 6L', 'Freidora de aire familiar', 'Buena para cenas rápidas, raciones medianas y uso frecuente entre semana.', 'Ocupa encimera y no sustituye un horno grande para bandejas amplias.', 'Ver precio', 'Cosori Turbo Blaze 6L'),
    p('Cecotec Bake&Toast 1090 White', 'Horno de sobremesa', 'Más versátil para tostadas, gratinar y recipientes que no caben en cesta.', 'Precalienta y cocina distinto a una freidora de aire de cesta.', 'Ver precio', 'Cecotec Bake Toast 1090 White'),
    p('Ninja Foodi MAX Dual Zone AF400EU', 'Cocinar dos cosas a la vez', 'Dos zonas independientes para familias que preparan varios alimentos.', 'Más caro y grande: solo compensa si se usa mucho.', 'Ver precio', 'Ninja Foodi MAX Dual Zone AF400EU')
  ],
  'freidoras-aire-pequenas': [
    p('Cosori Lite 3,8L', '1-2 personas', 'Tamaño contenido, manejo sencillo y capacidad suficiente para uso diario moderado.', 'Pequeña para familias o batch cooking.', 'Ver precio', 'Cosori Lite 3.8L freidora aire'),
    p('Philips Essential Airfryer HD9252/90', 'Marca consolidada', 'Opción compacta de marca conocida y ecosistema de recetas amplio.', 'Suele ser menos barata que marcas emergentes.', 'Ver precio', 'Philips Essential Airfryer HD9252/90'),
    p('Xiaomi Mi Smart Air Fryer 3.5L', 'Control desde app', 'Buena si valoras programación y diseño compacto.', 'La conectividad no es imprescindible para todo el mundo.', 'Ver precio', 'Xiaomi Mi Smart Air Fryer 3.5L')
  ],
  'organizador-bajo-fregadero': [
    p('Joseph Joseph CupboardStore Expandable', 'Aprovechar tuberías', 'Sistema regulable para rodear sifón y ganar baldas bajo fregadero.', 'Requiere medir hueco y altura disponible.', 'Ver precio', 'Joseph Joseph CupboardStore Expandable bajo fregadero'),
    p('YouCopia SinkSuite organizador bajo fregadero', 'Productos de limpieza', 'Cajones extraíbles útiles para botellas y bayetas.', 'Puede quedarse corto si guardas garrafas grandes.', 'Ver precio', 'YouCopia SinkSuite bajo fregadero'),
    p('mDesign organizador bajo fregadero con cajones', 'Orden visual', 'Permite separar recambios, esponjas y sprays por niveles.', 'No todos los modelos soportan mucho peso.', 'Ver precio', 'mDesign organizador bajo fregadero cajones')
  ],
  'aspiradoras-sin-cable-calidad-precio': [
    p('Rowenta X-Force Flex 12.60', 'Calidad-precio doméstica', 'Buena alternativa para casa por accesorios, tubo flexible y potencia equilibrada.', 'Autonomía real varía mucho según modo de potencia.', 'Ver precio', 'Rowenta X-Force Flex 12.60'),
    p('Dyson V15 Detect', 'Uso intensivo premium', 'Potencia, filtrado y detección de polvo para quien aspira a menudo.', 'Precio alto; no compensa para limpiezas ocasionales.', 'Ver precio', 'Dyson V15 Detect'),
    p('Cecotec Conga Rockstar 2500', 'Presupuesto ajustado', 'Opción con muchos accesorios para quien prioriza coste inicial.', 'Calidad percibida y servicio pueden no igualar gamas premium.', 'Ver precio', 'Cecotec Conga Rockstar 2500')
  ],
  'robot-aspirador-pelo-mascota': [
    p('Roborock Q Revo', 'Mejor equilibrio mascotas', 'Base de autovaciado/fregado y buena navegación para pelo diario.', 'La base ocupa espacio y requiere mantenimiento.', 'Ver precio', 'Roborock Q Revo'),
    p('iRobot Roomba j7+', 'Evitar obstáculos', 'Reconocimiento de objetos interesante en casas con mascotas y juguetes.', 'Precio superior y fregado no es su punto fuerte.', 'Ver precio', 'iRobot Roomba j7+'),
    p('Cecotec Conga 2290 Ultra Home', 'Presupuesto contenido', 'Opción económica con base para quien quiere automatizar sin ir a gama alta.', 'Navegación y refinamiento inferiores a modelos premium.', 'Ver precio', 'Cecotec Conga 2290 Ultra Home')
  ],
  'errores-comprar-robot-aspirador': [
    p('Roborock Q8 Max+', 'Evitar error: mala navegación', 'Buen ejemplo de robot con navegación LiDAR y base de vaciado.', 'No todos los hogares necesitan base automática.', 'Ver precio', 'Roborock Q8 Max+'),
    p('iRobot Roomba Combo j5+', 'Evitar error: obstáculos', 'Interesante si preocupa evitar objetos y alfombras.', 'Hay que revisar compatibilidad del fregado con tu suelo.', 'Ver precio', 'iRobot Roomba Combo j5+'),
    p('Dreame L10s Ultra', 'Evitar error: mantenimiento', 'Automatiza parte del fregado y limpieza para uso frecuente.', 'Sistema más caro y con más consumibles.', 'Ver precio', 'Dreame L10s Ultra')
  ],
  'aspiradoras-mano-coche-sofa': [
    p('Black+Decker Dustbuster BHHV520BFP', 'Sofá y mascotas', 'Aspiradora de mano con accesorio para pelos y uso rápido.', 'No sustituye una aspiradora principal.', 'Ver precio', 'Black Decker Dustbuster BHHV520BFP'),
    p('Bosch Move Lithium BHN24L', 'Coche y migas', 'Ligera y práctica para pequeñas limpiezas sin montar nada.', 'Depósito pequeño para limpiezas largas.', 'Ver precio', 'Bosch Move Lithium BHN24L'),
    p('Shark WandVac 2.0', 'Diseño compacto', 'Muy manejable para tener siempre a mano.', 'Precio más alto para la capacidad que ofrece.', 'Ver precio', 'Shark WandVac 2.0')
  ],
  'luces-solares-jardin-terraza': [
    p('Philips Hue Outdoor Lightstrip', 'Ambiente premium', 'Iluminación exterior conectada y decorativa para terrazas cuidadas.', 'Necesita ecosistema Hue y presupuesto mayor.', 'Ver precio', 'Philips Hue Outdoor Lightstrip'),
    p('Aigostar luces solares jardín', 'Balizamiento barato', 'Solución sencilla para marcar caminos o macetas sin cable.', 'Autonomía depende mucho del sol y la batería.', 'Ver precio', 'Aigostar luces solares jardin'),
    p('Litogo focos solares exterior con sensor', 'Seguridad puntual', 'Útiles para zonas de paso con sensor de movimiento.', 'No esperes iluminación decorativa cálida de alta gama.', 'Ver precio', 'Litogo focos solares exterior sensor')
  ],
  'toldos-vela-terraza': [
    p('Sekey toldo vela impermeable triangular', 'Sombra económica', 'Fácil de instalar para crear sombra en terraza o patio pequeño.', 'Hay que tensarlo bien y prever viento/lluvia.', 'Ver precio', 'Sekey toldo vela triangular'),
    p('Sol Royal SolVision PS9', 'Mayor resistencia', 'Marca habitual en toldos vela con varias medidas y formatos.', 'Requiere buenos puntos de anclaje.', 'Ver precio', 'Sol Royal SolVision PS9 toldo vela'),
    p('Amazon Basics toldo vela rectangular', 'Rectangular básico', 'Opción simple si necesitas cubrir mesa o zona concreta.', 'Medidas y anclajes son decisivos.', 'Ver precio', 'Amazon Basics toldo vela rectangular')
  ],
  'muebles-plegables-terraza-pequena': [
    p('IKEA ÄPPLARÖ mesa abatible exterior', 'Terraza estrecha', 'Mesa abatible de madera para ganar superficie solo cuando se usa.', 'Requiere mantenimiento de madera exterior.', 'Ver precio', 'mesa abatible exterior madera terraza'),
    p('Keter Unity XL', 'Carrito auxiliar', 'Mueble auxiliar/resina para preparar y guardar en exterior.', 'Más útil en terrazas medianas que balcones muy pequeños.', 'Ver precio', 'Keter Unity XL'),
    p('KG Kit Garden set bistró plegable', 'Rincón para dos', 'Mesa y sillas plegables para balcón o terraza pequeña.', 'Confort limitado para comidas largas.', 'Ver precio', 'set bistro plegable terraza')
  ],
  'robots-limpiafondos-piscina-desmontable': [
    p('Bestway Aquatronix', 'Piscina desmontable', 'Robot inalámbrico conocido para piscinas elevadas y desmontables.', 'No escala paredes como robots premium.', 'Ver precio', 'Bestway Aquatronix'),
    p('Intex ZX300 Deluxe', 'Piscinas Intex', 'Limpiafondos automático compatible con muchas piscinas elevadas Intex.', 'Depende del caudal de depuradora compatible.', 'Ver precio', 'Intex ZX300 Deluxe'),
    p('Dolphin E10', 'Más completo', 'Robot de suelo más robusto para piscinas pequeñas/medianas.', 'Precio superior para uso ocasional.', 'Ver precio', 'Dolphin E10 limpiafondos')
  ],
  'depuradora-arena-vs-cartucho': [
    p('Intex 26644 depuradora de arena', 'Menos mantenimiento', 'Filtro de arena para piscinas desmontables medianas.', 'Mayor inversión inicial y ocupa más.', 'Ver precio', 'Intex 26644 depuradora arena'),
    p('Bestway Flowclear depuradora de cartucho', 'Piscina pequeña', 'Sistema sencillo y barato para piscinas pequeñas de temporada.', 'Cartuchos se cambian con frecuencia.', 'Ver precio', 'Bestway Flowclear depuradora cartucho'),
    p('Intex Krystal Clear 28604', 'Entrada económica', 'Depuradora de cartucho básica para empezar sin complicarse.', 'Limitada si el volumen de agua crece.', 'Ver precio', 'Intex Krystal Clear 28604')
  ],
  'mantener-piscina-desmontable-limpia': [
    p('Intex kit mantenimiento piscina', 'Limpieza manual básica', 'Red, cepillo y aspirador manual para rutina semanal.', 'Requiere constancia: no automatiza la limpieza.', 'Ver precio', 'Intex kit mantenimiento piscina'),
    p('Bestway dispensador químico flotante', 'Cloración sencilla', 'Ayuda a mantener tratamiento repartido sin estar pendiente cada hora.', 'No sustituye medir pH/cloro correctamente.', 'Ver precio', 'Bestway dispensador químico flotante'),
    p('Gre analizador pH cloro', 'Control del agua', 'Tiras o kit de análisis para evitar agua verde por falta de control.', 'Hay que interpretar y actuar con productos adecuados.', 'Ver precio', 'Gre analizador pH cloro piscina')
  ],
  'herramientas-basicas-casa': [
    p('Bosch Home and Garden maletín X-Line', 'Kit inicial', 'Brocas y puntas habituales para pequeños arreglos domésticos.', 'No sustituye herramientas profesionales intensivas.', 'Ver precio', 'Bosch X-Line maletin herramientas'),
    p('Stanley STHT0-73929 caja herramientas', 'Ordenar herramientas', 'Caja sencilla para tener lo básico localizado.', 'La caja no trae todas las herramientas necesarias.', 'Ver precio', 'Stanley caja herramientas STHT0-73929'),
    p('Mannesmann M29065 maletín herramientas', 'Kit completo económico', 'Maletín amplio para tareas domésticas variadas.', 'Calidad suficiente para casa, no para uso profesional diario.', 'Ver precio', 'Mannesmann M29065')
  ],
  'taladros-atornilladores-calidad-precio': [
    p('Bosch EasyDrill 18V-40', 'Uso doméstico equilibrado', 'Taladro atornillador cómodo para muebles, baldas y pequeños trabajos.', 'No es para hormigón duro intensivo.', 'Ver precio', 'Bosch EasyDrill 18V-40'),
    p('BLACK+DECKER BDCDD12K', 'Presupuesto bajo', 'Ligero y suficiente para montaje de muebles y tornillería básica.', 'Menos potencia que equipos de 18V.', 'Ver precio', 'BLACK+DECKER BDCDD12K'),
    p('Makita DHP453', 'Más robusto', 'Alternativa más seria si vas a usarlo con frecuencia.', 'Puede ser excesivo para tareas muy ocasionales.', 'Ver precio', 'Makita DHP453')
  ],
  'colgar-sin-taladrar': [
    p('tesa Powerstrips ganchos adhesivos', 'Cuadros ligeros', 'Solución limpia para colgar objetos pequeños sin agujeros.', 'No sirve para cargas pesadas ni paredes delicadas sin revisar.', 'Ver precio', 'tesa Powerstrips ganchos'),
    p('Command tiras para cuadros', 'Alquiler y paredes lisas', 'Muy usadas para cuadros y decoración ligera removible.', 'La carga máxima y superficie importan mucho.', 'Ver precio', 'Command tiras cuadros'),
    p('Fischer No Tools soporte adhesivo', 'Baño/cocina sin taladro', 'Gama adhesiva pensada para accesorios sin perforar azulejo.', 'Debe curar bien y no sobrecargar.', 'Ver precio', 'Fischer No Tools adhesivo')
  ],
  'enchufes-inteligentes-casa': [
    p('TP-Link Tapo P110', 'Medir consumo', 'Enchufe WiFi con monitorización de energía para electrodomésticos pequeños.', 'No usar en cargas que superen especificación.', 'Ver precio', 'TP-Link Tapo P110'),
    p('Amazon Smart Plug', 'Alexa sencillo', 'Integración directa si ya usas Alexa en casa.', 'Menos interesante fuera del ecosistema Amazon.', 'Ver precio', 'Amazon Smart Plug'),
    p('Meross MSS210', 'HomeKit/SmartThings según versión', 'Alternativa popular con varias integraciones según modelo.', 'Hay que revisar compatibilidad exacta antes de comprar.', 'Ver precio', 'Meross MSS210')
  ],
  'bombillas-inteligentes-guia': [
    p('Philips Hue White & Color Ambiance E27', 'Ecosistema premium', 'Bombilla con gran ecosistema, escenas y accesorios.', 'Precio alto y conviene valorar puente Hue.', 'Ver precio', 'Philips Hue White Color Ambiance E27'),
    p('TP-Link Tapo L530E', 'Calidad-precio WiFi', 'Bombilla RGB WiFi sin hub para empezar fácil.', 'Menos ecosistema de accesorios que Hue.', 'Ver precio', 'TP-Link Tapo L530E'),
    p('Ledvance Smart+ WiFi E27', 'Alternativa sencilla', 'Opción habitual para luz inteligente básica por WiFi.', 'App y compatibilidades pueden variar por modelo.', 'Ver precio', 'Ledvance Smart+ WiFi E27')
  ],
  'repetidores-wifi-casa-grande': [
    p('TP-Link RE705X', 'WiFi 6', 'Repetidor potente para ampliar cobertura si el router acompaña.', 'Un sistema mesh puede ir mejor en casas grandes.', 'Ver precio', 'TP-Link RE705X'),
    p('AVM FRITZ!Repeater 1200 AX', 'Routers FRITZ!', 'Muy interesante si ya usas ecosistema FRITZ!Box.', 'Menos sentido si tu router no es compatible mesh FRITZ.', 'Ver precio', 'AVM FRITZ Repeater 1200 AX'),
    p('TP-Link Deco X20', 'Mesh para varias plantas', 'Pack mesh más estable que un repetidor suelto en casas grandes.', 'Más caro y requiere colocar varios nodos.', 'Ver precio', 'TP-Link Deco X20')
  ],
  'bebederos-automaticos-gatos': [
    p('Catit Flower Fountain', 'Gatos que beben poco', 'Fuente popular con flujo visible para incentivar beber.', 'Necesita limpieza y recambios de filtro.', 'Ver precio', 'Catit Flower Fountain'),
    p('PetSafe Drinkwell Platinum', 'Mayor capacidad', 'Buena para varios gatos o menos rellenado frecuente.', 'Más grande y con más piezas que limpiar.', 'Ver precio', 'PetSafe Drinkwell Platinum'),
    p('Xiaomi Smart Pet Fountain', 'Control inteligente', 'Diseño cerrado y avisos desde app para quien quiere control.', 'La conectividad no evita mantenimiento.', 'Ver precio', 'Xiaomi Smart Pet Fountain')
  ],
  'comederos-automaticos-perros-gatos': [
    p('PetSafe Eatwell 5 Meal', 'Raciones programadas', 'Comedero de platos giratorios para controlar horarios.', 'No sirve igual para comida húmeda largas horas.', 'Ver precio', 'PetSafe Eatwell 5 Meal'),
    p('Cat Mate C500', 'Comida húmeda', 'Compartimentos con acumuladores de frío para gatos.', 'Capacidad y programación más limitadas que tolvas secas.', 'Ver precio', 'Cat Mate C500'),
    p('Xiaomi Smart Pet Food Feeder', 'Pienso seco con app', 'Tolva inteligente para raciones y avisos desde móvil.', 'Solo para pienso seco y requiere comprobar tamaño de croqueta.', 'Ver precio', 'Xiaomi Smart Pet Food Feeder')
  ],
  'quitar-pelo-mascota-sofa-ropa': [
    p('ChomChom Roller', 'Sofá y mantas', 'Rodillo reutilizable muy conocido para retirar pelo sin consumibles.', 'No aspira polvo ni suciedad fina.', 'Ver precio', 'ChomChom Roller'),
    p('FURminator cepillo deslanador', 'Reducir pelo en origen', 'Ayuda a retirar pelo suelto antes de que acabe en sofá y ropa.', 'Debe usarse con cuidado según tipo de pelo/piel.', 'Ver precio', 'FURminator cepillo deslanador'),
    p('Black+Decker Dustbuster Pet', 'Aspirado rápido', 'Aspiradora de mano orientada a pelo en tapicería.', 'No sustituye robot o aspiradora principal.', 'Ver precio', 'Black Decker Dustbuster Pet')
  ],
  'soportes-portatil-teletrabajo': [
    p('Nulaxy C3 soporte portátil aluminio', 'Mesa fija', 'Eleva pantalla y mejora postura con construcción sencilla.', 'No es plegable para llevar a diario.', 'Ver precio', 'Nulaxy C3 soporte portátil'),
    p('BoYata soporte portátil ajustable', 'Más regulación', 'Permite varios ángulos y altura para ajustar ergonomía.', 'Más pesado y voluminoso.', 'Ver precio', 'BoYata soporte portátil ajustable'),
    p('MOFT soporte portátil adhesivo', 'Movilidad', 'Muy plano para quienes trabajan fuera de casa.', 'Menor elevación y estabilidad que soportes de mesa.', 'Ver precio', 'MOFT soporte portátil')
  ],
  'sillas-ergonomicas-calidad-precio': [
    p('SIHOO M18', 'Calidad-precio', 'Silla ergonómica popular con soporte lumbar y reposabrazos ajustables.', 'No sustituye una silla profesional de gama alta.', 'Ver precio', 'SIHOO M18 silla ergonomica'),
    p('Hbada E3', 'Espalda y ajustes', 'Opción con diseño ergonómico y varios ajustes para teletrabajo.', 'Hay que revisar talla y peso recomendado.', 'Ver precio', 'Hbada E3 silla ergonomica'),
    p('IKEA Markus', 'Uso sencillo', 'Clásica silla de oficina con respaldo alto para muchas casas.', 'Menos ajustes finos que modelos ergonómicos completos.', 'Ver precio', 'IKEA Markus silla oficina')
  ],
  'productos-utiles-casa-menos-30-euros': [
    p('TP-Link Tapo P100', 'Domótica barata', 'Enchufe inteligente básico para automatizar lámparas o rutinas.', 'Sin medición de consumo en la versión P100.', 'Ver precio', 'TP-Link Tapo P100'),
    p('Command tiras adhesivas para cuadros', 'Sin taladrar', 'Soluciona decoración ligera en pisos de alquiler.', 'No usar con objetos pesados o superficies dudosas.', 'Ver precio', 'Command tiras adhesivas cuadros'),
    p('mDesign organizador giratorio cocina', 'Orden barato', 'Mejora acceso a especias, botes o baño sin obra.', 'Hay que medir diámetro y altura.', 'Ver precio', 'mDesign organizador giratorio cocina')
  ]
};

let updated = articles.map(a => ({...a, products: productsBySlug[a.slug] ?? a.products}));
const content = 'export const articles = ' + JSON.stringify(updated, null, 2) + ' as const;\n';
writeFileSync('src/data/articles.ts', content);
console.log('Updated products for', Object.keys(productsBySlug).length, 'articles');
