import { useState, type ReactNode } from "react";
import { LoggedUserContext, type UserAuthenticated } from "./LoggedUserContext";

const USER_STORAGE_KEY = "ecogestor_logged_user";

function getStoredUser(): UserAuthenticated | null {
  const storedUser = localStorage.getItem("sid");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as UserAuthenticated;
  } catch {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

interface LoggedUserProviderProps {
  children: ReactNode;
}

export function LoggedUserProvider({ children }: LoggedUserProviderProps) {
  const [user, setUser] = useState<UserAuthenticated | null>(getStoredUser);

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
