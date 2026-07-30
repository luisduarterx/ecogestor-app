import { Navigate, Outlet, useLocation } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import { useSession } from "../utils/queries";

export function ProtectedRoute() {
  const { user, setUser, logout, isAuthenticated } = useLoggedUser();
  const location = useLocation();
  const token = localStorage.getItem("sid");
  const session = useSession(Boolean(user && token));
  if (session.isSuccess) {
    setUser(session.data);
  } else logout();
  // useEffect(() => {
  //   if (session.isSuccess) {

  //     setUser(session.data);
  //   }
  //   if (session.isError) {
  //     logout();

  //     localStorage.removeItem("sid");
  //   }
  // }, [session.isSuccess, session.isError, session.data, setUser, logout]);

  if (!user || !token || !isAuthenticated) {
    return <Navigate to={"/"} replace state={{ from: location.pathname }} />;
  }
  if (session.isError) {
    console.log("session error");
    <Navigate to={"/"} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
