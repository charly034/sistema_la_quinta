import { ApiError } from "../utils/api-error.js";

export function notFoundHandler(req, _res, next) {
  next(
    new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, {
      code: "NOT_FOUND",
    }),
  );
}

export function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.statusCode || 500;
  const payload = {
    ok: false,
    error: statusCode >= 500 ? "Error interno" : err?.message || "Error",
  };

  if (err?.code) payload.code = err.code;
  if (err?.details) payload.details = err.details;

  if (statusCode >= 500) {
    console.error("Unhandled error:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });
  }

  return res.status(statusCode).json(payload);
}
