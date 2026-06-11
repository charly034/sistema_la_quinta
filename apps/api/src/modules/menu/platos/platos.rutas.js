import { Router } from "express";
import {
  autenticar,
  requierePermiso,
} from "../../../middlewares/autenticacion.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  listarPlatosSchema,
  platoIdSchema,
  componentesPlatoIdSchema,
  relacionesPlatoIdSchema,
  crearPlatoSchema,
  actualizarPlatoSchema,
  actualizarEstadoPlatoSchema,
  actualizarFavoritoPlatoSchema,
  reemplazarComponentesSchema,
  agregarAliasSchema,
  aliasIdSchema,
  relacionBasicaSchema,
  reemplazarIdsRelacionSchema,
  reemplazarIngredientesSchema,
  reemplazarAlergenosSchema,
  reemplazarCaracteristicasSchema,
  listarClasificacionSchema,
  clasificacionIdSchema,
  crearClasificacionSchema,
  actualizarClasificacionSchema,
} from "./platos.validaciones.js";
import {
  listarPlatosControlador,
  obtenerPlatoControlador,
  obtenerComponentesPlatoControlador,
  obtenerRelacionesPlatoControlador,
  crearPlatoControlador,
  actualizarPlatoControlador,
  actualizarEstadoPlatoControlador,
  actualizarFavoritoPlatoControlador,
  reemplazarComponentesPlatoControlador,
  crearAliasPlatoControlador,
  eliminarAliasPlatoControlador,
  reemplazarRelacionBasicaPlatoControlador,
  reemplazarIngredientesPlatoControlador,
  reemplazarAlergenosPlatoControlador,
  reemplazarCaracteristicasPlatoControlador,
  listarClasificacionesControlador,
  obtenerClasificacionControlador,
  crearClasificacionControlador,
  actualizarClasificacionControlador,
} from "./platos.controlador.js";

const router = Router();

router.get(
  "/menu/platos",
  autenticar,
  requierePermiso("PLATOS_LEER"),
  validate({ query: listarPlatosSchema.shape.query }),
  listarPlatosControlador,
);

router.get(
  "/menu/platos/:id",
  autenticar,
  requierePermiso("PLATOS_LEER"),
  validate({ params: platoIdSchema.shape.params }),
  obtenerPlatoControlador,
);

router.get(
  "/menu/platos/:id/componentes",
  autenticar,
  requierePermiso("PLATOS_LEER"),
  validate({ params: componentesPlatoIdSchema.shape.params }),
  obtenerComponentesPlatoControlador,
);

router.get(
  "/menu/platos/:id/relaciones",
  autenticar,
  requierePermiso("PLATOS_LEER"),
  validate({ params: relacionesPlatoIdSchema.shape.params }),
  obtenerRelacionesPlatoControlador,
);

router.post(
  "/menu/platos",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({ body: crearPlatoSchema.shape.body }),
  crearPlatoControlador,
);

router.patch(
  "/menu/platos/:id",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: actualizarPlatoSchema.shape.body,
  }),
  actualizarPlatoControlador,
);

router.patch(
  "/menu/platos/:id/estado",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: actualizarEstadoPlatoSchema.shape.body,
  }),
  actualizarEstadoPlatoControlador,
);

router.patch(
  "/menu/platos/:id/favorito",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: actualizarFavoritoPlatoSchema.shape.body,
  }),
  actualizarFavoritoPlatoControlador,
);

router.put(
  "/menu/platos/:id/componentes",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: reemplazarComponentesSchema.shape.body,
  }),
  reemplazarComponentesPlatoControlador,
);

router.post(
  "/menu/platos/:id/alias",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: agregarAliasSchema.shape.body,
  }),
  crearAliasPlatoControlador,
);

router.delete(
  "/menu/platos/:id/alias/:aliasId",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({ params: aliasIdSchema.shape.params }),
  eliminarAliasPlatoControlador,
);

router.put(
  "/menu/platos/:id/relaciones/:relacion",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: relacionBasicaSchema.shape.params,
    body: reemplazarIdsRelacionSchema.shape.body,
  }),
  reemplazarRelacionBasicaPlatoControlador,
);

router.put(
  "/menu/platos/:id/ingredientes",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: reemplazarIngredientesSchema.shape.body,
  }),
  reemplazarIngredientesPlatoControlador,
);

router.put(
  "/menu/platos/:id/alergenos",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: reemplazarAlergenosSchema.shape.body,
  }),
  reemplazarAlergenosPlatoControlador,
);

router.put(
  "/menu/platos/:id/caracteristicas-alimentarias",
  autenticar,
  requierePermiso("PLATOS_GESTIONAR"),
  validate({
    params: platoIdSchema.shape.params,
    body: reemplazarCaracteristicasSchema.shape.body,
  }),
  reemplazarCaracteristicasPlatoControlador,
);

router.get(
  "/menu/:recurso(categorias|categorias-plato|proteinas|etiquetas|etiquetas-plato|ingredientes|alergenos|caracteristicas-alimentarias)",
  autenticar,
  requierePermiso("CLASIFICACIONES_PLATOS_LEER"),
  validate({ query: listarClasificacionSchema.shape.query }),
  listarClasificacionesControlador,
);

router.get(
  "/menu/:recurso(categorias|categorias-plato|proteinas|etiquetas|etiquetas-plato|ingredientes|alergenos|caracteristicas-alimentarias)/:id",
  autenticar,
  requierePermiso("CLASIFICACIONES_PLATOS_LEER"),
  validate({ params: clasificacionIdSchema.shape.params }),
  obtenerClasificacionControlador,
);

router.post(
  "/menu/:recurso(categorias|categorias-plato|proteinas|etiquetas|etiquetas-plato|ingredientes|alergenos|caracteristicas-alimentarias)",
  autenticar,
  requierePermiso("CLASIFICACIONES_PLATOS_GESTIONAR"),
  validate({ body: crearClasificacionSchema.shape.body }),
  crearClasificacionControlador,
);

router.patch(
  "/menu/:recurso(categorias|categorias-plato|proteinas|etiquetas|etiquetas-plato|ingredientes|alergenos|caracteristicas-alimentarias)/:id",
  autenticar,
  requierePermiso("CLASIFICACIONES_PLATOS_GESTIONAR"),
  validate({
    params: clasificacionIdSchema.shape.params,
    body: actualizarClasificacionSchema.shape.body,
  }),
  actualizarClasificacionControlador,
);

export default router;
