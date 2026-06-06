import { Button } from "./Button.jsx";

export function PackageCard({ title, description, bullets, featured, image }) {
  return (
    <article
      className={`package-card ${featured ? "package-card--featured" : ""}`}
    >
      {featured ? (
        <span className="package-card__badge">Más elegido</span>
      ) : null}
      {image ? (
        <img
          className="package-card__image"
          src={image}
          alt={`${title} de Fit and Fresh`}
          loading="lazy"
        />
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <Button href="#inicio" variant={featured ? "primary" : "secondary"}>
        Elegir {title}
      </Button>
    </article>
  );
}
