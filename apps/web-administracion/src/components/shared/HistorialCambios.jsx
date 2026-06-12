export default function HistorialCambios({ items = [] }) {
  return (
    <ul className="historial-cambios">
      {items.map((item) => (
        <li key={item.id || `${item.fecha}-${item.accion}`}>
          <strong>{item.accion}</strong>
          <span>{item.entidad}</span>
          <small>{item.fecha}</small>
        </li>
      ))}
    </ul>
  );
}
