import crypto from "node:crypto";
import {
  listarRoles,
  obtenerRolPorId,
  obtenerRolPorCodigo,
  obtenerPermisosRol,
  crearRol,
  actualizarRol,
  reemplazarPermisosRol,
  listarPermisos,
} from "./roles.repositorio.js";
import { ejecutarEnTransaccion } from "../../utils/transacciones.js";
import {
  errorRegistroDuplicado,
  errorRecursoNoEncontrado,
} from "../../utils/errores.js";
import {
  generarIdentificador,
  normalizarCodigo,
} from "../../utils/seguridad.js";
import { crearAuditoria } from "../autenticacion/autenticacion.repositorio.js";
import { sanitizarDatosAuditoria } from "../auditoria/auditoria.utilidades.js";

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

export async function obtenerRolesServicio(query) {
  return listarRoles(query);
}

export async function obtenerRolServicio(id) {
  const rol = await obtenerRolPorId(id);
  if (!rol) throw errorRecursoNoEncontrado("Rol no encontrado");
  const permisos = await obtenerPermisosRol(id);
  return { ...rol, permisos };
}

export async function crearRolServicio({ cuerpo, usuarioAutenticado }) {
  const existente = await obtenerRolPorCodigo(normalizarCodigo(cuerpo.codigo));
  if (existente) {
    throw errorRegistroDuplicado("Ya existe un codigo de rol equivalente");
  }

  const rol = await ejecutarEnTransaccion(async (cliente) => {
    const nuevo = await crearRol(
      { ...cuerpo, id: crypto.randomUUID() },
      cliente,
    );
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_ROL",
        entidad: "roles",
        entidadId: nuevo.id,
        datosPosteriores: nuevo,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return nuevo;
  });

  return rol;
}

export async function actualizarRolServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerRolPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Rol no encontrado");

  const despues = await ejecutarEnTransaccion(async (cliente) => {
    const actualizado = await actualizarRol(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_ROL",
        entidad: "roles",
        entidadId: id,
        datosAnteriores: antes,
        datosPosteriores: actualizado,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return actualizado;
  });

  return despues;
}

export async function reemplazarPermisosRolServicio({
  id,
  permisos,
  usuarioAutenticado,
}) {
  const rol = await obtenerRolPorId(id);
  if (!rol) throw errorRecursoNoEncontrado("Rol no encontrado");

  return ejecutarEnTransaccion(async (cliente) => {
    const antes = await obtenerPermisosRol(id, cliente);
    const asignados = await reemplazarPermisosRol(id, permisos, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ASIGNAR_PERMISOS_ROL",
        entidad: "roles",
        entidadId: id,
        datosAnteriores: antes,
        datosPosteriores: asignados,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return asignados;
  });
}

export async function listarPermisosServicio() {
  return listarPermisos();
}
