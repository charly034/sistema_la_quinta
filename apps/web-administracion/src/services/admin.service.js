import { clienteApi } from "../api/cliente-api";

function extraerDatos(raw) {
  return raw?.datos ?? raw?.data ?? raw;
}

export async function listarMarcas(params) {
  const { data } = await clienteApi.get("/marcas", { params });
  return extraerDatos(data);
}

export async function listarCanales(params) {
  const { data } = await clienteApi.get("/canales", { params });
  return extraerDatos(data);
}

export async function listarEmpresas(params) {
  const { data } = await clienteApi.get("/empresas", { params });
  return extraerDatos(data);
}

export async function listarUsuarios(params) {
  const { data } = await clienteApi.get("/usuarios", { params });
  return extraerDatos(data);
}

export async function listarRoles(params) {
  const { data } = await clienteApi.get("/roles", { params });
  return extraerDatos(data);
}

export async function listarPermisos() {
  const { data } = await clienteApi.get("/permisos");
  return extraerDatos(data);
}

export async function listarAuditoria(params) {
  const { data } = await clienteApi.get("/auditoria", { params });
  return extraerDatos(data);
}
