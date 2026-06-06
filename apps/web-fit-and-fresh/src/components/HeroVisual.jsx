export function HeroVisual() {
  return (
    <div
      className="hero-visual"
      aria-label="Viandas reales apiladas junto a la bolsa kraft de Fit & Fresh"
    >
      <div className="hero-visual__photo">
        <img
          className="hero-visual__img"
          src="/images/hero/hero-main.webp"
          alt="Viandas Fit and Fresh listas para la semana"
          loading="eager"
        />

        <img
          className="hero-visual__scene"
          src="/images/hero/persona-vianda.webp"
          alt="Cliente sosteniendo una vianda Fit and Fresh"
          loading="lazy"
        />

        <div className="hero-visual__labelcard">
          <p>Empaque real · Etiquetas claras · Entrega semanal</p>
        </div>
      </div>

      <div className="hero-visual__card">
        <strong>Resolver tus almuerzos en minutos</strong>
        <span>
          Tiempo libre, menos estrés y comida lista cuando la necesitás.
        </span>
      </div>
    </div>
  );
}
