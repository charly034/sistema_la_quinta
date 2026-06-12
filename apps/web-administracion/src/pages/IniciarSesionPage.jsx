import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const schema = z.object({
  correo: z.string().email("Ingresá un correo válido"),
  contrasena: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export default function IniciarSesionPage() {
  const { login, autenticado } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { correo: "", contrasena: "" },
  });

  if (autenticado) {
    return <Navigate to="/inicio" replace />;
  }

  async function onSubmit(values) {
    try {
      await login(values);
    } catch (error) {
      setError("root", { message: error.message });
    }
  }

  return (
    <div className="pantalla-login">
      <form className="tarjeta-login" onSubmit={handleSubmit(onSubmit)}>
        <h1>Iniciar sesión</h1>
        <p>Panel administrativo del sistema de menús</p>
        <label className="campo">
          <span className="campo__label">Correo</span>
          <input type="email" autoComplete="username" {...register("correo")} />
          {errors.correo ? <small>{errors.correo.message}</small> : null}
        </label>
        <label className="campo">
          <span className="campo__label">Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register("contrasena")}
          />
          {errors.contrasena ? (
            <small>{errors.contrasena.message}</small>
          ) : null}
        </label>
        {errors.root ? (
          <p className="error-inline">{errors.root.message}</p>
        ) : null}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
