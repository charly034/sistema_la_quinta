export const brandValues = [
  "Tiempo",
  "Organización",
  "Tranquilidad",
  "Casero",
  "Fresco",
];

export const problemCards = [
  {
    title: "Llegás cansado del trabajo",
    description:
      "Volvés con la cabeza llena y lo último que querés es pensar qué cocinar desde cero.",
  },
  {
    title: "No sabés qué cocinar",
    description:
      "La falta de planificación te empuja a improvisar, repetir platos o gastar de más.",
  },
  {
    title: "Terminás pidiendo delivery",
    description:
      "El delivery parece fácil, pero termina siendo más caro y menos ordenado.",
  },
  {
    title: "Perdés tiempo todos los días",
    description:
      "Entre decidir, cocinar, limpiar y volver a empezar, se te va tiempo valioso todos los días.",
  },
];

export const steps = [
  {
    title: "Elegís tu pack",
    description:
      "Pack de 5 para empezar o pack de 10 para una semana más organizada y con mejor costo por unidad.",
  },
  {
    title: "Seleccionás tus platos",
    description:
      "Elegís entre opciones semanales variadas, caseras y pensadas para equilibrar practicidad y disfrute.",
  },
  {
    title: "Recibís tus viandas",
    description:
      "Entrega semanal en las zonas de cobertura o retiro por local, con packaging apto freezer.",
  },
  {
    title: "Calentás y disfrutás",
    description:
      "Solo te ocupás de abrir, calentar y resolver tu comida en minutos.",
  },
];

export const menuHighlights = [
  {
    title: "Ahorro de tiempo",
    description:
      "Liberá horas por semana y reducí la carga mental de pensar qué comer todos los días.",
    slug: "time",
  },
  {
    title: "Comida casera",
    description:
      "Viandas elaboradas en el día, con sabor casero y porciones abundantes.",
    slug: "home",
  },
  {
    title: "Menú variado",
    description:
      "Rotación semanal para sumar variedad real sin caer en lo repetitivo.",
    slug: "menu",
  },
  {
    title: "Opciones vegetarianas",
    description:
      "Alternativas pensadas para acompañar distintas preferencias de alimentación.",
    slug: "veg",
  },
  {
    title: "Listas para freezer",
    description:
      "Packaging apto freezer y microondas para mayor practicidad en la semana.",
    slug: "freezer",
  },
  {
    title: "Entrega programada",
    description:
      "Recibí tus viandas en la zona de cobertura o retiralas por el local.",
    slug: "delivery",
  },
];

export const packagingHighlights = [
  "Bolsa kraft con presencia premium.",
  "Etiquetas simples, claras y legibles.",
  "Packaging apto freezer y microondas.",
  "Hasta 72 horas en heladera.",
  "Hasta 3 meses en freezer.",
];

export const dishes = [
  { name: "Wok de pollo", image: "/images/menu/wok-de-pollo.webp" },
  {
    name: "Carne con vegetales",
    image: "/images/menu/carne-con-vegetales.webp",
  },
  {
    name: "Pollo a la portuguesa",
    image: "/images/menu/pollo-a-la-portuguesa.webp",
  },
  { name: "Pastel de papa", image: "/images/menu/pastel-de-papa.webp" },
  { name: "Tarta de verduras", image: "/images/menu/tarta-de-verduras.webp" },
  {
    name: "Hamburguesas vegetales",
    image: "/images/menu/hamburguesas-vegetales.webp",
  },
  {
    name: "Medallones de merluza",
    image: "/images/menu/medallones-de-merluza.webp",
  },
  { name: "Canelones", image: "/images/menu/canelones.webp" },
];

export const packages = [
  {
    title: "Pack 5",
    description: "Ideal para resolver tus almuerzos laborales sin complicarte.",
    image: "/images/packs/pack-5-price.webp",
    price: "$39.000",
    unitPrice: "$7.800 por vianda",
    savings: "Ahorro frente a delivery diario",
    bullets: [
      "Ideal para empezar",
      "Selección personalizada",
      "Entrega semanal",
    ],
    featured: false,
  },
  {
    title: "Pack 10",
    description:
      "La opción más conveniente para ganar más organización, más ahorro y más tranquilidad.",
    image: "/images/packs/pack-10-price.webp",
    price: "$72.000",
    unitPrice: "$7.200 por vianda",
    savings: "Mejor costo por vianda",
    bullets: [
      "Mejor relación precio/cantidad",
      "Mayor organización semanal",
      "Más ahorro",
    ],
    featured: true,
  },
];

export const testimonials = [
  {
    name: "María, profesional",
    role: "Profesional",
    image: "/images/testimonials/profesional.webp",
    quote:
      "Me resolvió la semana. Dejar de improvisar me ordenó también la rutina.",
  },
  {
    name: "Julián, bancario",
    role: "Empleado bancario",
    image: "/images/testimonials/bancario.webp",
    quote:
      "Dejé de preocuparme por cocinar y empecé a llegar a casa con la comida resuelta.",
  },
  {
    name: "Sofía, emprendedora",
    role: "Emprendedora",
    image: "/images/testimonials/emprendedor.webp",
    quote:
      "Comer bien es mucho más fácil cuando alguien organiza todo por vos.",
  },
  {
    name: "Carla, madre trabajadora",
    role: "Madre trabajadora",
    image: "/images/testimonials/madre-trabajadora.webp",
    quote:
      "Tener viandas listas me cambió la semana. Gané tiempo y bajé el estrés.",
  },
];

export const faqs = [
  {
    question: "¿Cuánto duran?",
    answer: "En heladera duran hasta 72 horas y en freezer hasta 3 meses.",
  },
  {
    question: "¿Cómo se entregan?",
    answer:
      "Hacemos entrega semanal en las zonas de cobertura o podés retirar por local.",
  },
  {
    question: "¿Se pueden congelar?",
    answer:
      "Sí, las viandas y el packaging están pensados para freezer y microondas.",
  },
  {
    question: "¿Puedo elegir mis platos?",
    answer:
      "Sí. La selección se organiza cada semana para que elijas según tus gustos y necesidades.",
  },
  {
    question: "¿Hay opciones vegetarianas?",
    answer: "Sí, ofrecemos opciones vegetarianas dentro del menú semanal.",
  },
  {
    question: "¿Dónde entregan?",
    answer:
      "Quinta Sección, Barrio Bombal, Barrio Bancario y zonas aledañas de Mendoza.",
  },
];
