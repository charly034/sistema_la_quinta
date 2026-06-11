const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL_PRUEBAS) {
    throw new Error("DATABASE_URL_PRUEBAS no definida");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL_PRUEBAS,
  });
  await client.connect();

  const queryRows = async (sql) => (await client.query(sql)).rows;

  const tablas = await queryRows(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name",
  );
  const clavesForaneas = await queryRows(
    "select tc.table_name, kcu.column_name, ccu.table_name as ref_table from information_schema.table_constraints tc join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema where tc.constraint_type='FOREIGN KEY' and tc.table_schema='public'",
  );
  const indices = await queryRows(
    "select indexname from pg_indexes where schemaname='public'",
  );
  const unicos = await queryRows(
    "select constraint_name from information_schema.table_constraints where table_schema='public' and constraint_type='UNIQUE'",
  );
  const checks = await queryRows(
    "select conname from pg_constraint where contype='c'",
  );

  const marca = await queryRows(
    "select count(*)::int as n from marcas where codigo='LA_QUINTA'",
  );
  const canales = await queryRows(
    "select codigo from canales where codigo in ('LOCAL','EMPRESAS','UNIVERSIDAD','VENTA_ONLINE') order by codigo",
  );
  const opciones = await queryRows(
    "select o.codigo, count(*)::int as n from opciones_menu_marca o join marcas m on m.id=o.marca_id where m.codigo='LA_QUINTA' and o.codigo in ('A','C') group by o.codigo order by o.codigo",
  );
  const roles = await queryRows("select codigo from roles order by codigo");
  const permisos = await queryRows(
    "select codigo from permisos order by codigo",
  );
  const empresas = await queryRows("select count(*)::int as n from empresas");

  const duplicadosUsuarioRol = await queryRows(
    "select count(*)::int as n from (select usuario_id, rol_id, count(*) c from usuarios_roles group by usuario_id, rol_id having count(*) > 1) t",
  );
  const duplicadosRolPermiso = await queryRows(
    "select count(*)::int as n from (select rol_id, permiso_id, count(*) c from roles_permisos group by rol_id, permiso_id having count(*) > 1) t",
  );

  console.log("TABLAS=" + tablas.map((r) => r.table_name).join(","));
  console.log("FK_COUNT=" + clavesForaneas.length);
  console.log("INDEX_COUNT=" + indices.length);
  console.log("UNIQUE_COUNT=" + unicos.length);
  console.log("CHECK_COUNT=" + checks.length);
  console.log("SEED_MARCA_LA_QUINTA=" + marca[0].n);
  console.log("SEED_CANALES=" + canales.map((r) => r.codigo).join(","));
  console.log(
    "SEED_OPCIONES=" + opciones.map((r) => `${r.codigo}:${r.n}`).join(","),
  );
  console.log("ROLES=" + roles.map((r) => r.codigo).join(","));
  console.log("PERMISOS_COUNT=" + permisos.length);
  console.log("EMPRESAS_CREADAS=" + empresas[0].n);
  console.log("DUP_USUARIO_ROL=" + duplicadosUsuarioRol[0].n);
  console.log("DUP_ROL_PERM=" + duplicadosRolPermiso[0].n);

  await client.end();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
