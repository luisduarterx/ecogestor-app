import { createContext } from "react";

export type UserAuthenticated = {
  id: number;
  nome: string;
  email: string;
  cargoID: number;
  permissoes: string[];
};

export type LoggedUserContextType = {
  user: UserAuthenticated | null;
  setUser: (user: UserAuthenticated) => void;
  logout: () => void;
};

export const LoggedUserContext = createContext<
  LoggedUserContextType | undefined
>(undefined);
