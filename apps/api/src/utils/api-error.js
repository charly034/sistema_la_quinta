export class ApiError extends Error {
  constructor(arg1, arg2, arg3 = {}) {
    let statusCode;
    let message;
    let code = "APP_ERROR";
    let details;

    // Firma actual: (statusCode, message, options)
    if (typeof arg1 === "number") {
      statusCode = arg1;
      message = arg2;
      code = arg3?.code || "APP_ERROR";
      details = arg3?.details;
    }

    // Firma legacy usada en parte del módulo menús: (code, message, statusCode)
    if (typeof arg1 === "string") {
      code = arg1;
      message = arg2;
      statusCode = typeof arg3 === "number" ? arg3 : 400;
    }

    super(message || "Error");
    this.name = "ApiError";
    this.statusCode = statusCode || 500;
    this.code = code;
    this.details = details;
  }
}
