import { Router } from "express";
import pedidosRoutes from "../modules/pedidos/pedidos.routes.js";
import systemRoutes from "../modules/system/system.routes.js";
import autenticacionRoutes from "../modules/autenticacion/autenticacion.rutas.js";
import usuariosRoutes from "../modules/usuarios/usuarios.rutas.js";
import rolesRoutes from "../modules/roles/roles.rutas.js";
import auditoriaRoutes from "../modules/auditoria/auditoria.rutas.js";
import marcasRoutes from "../modules/marcas/marcas.rutas.js";
import canalesRoutes from "../modules/canales/canales.rutas.js";
import empresasRoutes from "../modules/empresas/empresas.rutas.js";
import opcionesMenuRoutes from "../modules/menu/opciones-menu/opciones-menu.rutas.js";
import platosRoutes from "../modules/menu/platos/platos.rutas.js";
import menusSemanalesRoutes from "../modules/menu/menus-semanales/menus-semanales.rutas.js";

const router = Router();

router.use(systemRoutes);
router.use(pedidosRoutes);
router.use(autenticacionRoutes);
router.use(usuariosRoutes);
router.use(rolesRoutes);
router.use(auditoriaRoutes);
router.use(marcasRoutes);
router.use(canalesRoutes);
router.use(empresasRoutes);
router.use(opcionesMenuRoutes);
router.use(platosRoutes);
router.use(menusSemanalesRoutes);

export default router;
