# Instruções para agentes de IA

Estas instruções se aplicam a todo o repositório.

## Fluxo Git obrigatório

Antes de alterar qualquer arquivo:

1. Execute `git status --short --branch` e `git branch --show-current`.
2. Confirme que `origin/HEAD` aponta para `origin/main` e que a branch de origem da alteração é a `main`.
3. Se houver mudanças locais, preserve-as. Não descarte, sobrescreva, restaure ou inclua mudanças que não pertençam à tarefa atual.
4. Nunca implemente diretamente na `main`.
5. Crie uma branch nova e exclusiva para cada correção, funcionalidade ou alteração de documentação. Use nomes descritivos com o prefixo `codex/`, por exemplo:
   - `codex/fix-dashboard-invalid-date`
   - `codex/add-inventory-export`
   - `codex/update-ai-instructions`
6. A branch deve nascer da `main` atualizada e limpa. Se isso não for possível por causa de alterações locais, isole primeiro o trabalho existente em sua própria branch e só então inicie a nova tarefa.
7. Não misture alterações independentes na mesma branch ou commit.

Antes de entregar:

1. Confira novamente `git status --short --branch` e revise `git diff`.
2. Informe ao usuário a branch utilizada, os arquivos alterados e as validações executadas.
3. Não faça push, merge, rebase, force-push ou abra pull request sem solicitação explícita.

## Visão geral do projeto

- Front-end web do EcoGestor, construído com React 19, TypeScript e Vite.
- Estilos com Tailwind CSS.
- Rotas em `src/main.tsx`, usando React Router.
- Integrações HTTP centralizadas em `src/utils/api.ts`.
- Consultas e mutações remotas centralizadas em `src/utils/queries.ts`, usando TanStack Query.
- Contratos e tipos compartilhados em `src/utils/types.ts`.
- Páginas em `src/pages` e componentes reutilizáveis em `src/components`.
- A API usa `VITE_API_URL`; na ausência da variável, o endereço local padrão é `http://localhost:4000/v1/`.
- A autenticação usa cookies (`withCredentials: true`). Preserve esse contrato.

## Regras de implementação

- Mantenha TypeScript estrito e evite `any`.
- Reutilize os componentes, tipos, hooks e padrões visuais existentes antes de criar novas abstrações.
- Não faça chamadas HTTP diretamente em componentes quando a operação puder ser representada em `src/utils/queries.ts`.
- Mantenha chaves de cache do TanStack Query consistentes e invalide apenas os dados afetados por uma mutação.
- Trate estados de carregamento, vazio e erro nas telas que dependem da API.
- Valide entradas do usuário antes de convertê-las, enviá-las à API ou usá-las em cálculos. Datas devem ser validadas como datas reais, incluindo dias inexistentes, intervalos invertidos e limites permitidos.
- Preserve textos de interface em português do Brasil e o padrão visual já usado pelo projeto.
- Não altere contratos da API com base em suposições. Confirme os tipos e os usos existentes no repositório.
- Não inclua segredos, credenciais, tokens ou arquivos de ambiente no código ou nos commits.
- Evite refatorações não relacionadas à tarefa atual.

## Validação mínima

Após mudanças de código, execute:

```bash
npm run build
npm run lint
npm run lint:prettier:check
```

Se algum comando falhar, corrija o problema causado pela alteração. Falhas preexistentes devem ser documentadas claramente, sem modificar código fora do escopo apenas para ocultá-las.

Quando houver testes automatizados relacionados à área alterada, execute-os também. Para correções de defeitos, adicione ou atualize um teste de regressão quando a infraestrutura de testes permitir.

## Segurança e preservação de dados

- Nunca use comandos destrutivos, como `git reset --hard`, para resolver conflitos ou limpar o diretório de trabalho.
- Não remova arquivos ou mudanças locais sem autorização explícita.
- Não modifique artefatos gerados em `dist`; eles são produzidos pelo processo de build.
- Mudanças em autenticação, permissões, finanças e estoque exigem atenção especial aos contratos da API e aos estados de erro.
