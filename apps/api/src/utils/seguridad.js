import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export function normalizarCorreo(correo) {
  return String(correo || "")
    .trim()
    .toLowerCase();
}

export function normalizarCodigo(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizarTexto(valor) {
  return String(valor || "").trim();
}

export function generarTokenAleatorio(longitudBytes = 32) {
  return crypto.randomBytes(longitudBytes).toString("hex");
}

export function generarIdentificador() {
  return crypto.randomUUID();
}

export function hashTokenSeguro(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function compararHashSeguro(valorA, valorB) {
  const bufferA = Buffer.from(String(valorA));
  const bufferB = Buffer.from(String(valorB));
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export async function hashContrasena(contrasena, costo = 12) {
  return bcrypt.hash(String(contrasena), Number(costo) || 12);
}

export async function verificarContrasena(contrasena, hash) {
  return bcrypt.compare(String(contrasena), String(hash));
}

export function normalizarListaOrigenes(valor) {
  if (!valor) return [];
  return String(valor)
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);
}
