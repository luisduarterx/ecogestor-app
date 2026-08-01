import { Navigate, Outlet, useLocation } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import { useSession } from "../utils/queries";
import { useEffect } from "react";

export function ProtectedRoute() {
  const { setUser, logout } = useLoggedUser();
  const location = useLocation();
  const token = localStorage.getItem("sid");
  const session = useSession(Boolean(token));
  useEffect(() => {
    if (session.isSuccess) {
      setUser(session.data);
    }

    if (session.isError) {
      logout();
    }
  }, [session.isSuccess, session.isError, session.data, setUser, logout]);
  if (session.isPending) {
    return <div>Carregando...</div>;
  }

  if (!token) {
    return <Navigate to={"/"} replace state={{ from: location.pathname }} />;
  }
  if (session.isError) {
    <Navigate to={"/"} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
