/**
 * Configuración de alarmas para la aplicación
 *
 * Tipos disponibles:
 * - "urgent": Dos tonos alternados (1000Hz y 800Hz) - MÁS LLAMATIVO ⭐ RECOMENDADO
 * - "melodic": Patrón melódico de 3 notas (DO, MI, SOL) - Agradable
 * - "digital": Beep corto y agudo (1200Hz) - Tipo app store
 * - "classic": Tono único continuo (800Hz) - Simple
 */

export const ALARM_SETTINGS = {
  // Tipo de alarma activo
  type: "urgent", // Cambiar aquí para usar otro tipo

  // Velocidad de repetición (en ms) - Más bajo = más frecuente
  // 600ms es típico de alarmas efectivas
  intervalMs: 600,

  // Descripción de cada tipo
  types: {
    urgent: {
      name: "Urgente",
      description: "Dos tonos alternados - Muy llamativo",
      icon: "🔴",
    },
    melodic: {
      name: "Melódico",
      description: "Tres notas agradables - Profesional",
      icon: "🎵",
    },
    digital: {
      name: "Digital",
      description: "Beep corto - Tipo app store",
      icon: "📱",
    },
    classic: {
      name: "Clásico",
      description: "Tono único continuo - Simple",
      icon: "🔔",
    },
  },
};

export const getAlarmInfo = (type) => {
  return ALARM_SETTINGS.types[type] || ALARM_SETTINGS.types.urgent;
};
