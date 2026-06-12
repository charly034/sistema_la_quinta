export const itemsNavegacion = [
  { path: "/inicio", label: "Inicio", icono: "IN", permisos: [] },
  {
    path: "/menus",
    label: "Menús semanales",
    icono: "MS",
    permisos: ["MENUS_LEER", "MENUS_GESTIONAR"],
  },
  {
    path: "/platos",
    label: "Platos",
    icono: "PL",
    permisos: ["PLATOS_LEER", "PLATOS_GESTIONAR"],
  },
  {
    path: "/clasificaciones",
    label: "Clasificaciones",
    icono: "CL",
    permisos: [
      "CLASIFICACIONES_PLATOS_LEER",
      "CLASIFICACIONES_PLATOS_GESTIONAR",
    ],
  },
  {
    path: "/reglas",
    label: "Reglas",
    icono: "RG",
    permisos: ["REGLAS_LEER", "REGLAS_GESTIONAR"],
  },
  {
    path: "/perfiles-reglas",
    label: "Perfiles",
    icono: "PR",
    permisos: ["REGLAS_LEER", "REGLAS_GESTIONAR"],
  },
  {
    path: "/propuestas",
    label: "Propuestas",
    icono: "PP",
    permisos: ["PROPUESTAS_LEER", "PROPUESTAS_GENERAR", "PROPUESTAS_APLICAR"],
  },
  {
    path: "/empresas",
    label: "Empresas",
    icono: "EM",
    permisos: ["EMPRESAS_LEER", "EMPRESAS_GESTIONAR"],
  },
  {
    path: "/marcas-canales",
    label: "Marcas y canales",
    icono: "MC",
    permisos: ["MARCAS_LEER", "CANALES_LEER", "CANALES_GESTIONAR"],
  },
  {
    path: "/usuarios-roles",
    label: "Usuarios y roles",
    icono: "UR",
    permisos: ["USUARIOS_LEER", "ROLES_LEER", "USUARIOS_GESTIONAR"],
  },
  {
    path: "/auditoria",
    label: "Auditoría",
    icono: "AU",
    permisos: ["AUDITORIA_LEER"],
  },
  {
    path: "/configuracion",
    label: "Configuración",
    icono: "CF",
    permisos: [],
  },
];
