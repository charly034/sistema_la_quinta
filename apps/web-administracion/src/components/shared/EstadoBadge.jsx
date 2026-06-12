const MAPA_TONO = {
  ACTIVO: "exito",
  INACTIVO: "neutral",
  ARCHIVADO: "peligro",
  BORRADOR: "neutral",
  PROPUESTO: "info",
  APROBADO: "advertencia",
  PUBLICADO: "exito",
  FINALIZADO: "neutral",
  CANCELADO: "peligro",
};

export default function EstadoBadge({ estado }) {
  const tono = MAPA_TONO[estado] || "neutral";
  return <span className={`badge badge--${tono}`}>{estado}</span>;
}
