export function tienePermiso(usuario, permiso) {
  const permisos = usuario?.permisos || [];
  return permisos.includes(permiso);
}

export function tieneAlgunoDeLosPermisos(usuario, permisosRequeridos = []) {
  return permisosRequeridos.some((permiso) => tienePermiso(usuario, permiso));
}

export function puedeGestionarMenus(usuario) {
  return tienePermiso(usuario, "MENUS_GESTIONAR");
}

export function puedePublicarMenus(usuario) {
  return tienePermiso(usuario, "MENUS_PUBLICAR");
}

export function puedeGestionarReglas(usuario) {
  return tienePermiso(usuario, "REGLAS_GESTIONAR");
}

export function puedeAplicarPropuestas(usuario) {
  return tienePermiso(usuario, "PROPUESTAS_APLICAR");
}
