export function obtenerNombreDescarga(headers, fallback = "archivo.bin") {
  const disposition =
    headers?.["content-disposition"] || headers?.get?.("content-disposition");
  if (!disposition) return fallback;

  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);

  const simple = disposition.match(/filename="?([^";]+)"?/i);
  if (simple?.[1]) return simple[1];

  return fallback;
}

export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = nombreArchivo;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
