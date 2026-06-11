import { Router } from "express";
import rateLimit from "express-rate-limit";
import { obtenerConfiguracionAplicacion } from "../../config/entorno.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { autenticar } from "../../middlewares/autenticacion.middleware.js";
import {
  iniciarSesionSchema,
  renovarSesionSchema,
  cerrarSesionSchema,
  cambiarContrasenaSchema,
} from "./autenticacion.validaciones.js";
import {
  iniciarSesionControlador,
  renovarSesionControlador,
  cerrarSesionControlador,
  cambiarContrasenaControlador,
  miPerfilControlador,
} from "./autenticacion.controlador.js";

const router = Router();
const configuracion = obtenerConfiguracionAplicacion();

const limiteAutenticacion = rateLimit({
  windowMs: configuracion.rateLimitAutenticacionVentanaMs,
  limit: configuracion.rateLimitAutenticacionMaximo,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/autenticacion/iniciar-sesion",
  limiteAutenticacion,
  validate({ body: iniciarSesionSchema.shape.body }),
  iniciarSesionControlador,
);
router.post(
  "/autenticacion/renovar-sesion",
  limiteAutenticacion,
  validate({ body: renovarSesionSchema.shape.body }),
  renovarSesionControlador,
);
router.post(
  "/autenticacion/cerrar-sesion",
  validate({ body: cerrarSesionSchema.shape.body }),
  cerrarSesionControlador,
);
router.post(
  "/autenticacion/cambiar-contrasena",
  autenticar,
  validate({ body: cambiarContrasenaSchema.shape.body }),
  cambiarContrasenaControlador,
);
router.get("/autenticacion/mi-perfil", autenticar, miPerfilControlador);

export default router;
