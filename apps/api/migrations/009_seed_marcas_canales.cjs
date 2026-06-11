const { randomUUID } = require("crypto");

exports.up = async (pgm) => {
  await pgm.db.query(
    "INSERT INTO marcas (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($3, $1, $2, NULL, $4, NOW(), NOW(), NULL) ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre",
    ["LA_QUINTA", "La Quinta", randomUUID(), "ACTIVA"],
  );

  const canales = [
    ["LOCAL", "Local"],
    ["EMPRESAS", "Empresas"],
    ["UNIVERSIDAD", "Universidad"],
    ["VENTA_ONLINE", "Venta online"],
  ];

  for (const [codigo, nombre] of canales) {
    await pgm.db.query(
      "INSERT INTO canales (id, codigo, nombre, descripcion, estado, creado_en, actualizado_en, eliminado_en) VALUES ($3, $1, $2, NULL, $4, NOW(), NOW(), NULL) ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre",
      [codigo, nombre, randomUUID(), "ACTIVO"],
    );
  }
};

exports.down = async (pgm) => {
  await pgm.db.query("DELETE FROM canales WHERE codigo IN ($1,$2,$3,$4)", [
    "LOCAL",
    "EMPRESAS",
    "UNIVERSIDAD",
    "VENTA_ONLINE",
  ]);
  await pgm.db.query("DELETE FROM marcas WHERE codigo = $1", ["LA_QUINTA"]);
};
