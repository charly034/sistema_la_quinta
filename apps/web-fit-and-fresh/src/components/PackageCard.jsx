import { Button } from "./Button.jsx";

export function PackageCard({
  title,
  description,
  bullets,
  featured,
  image,
  price,
  unitPrice,
  savings,
  ctaHref,
  ctaLabel,
}) {
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
      <div className="package-card__pricing">
        <strong className="package-card__price">{price}</strong>
        <span className="package-card__unit-price">{unitPrice}</span>
        {savings ? (
          <span className="package-card__saving">{savings}</span>
        ) : null}
      </div>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <Button
        href={ctaHref || "#packs"}
        variant={featured ? "primary" : "secondary"}
        target={ctaHref ? "_blank" : undefined}
        rel={ctaHref ? "noreferrer" : undefined}
      >
        {ctaLabel || `Elegir ${title}`}
      </Button>
    </article>
  );
}
