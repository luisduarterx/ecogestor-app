import { Navigate, Outlet } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import { useSession } from "../utils/queries";
import { useEffect } from "react";

export function GuestRoute() {
  const { setUser, logout } = useLoggedUser();

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

  if (!token) {
    return <Outlet />;
  }
  if (session.isPending) {
    return <div>...Carregando</div>;
  }
  if (session.isSuccess) {
    return <Navigate to="/dashboard" replace />;
  }
  if (session.isError) {
    return <Outlet />;
  }

  return null;
}
