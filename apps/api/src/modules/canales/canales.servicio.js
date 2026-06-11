import crypto from "crypto";
import { ejecutarEnTransaccion } from "../../utils/transacciones.js";
import { crearAuditoria } from "../autenticacion/autenticacion.repositorio.js";
import { generarIdentificador } from "../../utils/seguridad.js";
import { sanitizarDatosAuditoria } from "../auditoria/auditoria.utilidades.js";
import {
  errorRegistroDuplicado,
  errorRecursoNoEncontrado,
} from "../../utils/errores.js";
import {
  listarCanales,
  obtenerCanalPorId,
  obtenerCanalPorCodigo,
  crearCanal,
  actualizarCanal,
} from "./canales.repositorio.js";
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
export async function listarCanalesServicio(query) {
  return listarCanales(query);
}
export async function obtenerCanalServicio(id) {
  const canal = await obtenerCanalPorId(id);
  if (!canal) throw errorRecursoNoEncontrado("Canal no encontrado");
  return canal;
}
export async function crearCanalServicio({ cuerpo, usuarioAutenticado }) {
  const existente = await obtenerCanalPorCodigo(cuerpo.codigo);
  if (existente)
    throw errorRegistroDuplicado("Ya existe un canal con ese codigo");
  return ejecutarEnTransaccion(async (cliente) => {
    const canal = await crearCanal(
      { ...cuerpo, id: crypto.randomUUID() },
      cliente,
    );
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_CANAL",
        entidad: "canales",
        entidadId: canal.id,
        datosPosteriores: canal,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return canal;
  });
}
export async function actualizarCanalServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerCanalPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Canal no encontrado");
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarCanal(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_CANAL",
        entidad: "canales",
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
