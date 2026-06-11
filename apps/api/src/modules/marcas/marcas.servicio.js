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
  listarMarcas,
  obtenerMarcaPorId,
  obtenerMarcaPorCodigo,
  crearMarca,
  actualizarMarca,
} from "./marcas.repositorio.js";

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

export async function listarMarcasServicio(query) {
  return listarMarcas(query);
}

export async function obtenerMarcaServicio(id) {
  const marca = await obtenerMarcaPorId(id);
  if (!marca) throw errorRecursoNoEncontrado("Marca no encontrada");
  return marca;
}

export async function crearMarcaServicio({ cuerpo, usuarioAutenticado }) {
  const existente = await obtenerMarcaPorCodigo(cuerpo.codigo);
  if (existente)
    throw errorRegistroDuplicado("Ya existe una marca con ese codigo");
  return ejecutarEnTransaccion(async (cliente) => {
    const marca = await crearMarca(
      { ...cuerpo, id: crypto.randomUUID() },
      cliente,
    );
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "CREAR_MARCA",
        entidad: "marcas",
        entidadId: marca.id,
        datosPosteriores: marca,
        direccionIp: usuarioAutenticado?.direccionIp,
        agenteUsuario: usuarioAutenticado?.agenteUsuario,
      },
      cliente,
    );
    return marca;
  });
}

export async function actualizarMarcaServicio({
  id,
  cuerpo,
  usuarioAutenticado,
}) {
  const antes = await obtenerMarcaPorId(id);
  if (!antes) throw errorRecursoNoEncontrado("Marca no encontrada");
  return ejecutarEnTransaccion(async (cliente) => {
    const despues = await actualizarMarca(id, cuerpo, cliente);
    await registrarAuditoria(
      {
        usuarioId: usuarioAutenticado?.id,
        accion: "ACTUALIZAR_MARCA",
        entidad: "marcas",
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
