export function Button({ href, variant = "primary", children, target, rel }) {
  return (
    <a
      className={`button button--${variant}`}
      href={href}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}
