import { Navigate, Outlet } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import { useSession } from "../utils/queries";
import { useEffect } from "react";

export function GuestRoute() {
  const { setUser, logout } = useLoggedUser();

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
