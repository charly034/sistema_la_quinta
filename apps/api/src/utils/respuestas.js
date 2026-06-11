export function responderExito(res, datos = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    exito: true,
    datos,
    meta,
  });
}

export function responderError(
  res,
  codigo,
  mensaje,
  detalles = [],
  statusCode = 400,
) {
  return res.status(statusCode).json({
    exito: false,
    error: {
      codigo,
      mensaje,
      detalles,
    },
  });
}
