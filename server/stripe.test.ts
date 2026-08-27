import { describe, expect, it } from "vitest";
import { getOrigin, StripeConfigurationError } from "./stripe";

describe("Stripe Clube", () => {
  it("usa a origem recebida e mantém fallback local", () => {
    expect(getOrigin("https://streetbarber.example")).toBe("https://streetbarber.example");
    expect(getOrigin(undefined)).toBe("http://localhost:3000");
  });

  it("expõe um erro de configuração identificável sem guardar credenciais", () => {
    const error = new StripeConfigurationError("Stripe não configurado");
    expect(error.code).toBe("PRECONDITION_FAILED");
    expect(error.message).toContain("Stripe");
  });
});
