import { useEffect, useState, type ReactNode } from "react";
import { LoggedUserContext, type UserAuthenticated } from "./LoggedUserContext";

interface LoggedUserProviderProps {
  children: ReactNode;
}

export function LoggedUserProvider({ children }: LoggedUserProviderProps) {
  const [user, setUser] = useState<UserAuthenticated | null>(null);

  useEffect(() => {
    localStorage.removeItem("sid");
  }, []);

  function logout() {
    setUser(null);
    localStorage.removeItem("sid");
  }

  return (
    <LoggedUserContext.Provider
      value={{ user, setUser, logout, isAuthenticated: user !== null }}
    >
      {children}
    </LoggedUserContext.Provider>
  );
}
