export function Button({ href, variant = "primary", children }) {
  return (
    <a className={`button button--${variant}`} href={href}>
      {children}
    </a>
  );
}
