// src/services/pedidosApi.js

const API_BASE = "https://api.iamdz.cloud";

export async function fetchPedidos({ signal } = {}) {
  const url = `${API_BASE}/pedidos`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `La API no devolvió JSON. HTTP ${res.status}. Body: ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Respuesta inesperada: la API no devolvió un array de pedidos.",
    );
  }

  return data;
}

export async function updatePedidoStatus(id, estado) {
  const url = `${API_BASE}/pedidos/${id}/estado`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ estado }),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `La API no devolvió JSON. HTTP ${res.status}. Body: ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }

  return data;
}
