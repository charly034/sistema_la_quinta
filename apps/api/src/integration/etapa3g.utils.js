import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { randomUUID, createHash } from "node:crypto";
import request from "supertest";

const ROOT_API = path.resolve(process.cwd());
const ENV_PATH = path.join(ROOT_API, ".env");

export const E3G_PREFIX = "E3G";
export const E3G_YEAR = 2037;

export function cargarDatabaseUrlPruebas() {
  const texto = fs.readFileSync(ENV_PATH, "utf8");
  const match = texto.match(/^\s*DATABASE_URL_PRUEBAS\s*=\s*(.+)\s*$/m);
  if (!match) {
    throw new Error("DATABASE_URL_PRUEBAS no definida en apps/api/.env");
  }
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function obtenerNombreBaseDesdeUrl(url) {
  try {
    const parsed = new URL(url);
    const dbName = String(parsed.pathname || "")
      .replace(/^\//, "")
      .trim();
    return {
      dbName,
      host: String(parsed.hostname || "").toLowerCase(),
    };
  } catch {
    return { dbName: "", host: "" };
  }
}

export function validarDatabaseUrlPruebasSegura(url) {
  if (!url) {
    throw new Error("DATABASE_URL_PRUEBAS es obligatoria para integraciones");
  }

  const { dbName, host } = obtenerNombreBaseDesdeUrl(url);
  const nombreLower = String(dbName || "").toLowerCase();
  const hostLower = String(host || "").toLowerCase();

  const patronesPermitidos = ["prueba", "pruebas", "test", "testing", "qa"];
  const nombreValido = patronesPermitidos.some((p) => nombreLower.includes(p));
  if (!nombreValido) {
    throw new Error(
      "DATABASE_URL_PRUEBAS no parece base de pruebas (nombre sin prueba/test/qa)",
    );
  }

  const patronesProduccion = [
    "prod",
    "production",
    "live",
    "primary",
    "master",
    "rds.amazonaws.com",
    "azure.com",
  ];
  const pareceProd = patronesProduccion.some(
    (p) => hostLower.includes(p) || nombreLower.includes(p),
  );
  if (pareceProd) {
    throw new Error(
      "DATABASE_URL_PRUEBAS rechazada por política anti-producción",
    );
  }

  return {
    base: dbName,
    anti_produccion: "APROBADA",
  };
}

export function prepararEntornoPruebas(etiqueta = "etapa3g") {
  const dbPruebas = cargarDatabaseUrlPruebas();
  validarDatabaseUrlPruebasSegura(dbPruebas);
  process.env.DATABASE_URL_PRUEBAS = dbPruebas;
  process.env.JWT_SECRETO_ACCESO = `${etiqueta}-${randomUUID()}`;
  process.env.NODE_ENV = "test";

  delete process.env.DATABASE_URL;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_NAME;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_SSL;
}

export function ejecutarComando(comando) {
  execSync(comando, {
    cwd: ROOT_API,
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL_PRUEBAS: process.env.DATABASE_URL_PRUEBAS,
      JWT_SECRETO_ACCESO: process.env.JWT_SECRETO_ACCESO,
    },
  });
}

export async function bootstrapApi(etiqueta = "etapa3g") {
  prepararEntornoPruebas(etiqueta);

  const dbModule = await import("../config/db.js");
  const appModule = await import("../app.js");

  ejecutarComando("npm run migrar:subir");

  const sufijoUnico = randomUUID().slice(0, 8);
  const correoProp = `propietario.${etiqueta}.${sufijoUnico}@laquinta.local`;
  const contrasenaProp = `Tmp-${etiqueta}-${randomUUID()}`;

  process.env.CORREO_PROPETARIO = correoProp;
  process.env.CONTRASENA_PROPETARIO = contrasenaProp;
  process.env.NOMBRE_PROPETARIO = `Propietario ${etiqueta}`;
  ejecutarComando("node ./scripts/crear-propietario.js");

  await dbModule.initDb();
  const app = appModule.createApp();
  const api = request(app);

  return {
    api,
    app,
    initDb: dbModule.initDb,
    closeDb: dbModule.closeDb,
    getPool: dbModule.getPool,
    credenciales: {
      correoProp,
      contrasenaProp,
    },
  };
}

export async function login(api, correo, contrasena) {
  return api.post("/api/v1/autenticacion/iniciar-sesion").send({
    correo,
    contrasena,
  });
}

export async function crearUsuarioConRol(api, ownerToken, rolCodigo, sufijo) {
  const correo = `${rolCodigo.toLowerCase()}.${sufijo}.e3g@laquinta.local`;
  const contrasena = `Tmp-${rolCodigo}-${randomUUID()}`;

  const crear = await api
    .post("/api/v1/usuarios")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      correo,
      contrasena,
      nombre: `Usuario ${rolCodigo} ${sufijo}`,
      estado: "ACTIVO",
    });

  if (crear.status !== 201) {
    throw new Error(`No se pudo crear usuario ${rolCodigo}: ${crear.status}`);
  }

  const asignar = await api
    .put(`/api/v1/usuarios/${crear.body.datos.id}/roles`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ roles: [rolCodigo] });

  if (asignar.status !== 200) {
    throw new Error(`No se pudo asignar rol ${rolCodigo}: ${asignar.status}`);
  }

  const acceso = await login(api, correo, contrasena);
  if (acceso.status !== 200) {
    throw new Error(`No se pudo autenticar ${rolCodigo}: ${acceso.status}`);
  }

  return {
    correo,
    contrasena,
    token: acceso.body.datos.accessToken,
    id: crear.body.datos.id,
  };
}

