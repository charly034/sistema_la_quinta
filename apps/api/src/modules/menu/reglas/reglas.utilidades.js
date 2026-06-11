import { ApiError } from "../../../utils/api-error.js";
import { validarParametrosPorTipo } from "./reglas.validaciones.js";

export function validarCompatibilidadContextoEmpresa({
  marcaId,
  empresa,
  empresaId,
}) {
  if (!empresaId) return;
  if (!empresa) {
    throw new ApiError(400, "Empresa no encontrada", {
      code: "EMPRESA_NO_ENCONTRADA",
    });
  }
  if (marcaId && empresa.marca_id !== marcaId) {
    throw new ApiError(409, "La empresa no es compatible con la marca", {
      code: "CONTEXTO_EMPRESA_INCOMPATIBLE",
    });
  }
}

export function validarVigencia(vigenciaDesde, vigenciaHasta) {
  if (vigenciaDesde && vigenciaHasta && vigenciaDesde > vigenciaHasta) {
    throw new ApiError(400, "Rango de vigencia inválido", {
      code: "VIGENCIA_INVALIDA",
    });
  }
}

export function validarConfiguracionParametros(tipo, parametros) {
  const validacion = validarParametrosPorTipo(tipo, parametros);
  if (!validacion.ok) {
    throw new ApiError(400, "Parámetros de regla inválidos", {
      code: "PARAMETROS_REGLA_INVALIDOS",
      details: validacion.errores,
    });
  }
  return validacion.parametros;
}

export function resolverPaginacionYOrden(query) {
  const offset = (query.pagina - 1) * query.limite;
  return {
    ...query,
    offset,
  };
}
