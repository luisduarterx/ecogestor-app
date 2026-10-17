"use client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";

import { Login } from "./pages/login/index.tsx";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Dashboard } from "./pages/dashboard/index.tsx";
import { Pedidos } from "./pages/pedidos/index.tsx";
import { Estoque } from "./pages/estoque/index.tsx";
import { Precos } from "./pages/precos/index.tsx";
import { Financeiro } from "./pages/financeiro/index.tsx";
import { Registro } from "./pages/registros/index.tsx";
import { LoggedUserProvider } from "./context/LoggedUser.tsx";
import { ProviderQueryClient } from "./context/QueryClient.tsx";
import { ProtectedRoute } from "./pages/ProtectedRoutes.tsx";
import { Usuarios } from "./pages/usuarios/index.tsx";
import { GuestRoute } from "./pages/GuestRoute.tsx";
import { NotFound } from "./pages/not-found/index.tsx";
import { Configuracoes } from "./pages/configuracoes/index.tsx";
import { Fiscal } from "./pages/fiscal/index.tsx";
import { NotaFiscalPagina } from "./pages/fiscal/NotaFiscalPagina.tsx";
import { RotaPermitida } from "./pages/RotaPermitida.tsx";
import { SemAcesso } from "./pages/sem-acesso/index.tsx";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: (
          <RotaPermitida pagina="dashboard">
            <Dashboard />
          </RotaPermitida>
        ),
      },
      {
        path: "/pedidos",
        element: (
          <RotaPermitida pagina="pedidos">
            <Pedidos />
          </RotaPermitida>
        ),
      },
      {
        path: "/estoque",
        element: (
          <RotaPermitida pagina="estoque">
            <Estoque />
          </RotaPermitida>
        ),
      },
      {
        path: "/precos",
        element: (
          <RotaPermitida pagina="precos">
            <Precos />
          </RotaPermitida>
        ),
      },
      {
        path: "/financeiro",
        element: (
          <RotaPermitida pagina="financeiro">
            <Financeiro />
          </RotaPermitida>
        ),
      },
      {
        path: "/usuarios",
        element: (
          <RotaPermitida pagina="usuarios">
            <Usuarios />
          </RotaPermitida>
        ),
      },
      {
        path: "/registros",
        element: (
          <RotaPermitida pagina="registros">
            <Registro />
          </RotaPermitida>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <RotaPermitida pagina="configuracoes">
            <Configuracoes />
          </RotaPermitida>
        ),
      },
      {
        path: "/fiscal",
        element: (
          <RotaPermitida pagina="fiscal">
            <Fiscal />
          </RotaPermitida>
        ),
      },
      {
        path: "/fiscal/notas/:id",
        element: (
          <RotaPermitida pagina="fiscal">
            <NotaFiscalPagina />
          </RotaPermitida>
        ),
      },
      {
        path: "/sem-acesso",
        element: <SemAcesso />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProviderQueryClient>
      <LoggedUserProvider>
        <RouterProvider router={router} />
      </LoggedUserProvider>
    </ProviderQueryClient>
  </StrictMode>,
);
