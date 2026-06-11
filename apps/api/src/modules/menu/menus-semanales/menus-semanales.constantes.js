/**
 * Constantes y máquina de estados para módulo de menús semanales
 * Spec Etapa 3 - Sección 9: Transiciones y estados
 * Spec Etapa 3 - Sección 20: Permisos
 */

/**
 * ESTADOS DE VERSIÓN
 * Máquina de estados para las versiones de semanas menú
 * Spec Etapa 3 - Sección 9
 */
export const ESTADOS_VERSION = {
  BORRADOR: "BORRADOR",
  PROPUESTO: "PROPUESTO",
  APROBADO: "APROBADO",
  PUBLICADO: "PUBLICADO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
};

/**
 * Matriz de transiciones válidas entre estados
 * Define qué estados pueden transicionar a cuáles otros estados
 * Spec Etapa 3 - Sección 9
 */
export const TRANSICIONES_VALIDAS = {
  [ESTADOS_VERSION.BORRADOR]: [
    ESTADOS_VERSION.PROPUESTO,
    ESTADOS_VERSION.CANCELADO,
  ],
  [ESTADOS_VERSION.PROPUESTO]: [
    ESTADOS_VERSION.APROBADO,
    ESTADOS_VERSION.CANCELADO,
    ESTADOS_VERSION.BORRADOR, // Rechazar propuesta
  ],
  [ESTADOS_VERSION.APROBADO]: [
    ESTADOS_VERSION.PUBLICADO,
    ESTADOS_VERSION.CANCELADO,
    ESTADOS_VERSION.BORRADOR, // Rechazar aprobación
  ],
  [ESTADOS_VERSION.PUBLICADO]: [
    ESTADOS_VERSION.FINALIZADO,
    ESTADOS_VERSION.CANCELADO,
  ],
  [ESTADOS_VERSION.FINALIZADO]: [],
  [ESTADOS_VERSION.CANCELADO]: [],
};

/**
 * ESTADOS DE DÍA
 * Estados posibles para cada día dentro de una semana
 * Spec Etapa 3 - Sección 11
 */
export const ESTADOS_DIA = {
  DIA_LABORAL: "DIA_LABORAL",
  FERIADO: "FERIADO",
  CERRADO: "CERRADO",
  SIN_CONFIGURAR: "SIN_CONFIGURAR",
};

/**
 * PERMISOS DE MENÚS
 * Permisos específicos para operaciones de menús semanales
 * Spec Etapa 3 - Sección 20
 */
export const PERMISOS_MENUS = {
  LEER: "MENUS_LEER",
  GESTIONAR: "MENUS_GESTIONAR",
  APROBAR: "MENUS_APROBAR",
  PUBLICAR: "MENUS_PUBLICAR",
  EXPORTAR: "MENUS_EXPORTAR",
  IMPORTAR: "MENUS_IMPORTAR",
};

/**
 * ASIGNACIONES DE PERMISOS A ROLES
 * Define qué permisos tienen cada rol
 * Spec Etapa 3 - Sección 20
 */
export const PERMISOS_POR_ROL = {
  PROPIETARIO: [
    PERMISOS_MENUS.LEER,
    PERMISOS_MENUS.GESTIONAR,
    PERMISOS_MENUS.APROBAR,
    PERMISOS_MENUS.PUBLICAR,
    PERMISOS_MENUS.EXPORTAR,
    PERMISOS_MENUS.IMPORTAR,
  ],
  ADMINISTRADOR: [
    PERMISOS_MENUS.LEER,
    PERMISOS_MENUS.GESTIONAR,
    PERMISOS_MENUS.APROBAR,
    PERMISOS_MENUS.PUBLICAR,
    PERMISOS_MENUS.EXPORTAR,
  ],
  EDITOR: [
    PERMISOS_MENUS.LEER,
    PERMISOS_MENUS.GESTIONAR,
    PERMISOS_MENUS.EXPORTAR,
  ],
  LECTOR: [PERMISOS_MENUS.LEER, PERMISOS_MENUS.EXPORTAR],
  CLIENTE: [],
};

/**
 * TIPOS DE PLANTILLA
 * Tipos de mensajes que pueden generarse desde plantillas
 */
export const TIPOS_PLANTILLA = {
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  TEXTO: "TEXTO",
};

/**
 * ESTADOS DE IMPORTACIÓN
 * Estados posibles para operaciones de importación
 * Spec Etapa 3 - Sección 15
 */
export const ESTADOS_IMPORTACION = {
  INICIADA: "INICIADA",
  VALIDADA: "VALIDADA",
  COMPLETADA: "COMPLETADA",
  FALLIDA: "FALLIDA",
  SIMULADA: "SIMULADA",
};

/**
 * ESTRATEGIAS DE CONFLICTO EN IMPORTACIÓN
 * Cómo manejar conflictos durante importación
 * Spec Etapa 3 - Sección 27
 */
export const ESTRATEGIAS_CONFLICTO = {
  ERROR: "ERROR", // Fallar si hay conflicto
  OMITIR: "OMITIR", // Ignorar conflictos
  CREAR_VERSION: "CREAR_VERSION", // Crear nueva versión
};

/**
 * MENSAJE DE ERROR: Intenta transicionar a estado inválido
 */
export const ERROR_TRANSICION_INVALIDA = (actual, destino) =>
  `Transición de ${actual} a ${destino} no permitida. Transiciones válidas: ${TRANSICIONES_VALIDAS[actual]?.join(", ") || "ninguna"}`;

/**
 * Validar que una transición sea válida
 */
export function validarTransicion(estadoActual, estadoDestino) {
  return TRANSICIONES_VALIDAS[estadoActual]?.includes(estadoDestino) ?? false;
}

/**
 * Obtener todos los estados válidos para transicionar desde un estado
 */
export function obtenerTransicionesPermitidas(estado) {
  return TRANSICIONES_VALIDAS[estado] || [];
}
