export default function CampoBusqueda({
  value,
  onChange,
  placeholder = "Buscar",
}) {
  return (
    <label className="campo campo--busqueda">
      <span className="campo__label">Buscar</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
