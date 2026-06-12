export default function PanelDetalle({ titulo, children, acciones }) {
  return (
    <section className="panel-detalle">
      <header>
        <h3>{titulo}</h3>
        <div>{acciones}</div>
      </header>
      <div>{children}</div>
    </section>
  );
}
