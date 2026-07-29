import {
  useState,
  type ReactNode,
} from "react";
import {
  LoggedUserContext,
  type UserAuthenticated,
} from "./LoggedUserContext";

const USER_STORAGE_KEY = "ecogestor_logged_user";

function getStoredUser(): UserAuthenticated | null {
  const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);

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
  const [user, setUserState] = useState<UserAuthenticated | null>(getStoredUser);

  function setUser(userToAuthenticate: UserAuthenticated) {
    setUserState(userToAuthenticate);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToAuthenticate));
  }

  function logout() {
    setUserState(null);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  return (
    <LoggedUserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </LoggedUserContext.Provider>
  );
}
