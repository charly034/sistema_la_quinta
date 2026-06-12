export default function ConfiguracionPage() {
  return (
    <section className="seccion-admin">
      <header className="seccion-admin__header">
        <h2>Configuración</h2>
      </header>
      <p>
        Configuración general del panel. En esta etapa no se agregan
        integraciones fuera de menús.
      </p>
      <ul>
        <li>
          URL API actual:{" "}
          {import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}
        </li>
        <li>Entorno: {import.meta.env.MODE}</li>
      </ul>
    </section>
  );
}