export function calcularHashSha256(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export async function obtenerMarcaLaQuinta(pool) {
  const marca = await pool.query(
    "SELECT id, codigo, nombre FROM marcas WHERE codigo = 'LA_QUINTA' LIMIT 1",
  );
  if (!marca.rows[0]) {
    throw new Error("No existe marca LA_QUINTA");
  }
  return marca.rows[0];
}

export async function asegurarPlantillasPredeterminadasWhatsapp(
  pool,
  usuarioId,
) {
  const marca = await obtenerMarcaLaQuinta(pool);
  const configuracion = {
    usar_rango_operativo: true,
    incluir_feriados: true,
    incluir_cerrados: false,
    incluir_sin_configurar: false,
    incluir_fin_de_semana: false,
    mostrar_fecha_en_feriados: false,
  };

  await pool.query(
    `INSERT INTO plantillas_mensaje_menu (
      id, marca_id, canal_id, empresa_id, nombre, tipo, plantilla,
      configuracion, estado, es_predeterminada, creado_por, creado_en, actualizado_en
    )
    SELECT
      $1, $2, NULL, NULL,
      'Plantilla predeterminada WhatsApp La Quinta',
      'WHATSAPP',
      E'🗓️ SEMANA {{rango_semana}}\n\n{{contenido_dias}}',
      $3::jsonb,
      'ACTIVA',
      true,
      $4,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1
      FROM plantillas_mensaje_menu p
      WHERE p.tipo = 'WHATSAPP'
        AND p.estado = 'ACTIVA'
        AND p.es_predeterminada = true
        AND p.eliminado_en IS NULL
        AND p.marca_id = $2
        AND p.canal_id IS NULL
        AND p.empresa_id IS NULL
    )`,
    [randomUUID(), marca.id, JSON.stringify(configuracion), usuarioId],
  );

  await pool.query(
    `INSERT INTO plantillas_mensaje_menu (
      id, marca_id, canal_id, empresa_id, nombre, tipo, plantilla,
      configuracion, estado, es_predeterminada, creado_por, creado_en, actualizado_en
    )
    SELECT
      $1, NULL, NULL, NULL,
      'Plantilla global WhatsApp',
      'WHATSAPP',
      E'🗓️ SEMANA {{rango_semana}}\n\n{{contenido_dias}}',
      $2::jsonb,
      'ACTIVA',
      true,
      $3,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1
      FROM plantillas_mensaje_menu p
      WHERE p.tipo = 'WHATSAPP'
        AND p.estado = 'ACTIVA'
        AND p.es_predeterminada = true
        AND p.eliminado_en IS NULL
        AND p.marca_id IS NULL
        AND p.canal_id IS NULL
        AND p.empresa_id IS NULL
    )`,
    [randomUUID(), JSON.stringify(configuracion), usuarioId],
  );
}

export async function obtenerOpcionesAyC(pool, marcaId) {
  const opciones = await pool.query(
    `SELECT id, codigo, nombre
     FROM opciones_menu_marca
     WHERE marca_id = $1 AND codigo IN ('A', 'C')
     ORDER BY codigo ASC`,
    [marcaId],
  );
  if (opciones.rows.length !== 2) {
    throw new Error("No están disponibles las opciones A y C para LA_QUINTA");
  }
  return {
    A: opciones.rows.find((o) => o.codigo === "A"),
    C: opciones.rows.find((o) => o.codigo === "C"),
  };
}

export async function crearPlatoBasico(
  pool,
  {
    marcaId,
    nombre,
    codigo,
    usuarioId,
    estado = "ACTIVO",
    observaciones = null,
  },
) {
  const id = randomUUID();
  const nombreNormalizado = normalizarTexto(nombre);
  await pool.query(
    `INSERT INTO platos (
      id, marca_id, tipo, codigo, nombre, nombre_normalizado, estado,
      observaciones, creado_por, actualizado_por, creado_en, actualizado_en
    ) VALUES (
      $1, $2, 'PREPARACION', $3, $4, $5, $6,
      $7, $8, $8, NOW(), NOW()
    )`,
    [
      id,
      marcaId,
      codigo,
      nombre,
      nombreNormalizado,
      estado,
      observaciones,
      usuarioId,
    ],
  );
  return { id, nombre, nombreNormalizado, codigo };
}

export async function crearAliasPlato(pool, platoId, alias) {
  await pool.query(
    `INSERT INTO alias_platos (id, plato_id, alias, alias_normalizado, creado_en)
     VALUES ($1, $2, $3, $4, NOW())`,
    [randomUUID(), platoId, alias, normalizarTexto(alias)],
  );
}

export function obtenerLunesIso(semanaIndex = 0) {
  const base = new Date(Date.UTC(E3G_YEAR, 0, 1));
  const day = base.getUTCDay();
  const delta = day === 1 ? 0 : (8 - day) % 7;
  base.setUTCDate(base.getUTCDate() + delta + semanaIndex * 7);
  return base.toISOString().slice(0, 10);
}

export function addDaysIso(fechaIso, days) {
  const d = new Date(`${fechaIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function limpiarDatosE3G(pool) {
  const inicio = `${E3G_YEAR}-01-01`;
  const fin = `${E3G_YEAR}-12-31`;

  await pool.query(
    `DELETE FROM opciones_dia_menu
     WHERE dia_version_menu_id IN (
       SELECT d.id
       FROM dias_version_menu d
       JOIN versiones_semana_menu v ON v.id = d.version_semana_id
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE s.fecha_inicio BETWEEN $1 AND $2
     )`,
    [inicio, fin],
  );

  await pool.query(
    `DELETE FROM dias_version_menu
     WHERE version_semana_id IN (
       SELECT v.id
       FROM versiones_semana_menu v
       JOIN semanas_menu s ON s.id = v.semana_menu_id
       WHERE s.fecha_inicio BETWEEN $1 AND $2
     )`,
    [inicio, fin],
  );

  await pool.query(
    `DELETE FROM versiones_semana_menu
     WHERE semana_menu_id IN (
       SELECT id FROM semanas_menu WHERE fecha_inicio BETWEEN $1 AND $2
     )`,
    [inicio, fin],
  );

  await pool.query(
    `DELETE FROM semanas_menu WHERE fecha_inicio BETWEEN $1 AND $2`,
    [inicio, fin],
  );

  await pool.query(
    `DELETE FROM importaciones_menu WHERE nombre_archivo LIKE 'E3G-%'`,
  );

  await pool.query(`DELETE FROM alias_platos WHERE alias LIKE 'E3G %'`);
  await pool.query(
    `DELETE FROM platos WHERE (nombre LIKE 'E3G %' OR codigo LIKE 'E3G_%')`,
  );
}

export async function crearFixtureSemanalPublicado({
  api,
  ownerToken,
  pool,
  ownerUserId,
  semanaIndex = 0,
}) {
  const marca = await obtenerMarcaLaQuinta(pool);
  const opciones = await obtenerOpcionesAyC(pool, marca.id);

  const lunes = obtenerLunesIso(semanaIndex);
  const domingo = addDaysIso(lunes, 6);

  const platoA = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `E3G Plato A ${semanaIndex}`,
    codigo: `E3G_A_${semanaIndex}`,
    usuarioId: ownerUserId,
  });
  const platoC = await crearPlatoBasico(pool, {
    marcaId: marca.id,
    nombre: `E3G Plato C ${semanaIndex}`,
    codigo: `E3G_C_${semanaIndex}`,
    usuarioId: ownerUserId,
  });

  const crear = await api
    .post("/api/v1/menu/semanas")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      marcaId: marca.id,
      canalId: null,
      empresaId: null,
      fechaInicio: lunes,
      fechaFin: domingo,
    });

  if (crear.status !== 201) {
    throw new Error(`No se pudo crear fixture semanal: ${crear.status}`);
  }

  const semanaId = crear.body?.datos?.semana?.id;
  const versionId = crear.body?.datos?.versionInicial?.id;

  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${lunes}`,
    )
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ estado: "FERIADO", observaciones: "FERIADO" });

  for (let i = 1; i <= 4; i += 1) {
    const fecha = addDaysIso(lunes, i);
    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}`,
      )
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ estado: "DIA_LABORAL", observaciones: `E3G Laboral ${i}` });

    await api
      .put(
        `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${fecha}/opciones`,
      )
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        opciones: [
          {
            opcionMenuMarcaId: opciones.A.id,
            platoId: platoA.id,
            orden: 1,
          },
          {
            opcionMenuMarcaId: opciones.C.id,
            platoId: platoC.id,
            orden: 2,
          },
        ],
      });
  }

  const sabado = addDaysIso(lunes, 5);
  const domingoDia = addDaysIso(lunes, 6);
  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${sabado}`,
    )
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ estado: "SIN_CONFIGURAR", observaciones: "E3G Sabado" });
  await api
    .put(
      `/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/dias/${domingoDia}`,
    )
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ estado: "SIN_CONFIGURAR", observaciones: "E3G Domingo" });

  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/proponer`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ motivo: "E3G Proponer" });
  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/aprobar`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ motivo: "E3G Aprobar" });
  await api
    .post(`/api/v1/menu/semanas/${semanaId}/versiones/${versionId}/publicar`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ motivo: "E3G Publicar" });

  return {
    marca,
    semanaId,
    versionId,
    lunes,
    domingo,
    opciones,
    platoA,
    platoC,
  };
}

