import { ApiError } from "../utils/api-error.js";

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function validate(schemas = {}) {
  return (req, _res, next) => {
    for (const section of ["params", "query", "body"]) {
      const schema = schemas[section];
      if (!schema) continue;

      const parsed = schema.safeParse(req[section]);
      if (!parsed.success) {
        return next(
          new ApiError(400, "Datos de entrada invalidos", {
            code: "VALIDATION_ERROR",
            details: {
              section,
              issues: formatZodIssues(parsed.error.issues),
            },
          }),
        );
      }

      req[section] = parsed.data;
    }

    return next();
  };
}
