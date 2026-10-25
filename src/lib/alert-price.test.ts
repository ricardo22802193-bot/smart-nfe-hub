import { describe, expect, test } from "bun:test";
import { getAlertPrice } from "./alert-price";
import type { HistoricoPedido } from "../types/nfe";

const pedido = (overrides: Partial<HistoricoPedido> = {}): HistoricoPedido => ({
  id: "h", nfeId: "n", nfeNumero: "1", fornecedorId: "f", fornecedorNome: "Fornecedor",
  data: new Date("2026-04-10"), quantidade: 2, valorUnitario: 100, valorTotal: 200,
  valorImposto: 40, valorTotalComDespesas: 240, valorUnitarioReal: 120,
  despesas: { valorProduto: 200, valorFrete: 10, valorSeguro: 5, valorDesconto: 5,
    valorOutrasDespesas: 10, valorIPI: 10, valorICMSST: 10, valorICMS: 12,
    valorPIS: 3, valorCOFINS: 5 }, ...overrides,
});

describe("Custo unitário nos Alertas", () => {
  test("desmembra a caixa pelo cadastro sem dividir duas vezes", () => {
    expect(getAlertPrice(pedido(), 12).precoUnitario).toBe(10);
  });
  test("preserva todos os encargos cobrados no total, sem somar impostos embutidos", () => {
    expect(getAlertPrice(pedido({ valorTotalComDespesas: 264 }), 12).precoUnitario).toBe(11);
  });
  test("usa a embalagem específica da compra antes do cadastro atual", () => {
    expect(getAlertPrice(pedido({ quantidadeEmbalagem: 24 }), 12).precoUnitario).toBe(5);
  });
  test("recompõe encargos e desconta descontos quando falta o custo salvo", () => {
    expect(getAlertPrice(pedido({ valorTotalComDespesas: 0, valorUnitarioReal: 0 }), 12).precoUnitario).toBe(10);
  });
  test("detecta aumento de 1,57 para 1,85 depois de desmembrar", () => {
    const anterior = getAlertPrice(pedido({ quantidade: 1, valorTotalComDespesas: 31.4 }), 20);
    const atual = getAlertPrice(pedido({ quantidade: 1, valorTotalComDespesas: 37 }), 20);
    expect(anterior.precoUnitario).toBeCloseTo(1.57, 8);
    expect(atual.precoUnitario).toBeCloseTo(1.85, 8);
    expect(atual.precoUnitario - anterior.precoUnitario).toBeCloseTo(0.28, 8);
  });
});