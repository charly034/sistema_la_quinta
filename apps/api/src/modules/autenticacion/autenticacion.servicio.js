import crypto from "crypto";
import { obtenerConfiguracionAplicacion } from "../../config/entorno.js";
import { ejecutarEnTransaccion } from "../../utils/transacciones.js";
import {
  crearAuditoria,
  crearSesionRefresco,
  crearUsuario,
  obtenerSesionPorHash,
  obtenerUsuarioPorCorreo,
  obtenerUsuarioConPermisosPorId,
  revocarFamiliaSesion,
  revocarSesion,
  revocarSesionesDeUsuario,
  actualizarContrasenaUsuario,
  actualizarUltimoAcceso,
  listarRolesYPermisos,
} from "./autenticacion.repositorio.js";
import {
  crearRefreshToken,
  crearTokenAcceso,
  hashearRefreshToken,
  hashContrasena,
  verificarContrasena,
} from "./autenticacion.utilidades.js";
import {
  errorAutenticacion,
  errorSesionRevocada,
  errorTokenInvalido,
  errorTokenVencido,
  errorUsuarioDesactivado,
  errorRegistroDuplicado,
  errorValidacionInvalida,
} from "../../utils/errores.js";
import {
  generarIdentificador,
  normalizarCorreo,
} from "../../utils/seguridad.js";
import { ESTADOS_USUARIO } from "./autenticacion.constantes.js";

function crearFechaExpiracion(duracion) {
  const ahora = new Date();
  const coincidencia = String(duracion || "30d").match(/^(\d+)([smhd])$/);
  if (!coincidencia) {
    ahora.setDate(ahora.getDate() + 30);
    return ahora;
  }

  const cantidad = Number(coincidencia[1]);
  const unidad = coincidencia[2];
  if (unidad === "s") ahora.setSeconds(ahora.getSeconds() + cantidad);
  if (unidad === "m") ahora.setMinutes(ahora.getMinutes() + cantidad);
  if (unidad === "h") ahora.setHours(ahora.getHours() + cantidad);
  if (unidad === "d") ahora.setDate(ahora.getDate() + cantidad);
  return ahora;
}

function validarContrasenaSegura(contrasena) {
  const texto = String(contrasena || "");
  const tieneLongitud = texto.length >= 8;
  const tieneLetra = /[A-Za-z]/.test(texto);
  const tieneNumero = /\d/.test(texto);
  return tieneLongitud && tieneLetra && tieneNumero;
}

async function registrarAuditoriaSegura(registro, cliente = null) {
  const configuracion = obtenerConfiguracionAplicacion();
  if (!configuracion.auditoriaHabilitada) return null;
  return crearAuditoria(
    {
      id: generarIdentificador(),
      ...registro,
    },
    cliente,
  );
}

