exports.up = (pgm) => {
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo_normalizado_unico ON usuarios (lower(correo));`,
  );
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS marcas_codigo_normalizado_unico ON marcas (lower(codigo));`,
  );
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS canales_codigo_normalizado_unico ON canales (lower(codigo));`,
  );
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS empresas_codigo_normalizado_unico ON empresas (lower(codigo));`,
  );
  pgm.sql(
    `CREATE UNIQUE INDEX IF NOT EXISTS opciones_menu_marca_codigo_normalizado_unico ON opciones_menu_marca (marca_id, lower(codigo));`,
  );
};

exports.down = (pgm) => {
  pgm.sql("DROP INDEX IF EXISTS usuarios_correo_normalizado_unico");
  pgm.sql("DROP INDEX IF EXISTS marcas_codigo_normalizado_unico");
  pgm.sql("DROP INDEX IF EXISTS canales_codigo_normalizado_unico");
  pgm.sql("DROP INDEX IF EXISTS empresas_codigo_normalizado_unico");
  pgm.sql("DROP INDEX IF EXISTS opciones_menu_marca_codigo_normalizado_unico");
};
