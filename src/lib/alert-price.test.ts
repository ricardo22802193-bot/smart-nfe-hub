/// <reference types="node" />
import { describe, test } from "node:test";
import assert from "node:assert/strict";
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
    assert.equal(getAlertPrice(pedido(), 12).precoUnitario, 10);
  });
  test("preserva todos os encargos cobrados no total, sem somar impostos embutidos", () => {
    assert.equal(getAlertPrice(pedido({ valorTotalComDespesas: 264 }), 12).precoUnitario, 11);
  });
  test("usa a embalagem específica da compra antes do cadastro atual", () => {
    assert.equal(getAlertPrice(pedido({ quantidadeEmbalagem: 24 }), 12).precoUnitario, 5);
  });
  test("recompõe encargos e desconta descontos quando falta o custo salvo", () => {
    assert.equal(getAlertPrice(pedido({ valorTotalComDespesas: 0, valorUnitarioReal: 0 }), 12).precoUnitario, 10);
  });
  test("detecta aumento de 1,57 para 1,85 depois de desmembrar", () => {
    const anterior = getAlertPrice(pedido({ quantidade: 1, valorTotalComDespesas: 31.4 }), 20);
    const atual = getAlertPrice(pedido({ quantidade: 1, valorTotalComDespesas: 37 }), 20);
    assert.ok(Math.abs(anterior.precoUnitario - 1.57) < 0.00000001);
    assert.ok(Math.abs(atual.precoUnitario - 1.85) < 0.00000001);
    assert.ok(Math.abs(atual.precoUnitario - anterior.precoUnitario - 0.28) < 0.00000001);
  });
});