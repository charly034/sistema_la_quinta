exports.up = (pgm) => {
  pgm.sql(
    "ALTER TABLE usuarios ADD CONSTRAINT usuarios_correo_no_vacio CHECK (length(trim(correo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE roles ADD CONSTRAINT roles_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE permisos ADD CONSTRAINT permisos_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE marcas ADD CONSTRAINT marcas_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE canales ADD CONSTRAINT canales_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE empresas ADD CONSTRAINT empresas_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE opciones_menu_marca ADD CONSTRAINT opciones_menu_marca_codigo_no_vacio CHECK (length(trim(codigo)) > 0)",
  );
  pgm.sql(
    "ALTER TABLE opciones_menu_marca ADD CONSTRAINT opciones_menu_marca_orden_no_negativo CHECK (orden >= 0)",
  );
};

exports.down = (pgm) => {
  pgm.sql(
    "ALTER TABLE opciones_menu_marca DROP CONSTRAINT IF EXISTS opciones_menu_marca_orden_no_negativo",
  );
  pgm.sql(
    "ALTER TABLE opciones_menu_marca DROP CONSTRAINT IF EXISTS opciones_menu_marca_codigo_no_vacio",
  );
  pgm.sql(
    "ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_codigo_no_vacio",
  );
  pgm.sql(
    "ALTER TABLE canales DROP CONSTRAINT IF EXISTS canales_codigo_no_vacio",
  );
  pgm.sql(
    "ALTER TABLE marcas DROP CONSTRAINT IF EXISTS marcas_codigo_no_vacio",
  );
  pgm.sql(
    "ALTER TABLE permisos DROP CONSTRAINT IF EXISTS permisos_codigo_no_vacio",
  );
  pgm.sql("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_codigo_no_vacio");
  pgm.sql(
    "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_no_vacio",
  );
};
