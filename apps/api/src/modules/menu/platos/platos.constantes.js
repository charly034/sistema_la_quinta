export const ESTADOS_PLATO = [
  "ACTIVO",
  "INACTIVO",
  "ESTACIONAL",
  "BLOQUEADO_TEMPORALMENTE",
  "ARCHIVADO",
];

export const TIPOS_PLATO = ["PREPARACION", "GUARNICION", "PLATO_COMPLETO"];

export const FUNCIONES_COMPONENTE = [
  "PRINCIPAL",
  "GUARNICION",
  "SALSA",
  "ACOMPANAMIENTO",
  "OTRO",
];

export const TIPOS_PRESENCIA_ALERGENO = [
  "CONTIENE",
  "PUEDE_CONTENER",
  "TRAZAS",
];

export const ESTADOS_VALIDACION_CARACTERISTICA = [
  "CONFIRMADO",
  "NO_APTO",
  "SIN_VERIFICAR",
];

export const CLASIFICACIONES_CONFIG = {
  categorias: {
    tabla: "categorias_plato",
    entidad: "categorias_plato",
    estadoActivo: "ACTIVA",
    estados: ["ACTIVA", "INACTIVA", "ARCHIVADA"],
    tieneMarca: true,
    admiteOrden: true,
  },
  proteinas: {
    tabla: "proteinas",
    entidad: "proteinas",
    estadoActivo: "ACTIVA",
    estados: ["ACTIVA", "INACTIVA", "ARCHIVADA"],
    tieneMarca: true,
  },
  etiquetas: {
    tabla: "etiquetas_plato",
    entidad: "etiquetas_plato",
    estadoActivo: "ACTIVA",
    estados: ["ACTIVA", "INACTIVA", "ARCHIVADA"],
    tieneMarca: true,
    admiteTipo: true,
  },
  ingredientes: {
    tabla: "ingredientes",
    entidad: "ingredientes",
    estadoActivo: "ACTIVO",
    estados: ["ACTIVO", "INACTIVO", "ARCHIVADO"],
    tieneMarca: true,
    admiteNombreNormalizado: true,
  },
  alergenos: {
    tabla: "alergenos",
    entidad: "alergenos",
    estadoActivo: "ACTIVO",
    estados: ["ACTIVO", "INACTIVO", "ARCHIVADO"],
    tieneMarca: false,
  },
  "caracteristicas-alimentarias": {
    tabla: "caracteristicas_alimentarias",
    entidad: "caracteristicas_alimentarias",
    estadoActivo: "ACTIVA",
    estados: ["ACTIVA", "INACTIVA", "ARCHIVADA"],
    tieneMarca: true,
  },
};

export const RECURSOS_CLASIFICACION_PUBLICOS = [
  "categorias",
  "proteinas",
  "etiquetas",
  "ingredientes",
  "alergenos",
  "caracteristicas-alimentarias",
];

export const RECURSOS_CLASIFICACION_ALIAS = {
  "categorias-plato": "categorias",
  "etiquetas-plato": "etiquetas",
};

export const RELACIONES_CONFIG = {
  categorias: {
    tablaRelacion: "platos_categorias",
    columnaRelacionId: "categoria_id",
    tablaCatalogo: "categorias_plato",
    columnaEstadoCatalogo: "estado",
  },
  proteinas: {
    tablaRelacion: "platos_proteinas",
    columnaRelacionId: "proteina_id",
    tablaCatalogo: "proteinas",
    columnaEstadoCatalogo: "estado",
  },
  etiquetas: {
    tablaRelacion: "platos_etiquetas",
    columnaRelacionId: "etiqueta_id",
    tablaCatalogo: "etiquetas_plato",
    columnaEstadoCatalogo: "estado",
  },
  ingredientes: {
    tablaRelacion: "platos_ingredientes",
    columnaRelacionId: "ingrediente_id",
    tablaCatalogo: "ingredientes",
    columnaEstadoCatalogo: "estado",
  },
  alergenos: {
    tablaRelacion: "platos_alergenos",
    columnaRelacionId: "alergeno_id",
    tablaCatalogo: "alergenos",
    columnaEstadoCatalogo: "estado",
  },
  "caracteristicas-alimentarias": {
    tablaRelacion: "platos_caracteristicas",
    columnaRelacionId: "caracteristica_id",
    tablaCatalogo: "caracteristicas_alimentarias",
    columnaEstadoCatalogo: "estado",
  },
};
