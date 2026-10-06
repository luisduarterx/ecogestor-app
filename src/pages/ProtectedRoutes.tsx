import { Navigate, Outlet, useLocation } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import { useSession } from "../utils/queries";
import { useEffect } from "react";

export function ProtectedRoute() {
  const { setUser, logout } = useLoggedUser();
  const location = useLocation();
  const session = useSession();
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

  if (session.isError) {
    return <Navigate to={"/"} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
