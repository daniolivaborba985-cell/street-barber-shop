import { describe, expect, it } from "vitest";
import { buildClubPaymentOptions, getOrigin, selectPixPaymentMethodConfiguration, StripeConfigurationError } from "./stripe";

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

  it("configura Cartão sem opções de PIX", () => {
    const options = buildClubPaymentOptions("card", 6000, "2 cortes", "subscription");
    expect(options.payment_method_types).toEqual(["card"]);
    expect(options.payment_method_options).toBeUndefined();
  });

  it("configura Pix Automático recorrente com os campos aceitos pela Stripe", () => {
    const options = buildClubPaymentOptions("pix", 12500, "4 cortes", "subscription");
    expect(options.payment_method_types).toBeUndefined();
    expect(options.payment_method_options?.pix?.mandate_options).toEqual({
      amount: 12500,
      payment_schedule: "monthly",
    });
  });

  it("configura PIX em cobrança única para o ciclo de 30 dias", () => {
    const options = buildClubPaymentOptions("pix", 12500, "4 cortes", "payment");
    expect(options.payment_method_types).toEqual(["pix"]);
    expect(options.payment_method_options).toBeUndefined();
    expect(options.adaptive_pricing).toEqual({ enabled: false });
  });

  it("prioriza a configuração padrão própria com PIX elegível e ignora aplicação externa", () => {
    expect(selectPixPaymentMethodConfiguration([
      { id: "pmc_external", application: "ca_external", pix: { available: true, display_preference: { value: "on" } } },
      { id: "pmc_account_default", name: "Default", application: null, is_default: true, pix: { available: true, display_preference: { value: "on" } } },
      { id: "pmc_account_pix", name: "pagamento via pix", application: null, is_default: false, pix: { available: true, display_preference: { value: "on" } } },
    ])).toBe("pmc_account_pix");
  });

  it("não seleciona configuração sem PIX disponível ou desativada", () => {
    expect(selectPixPaymentMethodConfiguration([
      { id: "pmc_external", application: "ca_external", pix: { available: true, display_preference: { value: "on" } } },
      { id: "pmc_off", application: null, pix: { available: true, display_preference: { value: "off" } } },
      { id: "pmc_unavailable", application: null, pix: { available: false, display_preference: { value: "on" } } },
    ])).toBeNull();
  });
});
