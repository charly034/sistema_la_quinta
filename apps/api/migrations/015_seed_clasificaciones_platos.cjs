const { randomUUID } = require("crypto");

async function obtenerMarcaLaQuinta(pgm) {
  const marca = await pgm.db.query(
    "SELECT id FROM marcas WHERE codigo = $1 LIMIT 1",
    ["LA_QUINTA"],
  );
  return marca.rows[0] || null;
}

exports.up = async (pgm) => {
  const marca = await obtenerMarcaLaQuinta(pgm);
  if (!marca) return;

  const categorias = [
    ["CARNES", "Carnes"],
    ["POLLO", "Pollo"],
    ["CERDO", "Cerdo"],
    ["PESCADOS", "Pescados"],
    ["PASTAS", "Pastas"],
    ["ARROCES", "Arroces"],
    ["TARTAS", "Tartas"],
    ["GUISOS", "Guisos"],
    ["VEGETARIANOS", "Vegetarianos"],
    ["GUARNICIONES", "Guarniciones"],
  ];

  const proteinas = [
    ["POLLO", "Pollo"],
    ["CARNE_VACUNA", "Carne vacuna"],
    ["CERDO", "Cerdo"],
    ["PESCADO", "Pescado"],
    ["HUEVO", "Huevo"],
    ["VEGETAL", "Vegetal"],
    ["SIN_PROTEINA_PRINCIPAL", "Sin proteina principal"],
  ];

  const caracteristicas = [
    ["VEGETARIANO", "Vegetariano"],
    ["VEGANO", "Vegano"],
    ["SIN_TACC", "Sin TACC"],
    ["SIN_LACTOSA", "Sin lactosa"],
    ["BAJO_FODMAP", "Bajo FODMAP"],
  ];

  for (const [indice, [codigo, nombre]] of categorias.entries()) {
    await pgm.db.query(
      "INSERT INTO categorias_plato (id, marca_id, codigo, nombre, descripcion, estado, orden, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, NULL, 'ACTIVA', $5, NOW(), NOW(), NULL) ON CONFLICT DO NOTHING",
      [randomUUID(), marca.id, codigo, nombre, indice],
    );
  }

  for (const [codigo, nombre] of proteinas) {
    await pgm.db.query(
      "INSERT INTO proteinas (id, marca_id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, NULL, 'ACTIVA', NOW(), NOW(), NULL) ON CONFLICT DO NOTHING",
      [randomUUID(), marca.id, codigo, nombre],
    );
  }

  for (const [codigo, nombre] of caracteristicas) {
    await pgm.db.query(
      "INSERT INTO caracteristicas_alimentarias (id, marca_id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($1, $2, $3, $4, NULL, 'ACTIVA', NOW(), NOW(), NULL) ON CONFLICT DO NOTHING",
      [randomUUID(), marca.id, codigo, nombre],
    );
  }
};

exports.down = async (pgm) => {
  await pgm.db.query(
    "DELETE FROM caracteristicas_alimentarias WHERE codigo = ANY($1)",
    [["VEGETARIANO", "VEGANO", "SIN_TACC", "SIN_LACTOSA", "BAJO_FODMAP"]],
  );
  await pgm.db.query("DELETE FROM proteinas WHERE codigo = ANY($1)", [
    [
      "POLLO",
      "CARNE_VACUNA",
      "CERDO",
      "PESCADO",
      "HUEVO",
      "VEGETAL",
      "SIN_PROTEINA_PRINCIPAL",
    ],
  ]);
  await pgm.db.query("DELETE FROM categorias_plato WHERE codigo = ANY($1)", [
    [
      "CARNES",
      "POLLO",
      "CERDO",
      "PESCADOS",
      "PASTAS",
      "ARROCES",
      "TARTAS",
      "GUISOS",
      "VEGETARIANOS",
      "GUARNICIONES",
    ],
  ]);
};
