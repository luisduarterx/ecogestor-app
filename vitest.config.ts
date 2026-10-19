import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/testes/configuracao.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      unstubEnvs: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/**/*.test.{ts,tsx}", "src/testes/**"],
        // Arquivos já cobertos não podem perder cobertura. Ao testar um novo
        // módulo, inclua-o aqui.
        thresholds: {
          "src/utils/autorizacao.ts": { 100: true },
          "src/utils/dataCompetencia.ts": { 100: true },
          "src/utils/api.ts": { 100: true },
          "src/utils/fiscal.ts": {
            statements: 90,
            branches: 90,
            functions: 85,
            lines: 90,
          },
          "src/utils/relatorios/formatacao.ts": {
            statements: 90,
            branches: 90,
            functions: 90,
            lines: 90,
          },
          "src/utils/relatorios/csv.ts": { 100: true },
          "src/pages/fiscal/formularioNota.ts": {
            statements: 90,
            branches: 85,
            functions: 90,
            lines: 90,
          },
          "src/pages/ProtectedRoutes.tsx": { 100: true },
          "src/pages/GuestRoute.tsx": { 100: true },
          "src/utils/senha.ts": { 100: true },
          "src/components/senha/CampoSenha.tsx": { 100: true },
          "src/components/senha/RequisitosSenha.tsx": { 100: true },
          "src/components/senha/useFormularioTrocaSenha.ts": { 100: true },
          "src/components/modals/TrocaSenhaObrigatoriaModal.tsx": { 100: true },
          "src/pages/configuracoes/AlterarSenha.tsx": { 100: true },
          "src/context/QueryClient.tsx": {
            statements: 90,
            branches: 75,
            functions: 90,
            lines: 90,
          },
        },
      },
    },
  }),
);
