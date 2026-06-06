export function TestimonialCard({ name, role, quote, image }) {
  return (
    <article className="testimonial-card">
      {image ? (
        <img
          className="testimonial-card__image"
          src={image}
          alt={`Foto de ${name}`}
          loading="lazy"
        />
      ) : null}
      <p className="testimonial-card__quote">“{quote}”</p>
      <div className="testimonial-card__meta">
        <strong>{name}</strong>
        <span>{role}</span>
      </div>
    </article>
  );
}