export function construirPayloadImportacion({
  nombreArchivo,
  marcaId,
  lunes,
  opcionAId,
  opcionCId,
  platoId = null,
  platoNombre = null,
  platoAlias = null,
  estadoMartes = "DIA_LABORAL",
}) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = addDaysIso(lunes, i);
    const nombreDia = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ][i];

    if (i === 0) {
      return {
        numero_dia_iso: 1,
        nombre_dia: nombreDia,
        fecha,
        estado: "FERIADO",
        opciones: [],
      };
    }

    if (i >= 5) {
      return {
        numero_dia_iso: i + 1,
        nombre_dia: nombreDia,
        fecha,
        estado: "SIN_CONFIGURAR",
        opciones: [],
      };
    }

    const opcionA = {
      opcion_menu_marca_id: opcionAId,
      orden: 1,
    };
    if (platoId) opcionA.plato_id = platoId;
    if (platoNombre) opcionA.plato_nombre = platoNombre;
    if (platoAlias) opcionA.plato_alias = platoAlias;

    return {
      numero_dia_iso: i + 1,
      nombre_dia: nombreDia,
      fecha,
      estado: i === 1 ? estadoMartes : "DIA_LABORAL",
      opciones: [
        opcionA,
        {
          opcion_menu_marca_id: opcionCId,
          plato_nombre: `E3G Import C ${fecha}`,
          orden: 2,
        },
      ],
    };
  });

  return {
    nombreArchivo,
    modoSimulacion: false,
    estrategiaConflicto: "ERROR",
    datos: {
      semanas: [
        {
          marca_id: marcaId,
          canal_id: null,
          empresa_id: null,
          fecha_inicio: lunes,
          fecha_fin: addDaysIso(lunes, 6),
          dias,
        },
      ],
    },
  };
}
