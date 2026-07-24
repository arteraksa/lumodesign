import { describe, expect, it } from "vitest";
import { publicLoginError } from "@/lib/auth/public-errors";

describe("publicLoginError", () => {
  it("não expõe detalhes internos de autenticação", () => {
    expect(publicLoginError(new Error("Invalid login credentials for user@example.com"))).toBe("E-mail ou senha inválidos.");
  });

  it("distingue falta de permissão sem revelar papéis", () => {
    expect(publicLoginError(new Error("Esta conta não possui acesso ao CMS."))).toMatch(/não possui acesso administrativo/);
  });
});

