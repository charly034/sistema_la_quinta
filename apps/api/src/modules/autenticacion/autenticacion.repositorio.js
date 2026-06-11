import { getPool } from "../../config/db.js";
import { normalizarCorreo, normalizarCodigo } from "../../utils/seguridad.js";

function construirPermisosDesdeFilas(filas) {
  const permisos = new Set();
  const roles = [];

  for (const fila of filas) {
    roles.push({
      id: fila.rol_id,
      codigo: fila.rol_codigo,
      nombre: fila.rol_nombre,
    });
    if (fila.permiso_codigo) {
      permisos.add(fila.permiso_codigo);
    }
  }

  return {
    roles,
    permisos: Array.from(permisos),
  };
}

export async function obtenerUsuarioPorCorreo(correo, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT id, correo, hash_contrasena, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en
      FROM usuarios
      WHERE correo = $1
      LIMIT 1
    `,
    [normalizarCorreo(correo)],
  );

  return resultado.rows[0] || null;
}

export async function obtenerUsuarioPorId(usuarioId, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en
      FROM usuarios
      WHERE id = $1
      LIMIT 1
    `,
    [usuarioId],
  );

  return resultado.rows[0] || null;
}

export async function obtenerUsuarioConPermisosPorId(
  usuarioId,
  cliente = null,
) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT
        u.id,
        u.correo,
        u.nombre,
        u.estado,
        r.id AS rol_id,
        r.codigo AS rol_codigo,
        r.nombre AS rol_nombre,
        p.codigo AS permiso_codigo
      FROM usuarios u
      LEFT JOIN usuarios_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles r ON r.id = ur.rol_id
      LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
      LEFT JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.id = $1
    `,
    [usuarioId],
  );

  if (resultado.rowCount === 0) return null;

  const base = resultado.rows[0];
  const agrupado = construirPermisosDesdeFilas(resultado.rows);

  return {
    id: base.id,
    correo: base.correo,
    nombre: base.nombre,
    estado: base.estado,
    roles: agrupado.roles,
    permisos: agrupado.permisos,
  };
}

export async function obtenerSesionActivaPorId(sesionId, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT id, usuario_id, hash_token, familia_token, creado_en, expira_en, revocado_en, reemplazado_por_id, direccion_ip, agente_usuario
      FROM sesiones_refresco
      WHERE id = $1
      LIMIT 1
    `,
    [sesionId],
  );

  return resultado.rows[0] || null;
}

export async function obtenerSesionPorHash(hashToken, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT id, usuario_id, hash_token, familia_token, creado_en, expira_en, revocado_en, reemplazado_por_id, direccion_ip, agente_usuario
      FROM sesiones_refresco
      WHERE hash_token = $1
      LIMIT 1
    `,
    [hashToken],
  );

  return resultado.rows[0] || null;
}

export async function crearUsuario(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      INSERT INTO usuarios (
        id, correo, hash_contrasena, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en
      ) VALUES ($1, $2, $3, $4, $5, NULL, NOW(), NOW(), NULL)
      RETURNING id, correo, nombre, estado, ultimo_acceso_en, creado_en, actualizado_en, eliminado_en
    `,
    [
      datos.id,
      normalizarCorreo(datos.correo),
      datos.hashContrasena,
      datos.nombre,
      datos.estado,
    ],
  );

  return resultado.rows[0];
}

export async function actualizarContrasenaUsuario(
  usuarioId,
  hashContrasena,
  cliente = null,
) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      UPDATE usuarios
      SET hash_contrasena = $1,
          actualizado_en = NOW()
      WHERE id = $2
      RETURNING id, correo, nombre, estado
    `,
    [hashContrasena, usuarioId],
  );

  return resultado.rows[0] || null;
}

export async function actualizarUltimoAcceso(usuarioId, cliente = null) {
  const pool = cliente || getPool();
  await pool.query(
    `
      UPDATE usuarios
      SET ultimo_acceso_en = NOW(), actualizado_en = NOW()
      WHERE id = $1
    `,
    [usuarioId],
  );
}

export async function crearSesionRefresco(datos, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      INSERT INTO sesiones_refresco (
        id, usuario_id, hash_token, familia_token, creado_en, expira_en, revocado_en, reemplazado_por_id, direccion_ip, agente_usuario
      ) VALUES ($1, $2, $3, $4, NOW(), $5, NULL, NULL, $6, $7)
      RETURNING id, usuario_id, hash_token, familia_token, creado_en, expira_en, revocado_en, reemplazado_por_id, direccion_ip, agente_usuario
    `,
    [
      datos.id,
      datos.usuarioId,
      datos.hashToken,
      datos.familiaToken,
      datos.expiraEn,
      datos.direccionIp || null,
      datos.agenteUsuario || null,
    ],
  );

  return resultado.rows[0];
}

export async function revocarSesion(
  sesionId,
  reemplazadoPorId = null,
  cliente = null,
) {
  const pool = cliente || getPool();
  await pool.query(
    `
      UPDATE sesiones_refresco
      SET revocado_en = COALESCE(revocado_en, NOW()),
          reemplazado_por_id = COALESCE(reemplazado_por_id, $2)
      WHERE id = $1
    `,
    [sesionId, reemplazadoPorId],
  );
}

export async function revocarSesionesDeUsuario(usuarioId, cliente = null) {
  const pool = cliente || getPool();
  await pool.query(
    `
      UPDATE sesiones_refresco
      SET revocado_en = COALESCE(revocado_en, NOW())
      WHERE usuario_id = $1
        AND revocado_en IS NULL
    `,
    [usuarioId],
  );
}

export async function revocarFamiliaSesion(familiaToken, cliente = null) {
  const pool = cliente || getPool();
  await pool.query(
    `
      UPDATE sesiones_refresco
      SET revocado_en = COALESCE(revocado_en, NOW())
      WHERE familia_token = $1
        AND revocado_en IS NULL
    `,
    [familiaToken],
  );
}

export async function crearAuditoria(registro, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      INSERT INTO auditoria (
        id, usuario_id, accion, entidad, entidad_id, datos_anteriores, datos_posteriores, direccion_ip, agente_usuario, motivo, creado_en
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, NOW())
      RETURNING id
    `,
    [
      registro.id,
      registro.usuarioId || null,
      registro.accion,
      registro.entidad,
      registro.entidadId || null,
      registro.datosAnteriores
        ? JSON.stringify(registro.datosAnteriores)
        : null,
      registro.datosPosteriores
        ? JSON.stringify(registro.datosPosteriores)
        : null,
      registro.direccionIp || null,
      registro.agenteUsuario || null,
      registro.motivo || null,
    ],
  );

  return resultado.rows[0];
}

export async function listarRolesYPermisos(usuarioId, cliente = null) {
  const pool = cliente || getPool();
  const resultado = await pool.query(
    `
      SELECT
        r.id AS rol_id,
        r.codigo AS rol_codigo,
        r.nombre AS rol_nombre,
        p.codigo AS permiso_codigo
      FROM usuarios_roles ur
      INNER JOIN roles r ON r.id = ur.rol_id
      LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
      LEFT JOIN permisos p ON p.id = rp.permiso_id
      WHERE ur.usuario_id = $1
      ORDER BY r.codigo
    `,
    [usuarioId],
  );

  const agrupado = construirPermisosDesdeFilas(resultado.rows);
  return agrupado;
}
