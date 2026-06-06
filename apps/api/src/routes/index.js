import { Router } from "express";
import pedidosRoutes from "../modules/pedidos/pedidos.routes.js";
import systemRoutes from "../modules/system/system.routes.js";

const router = Router();

router.use(systemRoutes);
router.use(pedidosRoutes);

export default router;
