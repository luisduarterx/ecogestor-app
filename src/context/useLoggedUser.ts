import { useContext } from "react";
import { LoggedUserContext } from "./LoggedUserContext";

export function useLoggedUser() {
  const context = useContext(LoggedUserContext);

  if (!context) {
    throw new Error(
      "useLoggedUser deve ser utilizado dentro de LoggedUserProvider.",
    );
  }

  return context;
}
