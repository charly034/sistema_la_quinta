import { useState } from "react";

function LoginView({ usuarios, onLogin }) {
  const [usuarioId, setUsuarioId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!usuarioId) {
      return;
    }
    const success = onLogin(usuarioId, password);
    if (!success) {
      setError("Credenciales inválidas");
      return;
    }
    setError("");
  };

  return (
    <section className="auth-card">
      <header className="auth-card__header">
        <p className="auth-card__title">Inicio de sesión</p>
        <p className="auth-card__subtitle">
          Selecciona un usuario para continuar
        </p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="usuario">Usuario</label>
        <select
          id="usuario"
          value={usuarioId}
          onChange={(event) => setUsuarioId(event.target.value)}
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombre} · {usuario.rol.toUpperCase()}
            </option>
          ))}
        </select>

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ingresa tu contraseña"
        />

        {error && <p className="form__hint form__hint--error">{error}</p>}

        <button className="btn btn--primary" type="submit">
          Ingresar
        </button>
      </form>

      <div className="auth-card__footer">
        <p>
          Administradores: <strong>Emiliano</strong> y <strong>German</strong>.
          El resto son empleados con acceso solo a sus adelantos.
        </p>
      </div>
    </section>
  );
}

export default LoginView;
