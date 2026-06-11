/**
 * Módulo de Menús
 * Integración de todos los sub-módulos
 */

import { Router } from "express";
import menusSemanalesRouter from "./menus-semanales/menus-semanales.rutas.js";
import reglasRouter from "./reglas/reglas.rutas.js";
import perfilesReglasRouter from "./perfiles-reglas/perfiles-reglas.rutas.js";
import propuestasRouter from "./propuestas/propuestas.rutas.js";

const router = Router();

// Rutas de menús semanales
router.use("/menus-semanales", menusSemanalesRouter);
router.use(reglasRouter);
router.use(perfilesReglasRouter);
router.use(propuestasRouter);

export default router;