export async function iniciarSesionServicio({
  correo,
  contrasena,
  direccionIp,
  agenteUsuario,
}) {
  const configuracion = obtenerConfiguracionAplicacion();
  const correoNormalizado = normalizarCorreo(correo);
  const usuario = await obtenerUsuarioPorCorreo(correoNormalizado);

  if (!usuario || usuario.estado !== ESTADOS_USUARIO.ACTIVO) {
    throw errorAutenticacion();
  }

  const contrasenaValida = await verificarContrasena(
    contrasena,
    usuario.hash_contrasena,
  );
  if (!contrasenaValida) {
    throw errorAutenticacion();
  }

  const refreshToken = crearRefreshToken();
  const hashRefreshToken = hashearRefreshToken(refreshToken);
  const sesionId = crypto.randomUUID();
  const familiaToken = crypto.randomUUID();
  const expiraEn = crearFechaExpiracion(configuracion.duracionRefreshToken);

  const resultado = await ejecutarEnTransaccion(async (cliente) => {
    await actualizarUltimoAcceso(usuario.id, cliente);
    const sesion = await crearSesionRefresco(
      {
        id: sesionId,
        usuarioId: usuario.id,
        hashToken: hashRefreshToken,
        familiaToken,
        expiraEn,
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );

    await registrarAuditoriaSegura(
      {
        usuarioId: usuario.id,
        accion: "INICIO_SESION",
        entidad: "autenticacion",
        entidadId: sesion.id,
        datosAnteriores: null,
        datosPosteriores: { sesionId: sesion.id },
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );

    return {
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        estado: usuario.estado,
      },
      sesion,
    };
  });

  const accessToken = crearTokenAcceso({ usuarioId: usuario.id, sesionId });
  const permisos = await listarRolesYPermisos(usuario.id);

  return {
    usuario: {
      ...resultado.usuario,
      roles: permisos.roles,
      permisos: permisos.permisos,
    },
    accessToken,
    refreshToken,
    sesionId,
  };
}

export async function renovarSesionServicio({
  refreshToken,
  direccionIp,
  agenteUsuario,
}) {
  const hashRefreshToken = hashearRefreshToken(refreshToken);
  const sesion = await obtenerSesionPorHash(hashRefreshToken);

  if (!sesion) {
    throw errorTokenInvalido();
  }

  if (sesion.revocado_en) {
    await revocarFamiliaSesion(sesion.familia_token);
    throw errorSesionRevocada();
  }

  if (new Date(sesion.expira_en) <= new Date()) {
    await revocarSesion(sesion.id);
    throw errorTokenVencido();
  }

  const nuevaSesionId = crypto.randomUUID();
  const nuevoRefreshToken = crearRefreshToken();
  const nuevoHashRefreshToken = hashearRefreshToken(nuevoRefreshToken);
  const configuracion = obtenerConfiguracionAplicacion();
  const expiraEn = crearFechaExpiracion(configuracion.duracionRefreshToken);

  await ejecutarEnTransaccion(async (cliente) => {
    await revocarSesion(sesion.id, nuevaSesionId, cliente);
    await crearSesionRefresco(
      {
        id: nuevaSesionId,
        usuarioId: sesion.usuario_id,
        hashToken: nuevoHashRefreshToken,
        familiaToken: sesion.familia_token,
        expiraEn,
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );

    await registrarAuditoriaSegura(
      {
        usuarioId: sesion.usuario_id,
        accion: "RENOVAR_SESION",
        entidad: "autenticacion",
        entidadId: nuevaSesionId,
        datosAnteriores: { sesionIdAnterior: sesion.id },
        datosPosteriores: { sesionIdNueva: nuevaSesionId },
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );
  });

  const accessToken = crearTokenAcceso({
    usuarioId: sesion.usuario_id,
    sesionId: nuevaSesionId,
  });
  const usuario = await obtenerUsuarioConPermisosPorId(sesion.usuario_id);

  return {
    accessToken,
    refreshToken: nuevoRefreshToken,
    sesionId: nuevaSesionId,
    usuario,
  };
}

export async function cerrarSesionServicio({
  refreshToken,
  direccionIp,
  agenteUsuario,
}) {
  const hashRefreshToken = hashearRefreshToken(refreshToken);
  const sesion = await obtenerSesionPorHash(hashRefreshToken);

  if (!sesion) {
    return { cerrado: true };
  }

  await ejecutarEnTransaccion(async (cliente) => {
    await revocarSesion(sesion.id, null, cliente);
    await registrarAuditoriaSegura(
      {
        usuarioId: sesion.usuario_id,
        accion: "CIERRE_SESION",
        entidad: "autenticacion",
        entidadId: sesion.id,
        datosAnteriores: { sesionId: sesion.id },
        datosPosteriores: null,
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );
  });

  return { cerrado: true };
}

export async function cambiarContrasenaServicio({
  usuarioId,
  contrasenaActual,
  nuevaContrasena,
  direccionIp,
  agenteUsuario,
}) {
  if (!validarContrasenaSegura(nuevaContrasena)) {
    throw errorValidacionInvalida([
      {
        campo: "nuevaContrasena",
        mensaje:
          "La contrasena debe tener minimo 8 caracteres, letras y numeros",
      },
    ]);
  }

  const usuario = await obtenerUsuarioConPermisosPorId(usuarioId);
  if (!usuario) {
    throw errorAutenticacion();
  }

  const usuarioCompleto = await obtenerUsuarioPorCorreo(usuario.correo);
  const contrasenaActualValida = await verificarContrasena(
    contrasenaActual,
    usuarioCompleto.hash_contrasena,
  );

  if (!contrasenaActualValida) {
    throw errorAutenticacion();
  }

  const nuevoHash = await hashContrasena(
    nuevaContrasena,
    obtenerConfiguracionAplicacion().costoHashContrasena,
  );

  await ejecutarEnTransaccion(async (cliente) => {
    const actualizado = await actualizarContrasenaUsuario(
      usuarioId,
      nuevoHash,
      cliente,
    );
    if (!actualizado) {
      throw errorRegistroDuplicado();
    }

    await revocarSesionesDeUsuario(usuarioId, cliente);
    await registrarAuditoriaSegura(
      {
        usuarioId,
        accion: "CAMBIO_CONTRASENA",
        entidad: "usuarios",
        entidadId: usuarioId,
        datosAnteriores: null,
        datosPosteriores: { usuarioId },
        direccionIp,
        agenteUsuario,
      },
      cliente,
    );
  });

  return { actualizado: true };
}

export async function obtenerMiPerfilServicio(usuarioId) {
  const usuario = await obtenerUsuarioConPermisosPorId(usuarioId);
  if (!usuario) return null;
  return usuario;
}

export async function crearUsuarioInicialServicio({
  correo,
  contrasena,
  nombre,
}) {
  const usuarioExistente = await obtenerUsuarioPorCorreo(correo);
  if (usuarioExistente) {
    return { existente: true, usuario: usuarioExistente };
  }

  if (!validarContrasenaSegura(contrasena)) {
    throw errorValidacionInvalida([
      {
        campo: "contrasena",
        mensaje:
          "La contrasena debe tener minimo 8 caracteres, letras y numeros",
      },
    ]);
  }

  const hash = await hashContrasena(
    contrasena,
    obtenerConfiguracionAplicacion().costoHashContrasena,
  );

  const usuario = await crearUsuario({
    id: crypto.randomUUID(),
    correo,
    hashContrasena: hash,
    nombre,
    estado: ESTADOS_USUARIO.ACTIVO,
  });

  return { existente: false, usuario };
}
