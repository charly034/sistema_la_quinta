"use strict";
/**
 * Script idempotente para crear/actualizar el usuario E2E.
 * Variables requeridas: DATABASE_URL_PRUEBAS, E2E_USUARIO_CORREO, E2E_USUARIO_CONTRASENA
 * No imprime contraseñas ni tokens.
 * Ejecutar desde apps/api/ (cwd).
 */
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

async function main() {
  const url = process.env.DATABASE_URL_PRUEBAS;
  if (!url) throw new Error("DATABASE_URL_PRUEBAS es obligatoria");

  const correo = process.env.E2E_USUARIO_CORREO;
  const contrasena = process.env.E2E_USUARIO_CONTRASENA;
  if (!correo) throw new Error("E2E_USUARIO_CORREO es obligatoria");
  if (!contrasena) throw new Error("E2E_USUARIO_CONTRASENA es obligatoria");

  // Validación anti-producción
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL_PRUEBAS inválida");
  }
  const dbName = String(parsed.pathname || "")
    .replace(/^\//, "")
    .toLowerCase();
  if (!/(prueba|pruebas|test|testing|qa)/.test(dbName)) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada: la base no parece de pruebas",
    );
  }
  if (/(prod|production|primary|master)/.test(parsed.hostname.toLowerCase())) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  const nombre = process.env.E2E_USUARIO_NOMBRE || "Propietario E2E";
  const hashContrasena = await bcrypt.hash(contrasena, 12);

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const existing = await client.query(
      "SELECT id FROM usuarios WHERE correo = $1 AND eliminado_en IS NULL LIMIT 1",
      [correo.toLowerCase()],
    );

    let usuarioId;
    if (existing.rows[0]) {
      usuarioId = existing.rows[0].id;
      await client.query(
        `UPDATE usuarios
         SET hash_contrasena = $1, estado = 'ACTIVO', nombre = $2, actualizado_en = NOW()
         WHERE id = $3`,
        [hashContrasena, nombre, usuarioId],
      );
    } else {
      usuarioId = randomUUID();
      await client.query(
        `INSERT INTO usuarios (id, correo, nombre, hash_contrasena, estado, creado_en, actualizado_en)
         VALUES ($1, $2, $3, $4, 'ACTIVO', NOW(), NOW())`,
        [usuarioId, correo.toLowerCase(), nombre, hashContrasena],
      );
    }

    // Asegurar rol PROPIETARIO
    const rol = await client.query(
      "SELECT id FROM roles WHERE codigo = 'PROPIETARIO' LIMIT 1",
    );
    if (rol.rows[0]) {
      await client.query(
        `INSERT INTO usuarios_roles (usuario_id, rol_id, creado_en)
         VALUES ($1, $2, NOW())
         ON CONFLICT (usuario_id, rol_id) DO NOTHING`,
        [usuarioId, rol.rows[0].id],
      );
    }

    console.log("[E2E] Usuario listo:", correo);
    console.log("[E2E] ID:", usuarioId);
    // Exportar ID para uso en setup
    if (process.env.E2E_ESTADO_SALIDA_JSON) {
      const fs = require("fs");
      fs.writeFileSync(
        process.env.E2E_ESTADO_SALIDA_JSON,
        JSON.stringify({ usuarioId }),
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[E2E] Error en crear-usuario-e2e:", err.message);
  process.exit(1);
});
