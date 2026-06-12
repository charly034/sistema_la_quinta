import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthProvider";
import LayoutPrincipal from "./components/layout/LayoutPrincipal";
import IniciarSesionPage from "./pages/IniciarSesionPage";
import InicioPage from "./pages/InicioPage";
import MenusPage from "./pages/MenusPage";
import EditorMenuPage from "./pages/EditorMenuPage";
import PlatosPage from "./pages/PlatosPage";
import ClasificacionesPage from "./pages/ClasificacionesPage";
import ReglasPage from "./pages/ReglasPage";
import PerfilesReglasPage from "./pages/PerfilesReglasPage";
import PropuestasPage from "./pages/PropuestasPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import AdminBasePage from "./pages/AdminBasePage";
import {
  listarCanales,
  listarEmpresas,
  listarMarcas,
  listarRoles,
  listarUsuarios,
} from "./services/admin.service";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/iniciar-sesion" element={<IniciarSesionPage />} />
          <Route element={<LayoutPrincipal />}>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/menus" element={<MenusPage />} />
            <Route
              path="/menus/:semanaId/versiones/:versionId"
              element={<EditorMenuPage />}
            />
            <Route path="/platos" element={<PlatosPage />} />
            <Route path="/clasificaciones" element={<ClasificacionesPage />} />
            <Route path="/reglas" element={<ReglasPage />} />
            <Route path="/perfiles-reglas" element={<PerfilesReglasPage />} />
            <Route path="/propuestas" element={<PropuestasPage />} />
            <Route
              path="/empresas"
              element={
                <AdminBasePage
                  titulo="Empresas"
                  queryKey={["empresas"]}
                  queryFn={() => listarEmpresas({ pagina: 1, tamano: 100 })}
                  columnas={[
                    { key: "nombre", label: "Nombre" },
                    { key: "estado", label: "Estado" },
                    { key: "codigo", label: "Código" },
                  ]}
                />
              }
            />
            <Route
              path="/marcas-canales"
              element={
                <div className="grid-doble">
                  <AdminBasePage
                    titulo="Marcas"
                    queryKey={["marcas"]}
                    queryFn={() => listarMarcas({ pagina: 1, tamano: 100 })}
                    columnas={[
                      { key: "nombre", label: "Nombre" },
                      { key: "estado", label: "Estado" },
                    ]}
                  />
                  <AdminBasePage
                    titulo="Canales"
                    queryKey={["canales"]}
                    queryFn={() => listarCanales({ pagina: 1, tamano: 100 })}
                    columnas={[
                      { key: "nombre", label: "Nombre" },
                      { key: "estado", label: "Estado" },
                    ]}
                  />
                </div>
              }
            />
            <Route
              path="/usuarios-roles"
              element={
                <div className="grid-doble">
                  <AdminBasePage
                    titulo="Usuarios"
                    queryKey={["usuarios"]}
                    queryFn={() => listarUsuarios({ pagina: 1, tamano: 100 })}
                    columnas={[
                      { key: "nombre", label: "Nombre" },
                      { key: "correo", label: "Correo" },
                      { key: "estado", label: "Estado" },
                    ]}
                  />
                  <AdminBasePage
                    titulo="Roles"
                    queryKey={["roles"]}
                    queryFn={() => listarRoles({ pagina: 1, tamano: 100 })}
                    columnas={[
                      { key: "nombre", label: "Rol" },
                      { key: "descripcion", label: "Descripción" },
                    ]}
                  />
                </div>
              }
            />
            <Route path="/auditoria" element={<AuditoriaPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/" element={<Navigate to="/inicio" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
