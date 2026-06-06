import { createElement } from "react";

export function BrandPill({ label }) {
  return createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: "999px",
        backgroundColor: "#eef3e8",
        color: "#23412d",
        fontWeight: 600,
      },
    },
    label,
  );
}
