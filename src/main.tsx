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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
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
    path: "/registros",
    element: <Registro />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LoggedUserProvider>
      <RouterProvider router={router} />
    </LoggedUserProvider>
  </StrictMode>,
);
