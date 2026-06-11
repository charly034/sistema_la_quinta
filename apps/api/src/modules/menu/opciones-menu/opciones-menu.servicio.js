import crypto from "crypto";
import { ejecutarEnTransaccion } from "../../../utils/transacciones.js";
import { crearAuditoria } from "../../autenticacion/autenticacion.repositorio.js";
import { generarIdentificador } from "../../../utils/seguridad.js";
import { sanitizarDatosAuditoria } from "../../auditoria/auditoria.utilidades.js";
import {
  errorRegistroDuplicado,
  errorRecursoNoEncontrado,
  errorConflictoIntegridad,
} from "../../../utils/errores.js";
import { obtenerMarcaPorId } from "../../marcas/marcas.repositorio.js";
import {
  listarOpcionesMenu,
  obtenerOpcionMenuPorId,
  obtenerOpcionMenuPorCodigoYMarca,
  crearOpcionMenu,
  actualizarOpcionMenu,
  reordenarOpcionesMenu,
} from "./opciones-menu.repositorio.js";
async function registrarAuditoria(datos, cliente = null) {
  return crearAuditoria(
    {
      id: generarIdentificador(),
      ...datos,
      datosAnteriores: datos.datosAnteriores
        ? sanitizarDatosAuditoria(datos.datosAnteriores)
        : null,
      datosPosteriores: datos.datosPosteriores
        ? sanitizarDatosAuditoria(datos.datosPosteriores)
        : null,
    },
    cliente,
  );
}
export async function listarOpcionesMenuServicio(query) {
  return listarOpcionesMenu(query);
}
export async function obtenerOpcionMenuServicio(id) {
  const opcion = await obtenerOpcionMenuPorId(id);
  if (!opcion) throw errorRecursoNoEncontrado("Opcion de menu no encontrada");
  return opcion;
}
export async function crearOpcionMenuServicio({ cuerpo, usuarioAutenticado }) {
  const marca = await obtenerMarcaPorId(cuerpo.marcaId);
  if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");
  const existente = await obtenerOpcionMenuPorCodigoYMarca(
    cuerpo.codigo,
    cuerpo.marcaId,
  );
  if (existente)
    throw errorRegistroDuplicado(
      "Ya existe una opcion con ese codigo para la marca",
    );
  return ejecutarEnTransaccion(async (cliente) => {
    const opcion = await crearOpcionMenu(
      { ...cuerpo, id: crypto.randomUUID() },
      cliente,
    );
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_OPCION_MENU",
        entidad: "opciones_menu_marca",
        entidadId: opcion.id,
        datosPosteriores: opcion,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return opcion;
  });
}
export async function actualizarOpcionMenuServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerOpcionMenuPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Opcion de menu no encontrada");
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarOpcionMenu(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_OPCION_MENU",
        entidad: "opciones_menu_marca",
        entidadId: id,
        datosAnteriores: antes,
        datosPosteriores: despues,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return despues;
  });
}
export async function reordenarOpcionesMenuServicio({
  marcaId,
  opciones,
  usuarioAutenticado,
}) {
  const marca = await obtenerMarcaPorId(marcaId);
  if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");
  return ejecutarEnTransaccion(async (cliente) => {
    const antes = await listarOpcionesMenu(
      { pagina: 1, tamano: 100, marca: marca.codigo },
      cliente,
    );
    let despues;
    try {
      despues = await reordenarOpcionesMenu(marcaId, opciones, cliente);
    } catch (error) {
      throw errorConflictoIntegridad(
        error?.message || "Conflicto al reordenar opciones",
      );
    }
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "REORDENAR_OPCIONES_MENU",
        entidad: "opciones_menu_marca",
        entidadId: marcaId,
        datosAnteriores: antes.filas,
        datosPosteriores: despues,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return despues;
  });
}
