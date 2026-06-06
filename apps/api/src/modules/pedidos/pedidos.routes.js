import { Router } from "express";
import {
  createPedido,
  getPedidoById,
  getPedidos,
  setupPedidosTable,
  updatePedidoEstado,
} from "./pedidos.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createPedidoBodySchema,
  pedidoParamsSchema,
  updatePedidoEstadoBodySchema,
} from "./pedidos.schemas.js";

const router = Router();

router.get("/pedidos", getPedidos);
router.post(
  "/pedidos",
  validate({ body: createPedidoBodySchema }),
  createPedido,
);
router.get(
  "/pedidos/:id",
  validate({ params: pedidoParamsSchema }),
  getPedidoById,
);
router.put(
  "/pedidos/:id/estado",
  validate({ params: pedidoParamsSchema, body: updatePedidoEstadoBodySchema }),
  updatePedidoEstado,
);
router.post("/setup", setupPedidosTable);

export default router;
