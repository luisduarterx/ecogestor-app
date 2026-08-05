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

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/pedidos",
        element: <Pedidos />,
      },
      {
        path: "/estoque",
        element: <Estoque />,
      },
      {
        path: "/precos",
        element: <Precos />,
      },
      {
        path: "/financeiro",
        element: <Financeiro />,
      },
      {
        path: "/usuarios",
        element: <Usuarios />,
      },
      {
        path: "/registros",
        element: <Registro />,
      },
    ],
  },
  {
    path: "/",
    element: <Login />,
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
