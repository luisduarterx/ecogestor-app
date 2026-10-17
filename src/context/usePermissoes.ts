import { useSession } from "../utils/queries";

// Lê as permissões direto da sessão em cache, que já está carregada quando
// uma rota protegida renderiza.
export function usePermissoes() {
  const session = useSession();
  const permissoes = session.data?.permissoes ?? [];

  return {
    permissoes,
    pode: (permissao: string) => permissoes.includes(permissao),
    podeAlguma: (...lista: string[]) =>
      lista.some((permissao) => permissoes.includes(permissao)),
  };
}
