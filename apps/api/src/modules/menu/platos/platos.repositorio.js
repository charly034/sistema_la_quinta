import { getPool } from "../../../config/db.js";
import {
  generarIdentificador,
  normalizarCodigo,
  normalizarTexto,
} from "../../../utils/seguridad.js";
import {
  normalizarTextoBusqueda,
  normalizarDireccionOrden,
} from "./platos.utilidades.js";

function obtenerPool(cliente = null) {
  return cliente || getPool();
}

function mapearPlatoFila(fila) {
  if (!fila) return null;
  return {
    ...fila,
    aliases: fila.aliases || [],
    componentes: fila.componentes || [],
    categorias: fila.categorias || [],
    proteinas: fila.proteinas || [],
    etiquetas: fila.etiquetas || [],
    ingredientes: fila.ingredientes || [],
    alergenos: fila.alergenos || [],
    caracteristicas: fila.caracteristicas || [],
  };
}

export async function listarPlatosRepositorio(filtros, cliente = null) {
  const pool = obtenerPool(cliente);
  const valores = [];
  const condiciones = [];
  const terminoBusqueda = filtros.buscar || filtros.q;

  if (filtros.marcaId) {
    valores.push(filtros.marcaId);
    condiciones.push(`p.marca_id = $${valores.length}`);
  }
  if (filtros.tipo) {
    valores.push(filtros.tipo);
    condiciones.push(`p.tipo = $${valores.length}`);
  }
  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`p.estado = $${valores.length}`);
  }
  if (filtros.categoriaId) {
    valores.push(filtros.categoriaId);
    condiciones.push(
      `EXISTS (
        SELECT 1
        FROM platos_categorias pc
        INNER JOIN categorias_plato cp ON cp.id = pc.categoria_id
        WHERE pc.plato_id = p.id
          AND pc.categoria_id = $${valores.length}
          AND cp.eliminado_en IS NULL
          AND cp.estado <> 'ARCHIVADA'
      )`,
    );
  }
  if (filtros.proteinaId) {
    valores.push(filtros.proteinaId);
    condiciones.push(
      `EXISTS (
        SELECT 1
        FROM platos_proteinas pp
        INNER JOIN proteinas pr ON pr.id = pp.proteina_id
        WHERE pp.plato_id = p.id
          AND pp.proteina_id = $${valores.length}
          AND pr.eliminado_en IS NULL
          AND pr.estado <> 'ARCHIVADA'
      )`,
    );
  }
  if (filtros.favorito !== undefined) {
    valores.push(filtros.favorito);
    condiciones.push(`p.favorito = $${valores.length}`);
  }
  if (terminoBusqueda) {
    valores.push(`%${normalizarTextoBusqueda(terminoBusqueda)}%`);
    condiciones.push(
      `(
        translate(lower(p.nombre), 'áéíóúäëïöüñ', 'aeiouaeioun') LIKE $${valores.length}
        OR translate(lower(COALESCE(p.nombre_normalizado, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') LIKE $${valores.length}
        OR translate(lower(COALESCE(p.codigo, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') LIKE $${valores.length}
        OR EXISTS (
          SELECT 1
          FROM alias_platos ap
          WHERE ap.plato_id = p.id
            AND translate(lower(ap.alias_normalizado), 'áéíóúäëïöüñ', 'aeiouaeioun') LIKE $${valores.length}
        )
      )`,
    );
  }
  if (!filtros.includeArchivados) {
    condiciones.push(`p.eliminado_en IS NULL`);
    condiciones.push(`p.estado <> 'ARCHIVADO'`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const ordenColumna =
    {
      nombre: "p.nombre_normalizado",
      creado_en: "p.creado_en",
      actualizado_en: "p.actualizado_en",
      tipo: "p.tipo",
    }[filtros.sortBy || "nombre"] || "p.nombre_normalizado";
  const ordenDireccion = normalizarDireccionOrden(filtros.sortDir);

  valores.push(filtros.tamano, (filtros.pagina - 1) * filtros.tamano);

  const datos = await pool.query(
    `SELECT p.id, p.marca_id, m.codigo AS marca_codigo, p.tipo, p.codigo, p.nombre, p.descripcion_comercial, p.estado, p.favorito, p.apto_freezer, p.es_estacional, p.creado_en, p.actualizado_en
     FROM platos p
     INNER JOIN marcas m ON m.id = p.marca_id
     ${where}
     ORDER BY ${ordenColumna} ${ordenDireccion}
     LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );

  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM platos p ${where}`,
    valores.slice(0, valores.length - 2),
  );

  return { filas: datos.rows, total: total.rows[0]?.total || 0 };
}

export async function obtenerPlatoPorIdRepositorio(id, cliente = null) {
  const pool = obtenerPool(cliente);
  const resultado = await pool.query(
    `SELECT
      p.id,
      p.marca_id,
      p.tipo,
      p.codigo,
      p.nombre,
      p.nombre_normalizado,
      p.descripcion_comercial,
      p.descripcion_interna,
      p.estado,
      p.favorito,
      p.apto_freezer,
      p.es_estacional,
      p.temporada_desde,
      p.temporada_hasta,
      p.bloqueado_desde,
      p.bloqueado_hasta,
      p.motivo_bloqueo,
      p.tiempo_preparacion_minutos,
      p.dificultad,
      p.porcion_referencia_gramos,
      p.costo_referencia,
      p.precio_referencia,
      p.imagen_url,
      p.observaciones,
      p.creado_por,
      p.actualizado_por,
      p.creado_en,
      p.actualizado_en,
      p.eliminado_en,
      COALESCE((SELECT json_agg(json_build_object('id', a.id, 'alias', a.alias) ORDER BY a.alias) FROM alias_platos a WHERE a.plato_id = p.id), '[]'::json) AS aliases,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', cp.id,
            'platoComponenteId', cp.plato_componente_id,
            'funcion', cp.funcion,
            'orden', cp.orden,
            'cantidadReferencia', cp.cantidad_referencia,
            'unidadReferencia', cp.unidad_referencia,
            'esPrincipal', cp.es_principal,
            'nombrePlatoComponente', pc.nombre
          )
          ORDER BY cp.orden, pc.nombre
        )
        FROM componentes_plato cp
        INNER JOIN platos pc ON pc.id = cp.plato_componente_id
        WHERE cp.plato_compuesto_id = p.id
      ), '[]'::json) AS componentes,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre) ORDER BY c.nombre) FROM platos_categorias rc INNER JOIN categorias_plato c ON c.id = rc.categoria_id WHERE rc.plato_id = p.id), '[]'::json) AS categorias,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre) ORDER BY c.nombre) FROM platos_proteinas rc INNER JOIN proteinas c ON c.id = rc.proteina_id WHERE rc.plato_id = p.id), '[]'::json) AS proteinas,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre, 'tipo', c.tipo) ORDER BY c.nombre) FROM platos_etiquetas rc INNER JOIN etiquetas_plato c ON c.id = rc.etiqueta_id WHERE rc.plato_id = p.id), '[]'::json) AS etiquetas,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre, 'cantidadReferencia', rc.cantidad_referencia, 'unidadReferencia', rc.unidad_referencia, 'esPrincipal', rc.es_principal, 'esOpcional', rc.es_opcional, 'observaciones', rc.observaciones) ORDER BY c.nombre) FROM platos_ingredientes rc INNER JOIN ingredientes c ON c.id = rc.ingrediente_id WHERE rc.plato_id = p.id), '[]'::json) AS ingredientes,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre, 'tipoPresencia', rc.tipo_presencia, 'observaciones', rc.observaciones) ORDER BY c.nombre) FROM platos_alergenos rc INNER JOIN alergenos c ON c.id = rc.alergeno_id WHERE rc.plato_id = p.id), '[]'::json) AS alergenos,
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'nombre', c.nombre, 'estadoValidacion', rc.estado_validacion, 'observaciones', rc.observaciones) ORDER BY c.nombre) FROM platos_caracteristicas rc INNER JOIN caracteristicas_alimentarias c ON c.id = rc.caracteristica_id WHERE rc.plato_id = p.id), '[]'::json) AS caracteristicas
    FROM platos p
    WHERE p.id = $1
    LIMIT 1`,
    [id],
  );
  return mapearPlatoFila(resultado.rows[0]);
}

export async function buscarPlatoDuplicadoRepositorio(
  { marcaId, tipo, nombreNormalizado, excluirId },
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const valores = [marcaId, tipo, nombreNormalizado];
  const excluir = excluirId ? `AND id <> $4` : "";
  if (excluirId) valores.push(excluirId);
  const resultado = await pool.query(
    `SELECT id, estado, eliminado_en FROM platos WHERE marca_id = $1 AND tipo = $2 AND nombre_normalizado = $3 ${excluir} LIMIT 1`,
    valores,
  );
  return resultado.rows[0] || null;
}

function construirDatosPlato(datos) {
  return {
    marcaId: datos.marcaId,
    tipo: datos.tipo,
    codigo: datos.codigo ? normalizarCodigo(datos.codigo) : null,
    nombre: normalizarTexto(datos.nombre),
    nombreNormalizado: normalizarTextoBusqueda(datos.nombre),
    descripcionComercial: datos.descripcionComercial
      ? normalizarTexto(datos.descripcionComercial)
      : null,
    descripcionInterna: datos.descripcionInterna
      ? normalizarTexto(datos.descripcionInterna)
      : null,
    estado: datos.estado || "ACTIVO",
    favorito: datos.favorito ?? false,
    aptoFreezer: datos.aptoFreezer ?? null,
    esEstacional: datos.esEstacional ?? false,
    temporadaDesde: datos.temporadaDesde ?? null,
    temporadaHasta: datos.temporadaHasta ?? null,
    bloqueadoDesde: datos.bloqueadoDesde ?? null,
    bloqueadoHasta: datos.bloqueadoHasta ?? null,
    motivoBloqueo: datos.motivoBloqueo
      ? normalizarTexto(datos.motivoBloqueo)
      : null,
    tiempoPreparacionMinutos: datos.tiempoPreparacionMinutos ?? null,
    dificultad: datos.dificultad ? normalizarTexto(datos.dificultad) : null,
    porcionReferenciaGramos: datos.porcionReferenciaGramos ?? null,
    costoReferencia: datos.costoReferencia ?? null,
    precioReferencia: datos.precioReferencia ?? null,
    imagenUrl: datos.imagenUrl ?? null,
    observaciones: datos.observaciones
      ? normalizarTexto(datos.observaciones)
      : null,
    actualizadoPor: datos.actualizadoPor ?? null,
    creadoPor: datos.creadoPor ?? null,
  };
}

export async function crearPlatoRepositorio(datos, cliente = null) {
  const pool = obtenerPool(cliente);
  const fila = construirDatosPlato(datos);
  const resultado = await pool.query(
    `INSERT INTO platos (
      id, marca_id, tipo, codigo, nombre, nombre_normalizado, descripcion_comercial,
      descripcion_interna, estado, favorito, apto_freezer, es_estacional,
      temporada_desde, temporada_hasta, bloqueado_desde, bloqueado_hasta, motivo_bloqueo,
      tiempo_preparacion_minutos, dificultad, porcion_referencia_gramos,
      costo_referencia, precio_referencia, imagen_url, observaciones,
      creado_por, actualizado_por, creado_en, actualizado_en, eliminado_en
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17,
      $18, $19, $20,
      $21, $22, $23, $24,
      $25, $26, NOW(), NOW(), NULL
    ) RETURNING id`,
    [
      generarIdentificador(),
      fila.marcaId,
      fila.tipo,
      fila.codigo,
      fila.nombre,
      fila.nombreNormalizado,
      fila.descripcionComercial,
      fila.descripcionInterna,
      fila.estado,
      fila.favorito,
      fila.aptoFreezer,
      fila.esEstacional,
      fila.temporadaDesde,
      fila.temporadaHasta,
      fila.bloqueadoDesde,
      fila.bloqueadoHasta,
      fila.motivoBloqueo,
      fila.tiempoPreparacionMinutos,
      fila.dificultad,
      fila.porcionReferenciaGramos,
      fila.costoReferencia,
      fila.precioReferencia,
      fila.imagenUrl,
      fila.observaciones,
      fila.creadoPor,
      fila.actualizadoPor,
    ],
  );
  return obtenerPlatoPorIdRepositorio(resultado.rows[0].id, cliente);
}

export async function actualizarPlatoRepositorio(id, datos, cliente = null) {
  const pool = obtenerPool(cliente);
  const campos = [];
  const valores = [];

  const asignar = (columna, valor) => {
    valores.push(valor);
    campos.push(`${columna} = $${valores.length}`);
  };

  if (datos.tipo !== undefined) asignar("tipo", datos.tipo);
  if (datos.codigo !== undefined) {
    asignar("codigo", datos.codigo ? normalizarCodigo(datos.codigo) : null);
  }
  if (datos.nombre !== undefined) {
    asignar("nombre", normalizarTexto(datos.nombre));
    asignar("nombre_normalizado", normalizarTextoBusqueda(datos.nombre));
  }
  if (datos.descripcionComercial !== undefined) {
    asignar(
      "descripcion_comercial",
      datos.descripcionComercial
        ? normalizarTexto(datos.descripcionComercial)
        : null,
    );
  }
  if (datos.descripcionInterna !== undefined) {
    asignar(
      "descripcion_interna",
      datos.descripcionInterna
        ? normalizarTexto(datos.descripcionInterna)
        : null,
    );
  }
  if (datos.estado !== undefined) asignar("estado", datos.estado);
  if (datos.favorito !== undefined) asignar("favorito", datos.favorito);
  if (datos.aptoFreezer !== undefined)
    asignar("apto_freezer", datos.aptoFreezer);
  if (datos.esEstacional !== undefined)
    asignar("es_estacional", datos.esEstacional);
  if (datos.temporadaDesde !== undefined) {
    asignar("temporada_desde", datos.temporadaDesde);
  }
  if (datos.temporadaHasta !== undefined) {
    asignar("temporada_hasta", datos.temporadaHasta);
  }
  if (datos.bloqueadoDesde !== undefined) {
    asignar("bloqueado_desde", datos.bloqueadoDesde);
  }
  if (datos.bloqueadoHasta !== undefined) {
    asignar("bloqueado_hasta", datos.bloqueadoHasta);
  }
  if (datos.motivoBloqueo !== undefined) {
    asignar(
      "motivo_bloqueo",
      datos.motivoBloqueo ? normalizarTexto(datos.motivoBloqueo) : null,
    );
  }
  if (datos.tiempoPreparacionMinutos !== undefined) {
    asignar("tiempo_preparacion_minutos", datos.tiempoPreparacionMinutos);
  }
  if (datos.dificultad !== undefined) {
    asignar(
      "dificultad",
      datos.dificultad ? normalizarTexto(datos.dificultad) : null,
    );
  }
  if (datos.porcionReferenciaGramos !== undefined) {
    asignar("porcion_referencia_gramos", datos.porcionReferenciaGramos);
  }
  if (datos.costoReferencia !== undefined) {
    asignar("costo_referencia", datos.costoReferencia);
  }
  if (datos.precioReferencia !== undefined) {
    asignar("precio_referencia", datos.precioReferencia);
  }
  if (datos.imagenUrl !== undefined) asignar("imagen_url", datos.imagenUrl);
  if (datos.observaciones !== undefined) {
    asignar(
      "observaciones",
      datos.observaciones ? normalizarTexto(datos.observaciones) : null,
    );
  }
  if (datos.actualizadoPor !== undefined) {
    asignar("actualizado_por", datos.actualizadoPor);
  }
  if (datos.eliminadoEn !== undefined) {
    asignar("eliminado_en", datos.eliminadoEn);
  }

  if (!campos.length) return obtenerPlatoPorIdRepositorio(id, cliente);

  campos.push("actualizado_en = NOW()");
  valores.push(id);
  const resultado = await pool.query(
    `UPDATE platos SET ${campos.join(", ")} WHERE id = $${valores.length} RETURNING id`,
    valores,
  );

  if (!resultado.rows[0]) return null;
  return obtenerPlatoPorIdRepositorio(id, cliente);
}

export async function reemplazarComponentesRepositorio(
  platoId,
  componentes,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  await pool.query(
    `DELETE FROM componentes_plato WHERE plato_compuesto_id = $1`,
    [platoId],
  );

  for (const componente of componentes) {
    await pool.query(
      `INSERT INTO componentes_plato (
        id, plato_compuesto_id, plato_componente_id, funcion, orden,
        cantidad_referencia, unidad_referencia, es_principal, creado_en, actualizado_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        generarIdentificador(),
        platoId,
        componente.platoComponenteId,
        componente.funcion,
        componente.orden ?? 0,
        componente.cantidadReferencia ?? null,
        componente.unidadReferencia ?? null,
        componente.esPrincipal ?? false,
      ],
    );
  }
}

export async function existeCaminoEntrePlatosRepositorio(
  origenId,
  destinoId,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const resultado = await pool.query(
    `WITH RECURSIVE recorrido AS (
      SELECT cp.plato_componente_id AS actual
      FROM componentes_plato cp
      WHERE cp.plato_compuesto_id = $1
      UNION
      SELECT cp.plato_componente_id
      FROM componentes_plato cp
      INNER JOIN recorrido r ON r.actual = cp.plato_compuesto_id
    )
    SELECT 1
    FROM recorrido
    WHERE actual = $2
    LIMIT 1`,
    [origenId, destinoId],
  );
  return !!resultado.rows[0];
}

export async function crearAliasPlatoRepositorio(
  platoId,
  alias,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const resultado = await pool.query(
    `INSERT INTO alias_platos (id, plato_id, alias, alias_normalizado, creado_en)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, alias`,
    [
      generarIdentificador(),
      platoId,
      normalizarTexto(alias),
      normalizarTextoBusqueda(alias),
    ],
  );
  return resultado.rows[0];
}

export async function eliminarAliasPlatoRepositorio(aliasId, cliente = null) {
  const pool = obtenerPool(cliente);
  const resultado = await pool.query(
    `DELETE FROM alias_platos WHERE id = $1 RETURNING id`,
    [aliasId],
  );
  return !!resultado.rows[0];
}

export async function reemplazarRelacionesBasicasRepositorio(
  platoId,
  config,
  ids,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  await pool.query(`DELETE FROM ${config.tablaRelacion} WHERE plato_id = $1`, [
    platoId,
  ]);

  if (!ids.length) return;

  for (const id of ids) {
    await pool.query(
      `INSERT INTO ${config.tablaRelacion} (plato_id, ${config.columnaRelacionId}, creado_en)
       VALUES ($1, $2, NOW())`,
      [platoId, id],
    );
  }
}

export async function reemplazarIngredientesRepositorio(
  platoId,
  items,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  await pool.query(`DELETE FROM platos_ingredientes WHERE plato_id = $1`, [
    platoId,
  ]);
  for (const item of items) {
    await pool.query(
      `INSERT INTO platos_ingredientes (
        plato_id, ingrediente_id, cantidad_referencia, unidad_referencia,
        es_principal, es_opcional, observaciones, creado_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        platoId,
        item.id,
        item.cantidadReferencia ?? null,
        item.unidadReferencia ?? null,
        item.esPrincipal ?? false,
        item.esOpcional ?? false,
        item.observaciones ?? null,
      ],
    );
  }
}

export async function reemplazarAlergenosRepositorio(
  platoId,
  items,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  await pool.query(`DELETE FROM platos_alergenos WHERE plato_id = $1`, [
    platoId,
  ]);
  for (const item of items) {
    await pool.query(
      `INSERT INTO platos_alergenos (
        plato_id, alergeno_id, tipo_presencia, observaciones, creado_en
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [platoId, item.id, item.tipoPresencia, item.observaciones ?? null],
    );
  }
}

export async function reemplazarCaracteristicasRepositorio(
  platoId,
  items,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  await pool.query(`DELETE FROM platos_caracteristicas WHERE plato_id = $1`, [
    platoId,
  ]);
  for (const item of items) {
    await pool.query(
      `INSERT INTO platos_caracteristicas (
        plato_id, caracteristica_id, estado_validacion, observaciones, creado_en, actualizado_en
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [
        platoId,
        item.id,
        item.estadoValidacion || "SIN_VERIFICAR",
        item.observaciones ?? null,
      ],
    );
  }
}

export async function validarIdsCatalogoRepositorio(
  tablaCatalogo,
  ids,
  {
    marcaId = null,
    columnaEstado = null,
    estadosArchivados = ["ARCHIVADA", "ARCHIVADO"],
  } = {},
  cliente = null,
) {
  if (!ids.length) return true;
  const pool = obtenerPool(cliente);
  const condiciones = [`id = ANY($1::uuid[])`, `eliminado_en IS NULL`];
  const valores = [ids];

  if (marcaId) {
    valores.push(marcaId);
    condiciones.push(`marca_id = $${valores.length}`);
  }

  if (columnaEstado) {
    valores.push(estadosArchivados);
    condiciones.push(
      `COALESCE(${columnaEstado}, '') <> ALL($${valores.length}::text[])`,
    );
  }

  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ${tablaCatalogo} WHERE ${condiciones.join(" AND ")}`,
    valores,
  );

  return Number(resultado.rows[0]?.total || 0) === ids.length;
}

export async function listarClasificacionesRepositorio(
  config,
  filtros,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const valores = [];
  const condiciones = [];

  if (config.tieneMarca && filtros.marcaId) {
    valores.push(filtros.marcaId);
    condiciones.push(`marca_id = $${valores.length}`);
  }

  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`estado = $${valores.length}`);
  }

  if (!filtros.includeArchivadas) {
    condiciones.push(`eliminado_en IS NULL`);
    condiciones.push(`estado NOT IN ('ARCHIVADA', 'ARCHIVADO')`);
  }

  if (filtros.q) {
    valores.push(`%${normalizarTextoBusqueda(filtros.q)}%`);
    condiciones.push(
      `translate(lower(nombre), 'áéíóúäëïöüñ', 'aeiouaeioun') LIKE $${valores.length}`,
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(filtros.tamano, (filtros.pagina - 1) * filtros.tamano);

  const columnas = [
    "id",
    config.tieneMarca ? "marca_id" : null,
    "codigo",
    "nombre",
    "descripcion",
    "estado",
    "creado_en",
    "actualizado_en",
    "eliminado_en",
  ]
    .filter(Boolean)
    .join(", ");

  const datos = await pool.query(
    `SELECT ${columnas} FROM ${config.tabla} ${where} ORDER BY nombre ASC LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores,
  );

  const total = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ${config.tabla} ${where}`,
    valores.slice(0, valores.length - 2),
  );

  return { filas: datos.rows, total: total.rows[0]?.total || 0 };
}

export async function obtenerClasificacionPorIdRepositorio(
  config,
  id,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const resultado = await pool.query(
    `SELECT * FROM ${config.tabla} WHERE id = $1 LIMIT 1`,
    [id],
  );
  return resultado.rows[0] || null;
}

export async function buscarClasificacionPorCodigoRepositorio(
  config,
  { codigo, marcaId, excluirId },
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const valores = [normalizarCodigo(codigo)];
  const condiciones = [`lower(codigo) = lower($1)`];

  if (config.tieneMarca) {
    valores.push(marcaId);
    condiciones.push(`marca_id = $${valores.length}`);
  }

  if (excluirId) {
    valores.push(excluirId);
    condiciones.push(`id <> $${valores.length}`);
  }

  condiciones.push(`eliminado_en IS NULL`);

  const resultado = await pool.query(
    `SELECT id FROM ${config.tabla} WHERE ${condiciones.join(" AND ")} LIMIT 1`,
    valores,
  );
  return resultado.rows[0] || null;
}

export async function crearClasificacionRepositorio(
  config,
  datos,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const id = generarIdentificador();
  const codigo = normalizarCodigo(datos.codigo);
  const nombre = normalizarTexto(datos.nombre);
  const descripcion = datos.descripcion
    ? normalizarTexto(datos.descripcion)
    : null;
  const estado = datos.estado || config.estadoActivo;

  if (config.tieneMarca) {
    const columnas = [
      "id",
      "marca_id",
      "codigo",
      "nombre",
      "descripcion",
      "estado",
    ];
    const valores = [id, datos.marcaId, codigo, nombre, descripcion, estado];

    if (config.admiteOrden) {
      columnas.push("orden");
      valores.push(datos.orden ?? 0);
    }
    if (config.admiteTipo) {
      columnas.push("tipo");
      valores.push(datos.tipo || "OTRA");
    }
    if (config.admiteNombreNormalizado) {
      columnas.push("nombre_normalizado");
      valores.push(normalizarTextoBusqueda(nombre));
    }

    columnas.push("creado_en", "actualizado_en", "eliminado_en");
    const placeholders = valores.map((_, idx) => `$${idx + 1}`).join(", ");

    const resultado = await pool.query(
      `INSERT INTO ${config.tabla} (${columnas.join(", ")}) VALUES (${placeholders}, NOW(), NOW(), NULL) RETURNING id`,
      valores,
    );
    return obtenerClasificacionPorIdRepositorio(
      config,
      resultado.rows[0].id,
      cliente,
    );
  }

  const resultado = await pool.query(
    `INSERT INTO ${config.tabla} (
      id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en
    ) VALUES (
      $1, $2, $3, $4, $5, NOW(), NOW(), NULL
    ) RETURNING id`,
    [id, codigo, nombre, descripcion, estado],
  );

  return obtenerClasificacionPorIdRepositorio(
    config,
    resultado.rows[0].id,
    cliente,
  );
}

export async function actualizarClasificacionRepositorio(
  config,
  id,
  datos,
  cliente = null,
) {
  const pool = obtenerPool(cliente);
  const campos = [];
  const valores = [];

  const asignar = (columna, valor) => {
    valores.push(valor);
    campos.push(`${columna} = $${valores.length}`);
  };

  if (datos.codigo !== undefined)
    asignar("codigo", normalizarCodigo(datos.codigo));
  if (datos.nombre !== undefined) {
    asignar("nombre", normalizarTexto(datos.nombre));
    if (config.admiteNombreNormalizado) {
      asignar("nombre_normalizado", normalizarTextoBusqueda(datos.nombre));
    }
  }
  if (datos.descripcion !== undefined) {
    asignar(
      "descripcion",
      datos.descripcion ? normalizarTexto(datos.descripcion) : null,
    );
  }
  if (datos.estado !== undefined) asignar("estado", datos.estado);
  if (config.admiteOrden && datos.orden !== undefined) {
    asignar("orden", datos.orden);
  }
  if (datos.tipo !== undefined) asignar("tipo", datos.tipo);

  if (
    datos.estado !== undefined &&
    ["ARCHIVADA", "ARCHIVADO"].includes(String(datos.estado))
  ) {
    asignar("eliminado_en", new Date().toISOString());
  }

  if (!campos.length)
    return obtenerClasificacionPorIdRepositorio(config, id, cliente);

  campos.push("actualizado_en = NOW()");
  valores.push(id);

  await pool.query(
    `UPDATE ${config.tabla} SET ${campos.join(", ")} WHERE id = $${valores.length}`,
    valores,
  );

  return obtenerClasificacionPorIdRepositorio(config, id, cliente);
}
