import crypto from "node:crypto";
import { ejecutarEnTransaccion } from "../../utils/transacciones.js";
import { crearAuditoria } from "../autenticacion/autenticacion.repositorio.js";
import { generarIdentificador } from "../../utils/seguridad.js";
import { sanitizarDatosAuditoria } from "../auditoria/auditoria.utilidades.js";
import {
  errorRegistroDuplicado,
  errorRecursoNoEncontrado,
} from "../../utils/errores.js";
import {
  listarEmpresas,
  obtenerEmpresaPorId,
  obtenerEmpresaPorCodigo,
  crearEmpresa,
  actualizarEmpresa,
  reemplazarMarcasEmpresa,
} from "./empresas.repositorio.js";
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
export async function listarEmpresasServicio(query) {
  return listarEmpresas(query);
}
export async function obtenerEmpresaServicio(id) {
  const empresa = await obtenerEmpresaPorId(id);
  if (!empresa) throw errorRecursoNoEncontrado("Empresa no encontrada");
  return empresa;
}
export async function crearEmpresaServicio({ cuerpo, usuarioAutenticado }) {
  const existente = await obtenerEmpresaPorCodigo(cuerpo.codigo);
  if (existente)
    throw errorRegistroDuplicado("Ya existe una empresa con ese codigo");
  return ejecutarEnTransaccion(async (cliente) => {
    const empresa = await crearEmpresa(
      { ...cuerpo, id: crypto.randomUUID() },
      cliente,
    );
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_EMPRESA",
        entidad: "empresas",
        entidadId: empresa.id,
        datosPosteriores: empresa,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return empresa;
  });
}
export async function actualizarEmpresaServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerEmpresaPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Empresa no encontrada");
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarEmpresa(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_EMPRESA",
        entidad: "empresas",
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
export async function reemplazarMarcasEmpresaServicio({
  id,
  marcas,
  usuarioAutenticado,
}) {
  const antes = await obtenerEmpresaPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Empresa no encontrada");
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await reemplazarMarcasEmpresa(id, marcas, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ASIGNAR_MARCAS_EMPRESA",
        entidad: "empresas",
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
