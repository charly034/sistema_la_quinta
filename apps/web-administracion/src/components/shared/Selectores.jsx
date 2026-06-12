export function SelectorMarca({ marcas = [], value, onChange }) {
  return (
    <label className="campo">
      <span className="campo__label">Marca</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Todas</option>
        {marcas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SelectorCanal({ canales = [], value, onChange }) {
  return (
    <label className="campo">
      <span className="campo__label">Canal</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Todos</option>
        {canales.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SelectorEmpresa({ empresas = [], value, onChange }) {
  return (
    <label className="campo">
      <span className="campo__label">Empresa</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Todas</option>
        {empresas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SelectorEstado({
  estados = [],
  value,
  onChange,
  label = "Estado",
}) {
  return (
    <label className="campo">
      <span className="campo__label">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Todos</option>
        {estados.map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}
      </select>
    </label>
  );
}
