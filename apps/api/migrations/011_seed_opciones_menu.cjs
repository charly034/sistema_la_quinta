const { randomUUID } = require("crypto");

exports.up = async (pgm) => {
  const marca = await pgm.db.query(
    "SELECT id FROM marcas WHERE codigo = $1 LIMIT 1",
    ["LA_QUINTA"],
  );
  if (!marca.rows[0]) return;

  const opciones = [
    ["A", "A", 0],
    ["C", "C", 1],
  ];

  for (const [codigo, nombre, orden] of opciones) {
    await pgm.db.query(
      "INSERT INTO opciones_menu_marca (id, marca_id, codigo, nombre, descripcion, orden, estado, creado_en, actualizado_en, eliminado_en) VALUES ($6, $1, $2, $3, NULL, $4, $5, NOW(), NOW(), NULL) ON CONFLICT (marca_id, codigo) DO UPDATE SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden, estado = EXCLUDED.estado",
      [marca.rows[0].id, codigo, nombre, orden, "ACTIVA", randomUUID()],
    );
  }
};

exports.down = async (pgm) => {
  const marca = await pgm.db.query(
    "SELECT id FROM marcas WHERE codigo = $1 LIMIT 1",
    ["LA_QUINTA"],
  );
  if (!marca.rows[0]) return;
  await pgm.db.query(
    "DELETE FROM opciones_menu_marca WHERE marca_id = $1 AND codigo IN ($2, $3)",
    [marca.rows[0].id, "A", "C"],
  );
};
