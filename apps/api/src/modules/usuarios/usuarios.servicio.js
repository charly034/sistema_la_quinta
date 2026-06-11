import crypto from "node:crypto";
import { ejecutarEnTransaccion } from "../../utils/transacciones.js";
import {
  errorRegistroDuplicado,
  errorRecursoNoEncontrado,
} from "../../utils/errores.js";
import { generarIdentificador } from "../../utils/seguridad.js";
import { crearAuditoria } from "../autenticacion/autenticacion.repositorio.js";
import { sanitizarDatosAuditoria } from "../auditoria/auditoria.utilidades.js";
import {
  listarUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorCorreo,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  reemplazarRolesUsuario,
  obtenerRolesUsuario,
} from "./usuarios.repositorio.js";
import {
  hashContrasena,
  verificarContrasena,
} from "../autenticacion/autenticacion.utilidades.js";
import { obtenerConfiguracionAplicacion } from "../../config/entorno.js";
import { revocarSesionesDeUsuario } from "../autenticacion/autenticacion.repositorio.js";

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

export async function listarUsuariosServicio(query) {
  return listarUsuarios(query);
}

export async function obtenerUsuarioServicio(id) {
  const usuario = await obtenerUsuarioPorId(id);
  if (!usuario) throw errorRecursoNoEncontrado("Usuario no encontrado");
  const roles = await obtenerRolesUsuario(id);
  return { ...usuario, roles };
}

export async function crearUsuarioServicio({ cuerpo, usuarioAutenticado }) {
  const existente = await obtenerUsuarioPorCorreo(cuerpo.correo);
  if (existente) {
    throw errorRegistroDuplicado("Ya existe un usuario con ese correo");
  }

  const hash = await hashContrasena(
    cuerpo.contrasena,
    obtenerConfiguracionAplicacion().costoHashContrasena,
  );

  return ejecutarEnTransaccion(async (cliente) => {
    const usuario = await crearUsuario(
      {
        id: crypto.randomUUID(),
        correo: cuerpo.correo,
        hashContrasena: hash,
        nombre: cuerpo.nombre,
        estado: cuerpo.estado || "ACTIVO",
      },
      cliente,
    );

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_USUARIO",
        entidad: "usuarios",
        entidadId: usuario.id,
        datosPosteriores: usuario,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );

    return usuario;
  });
}

export async function actualizarUsuarioServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerUsuarioPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Usuario no encontrado");

  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarUsuario(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_USUARIO",
        entidad: "usuarios",
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

export async function cambiarEstadoUsuarioServicio({
  id,
  estado,
  usuarioAutenticado,
}) {
  const antes = await obtenerUsuarioPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Usuario no encontrado");

  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await cambiarEstadoUsuario(id, estado, cliente);
    if (
      estado === "INACTIVO" ||
      estado === "BLOQUEADO" ||
      estado === "ARCHIVADO"
    ) {
      await revocarSesionesDeUsuario(id, cliente);
    }

    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CAMBIAR_ESTADO_USUARIO",
        entidad: "usuarios",
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

export async function reemplazarRolesUsuarioServicio({
  id,
  roles,
  usuarioAutenticado,
}) {
  const antes = await obtenerRolesUsuario(id);
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await reemplazarRolesUsuario(id, roles, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ASIGNAR_ROLES_USUARIO",
        entidad: "usuarios",
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
