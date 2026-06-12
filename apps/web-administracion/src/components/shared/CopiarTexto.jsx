import { useState } from "react";

export default function CopiarTexto({ contenido, etiqueta = "Copiar" }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(contenido || "");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1200);
  }

  return (
    <button type="button" className="btn btn--secondary" onClick={copiar}>
      {copiado ? "Copiado" : etiqueta}
    </button>
  );
}
