import type { HistoricoPedido } from "../types/nfe";

const positive = (value: number | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** Invoice totals already contain embedded ICMS/PIS/COFINS: never add them twice. */
export function getAlertPrice(pedido: HistoricoPedido, embalagemProduto?: number) {
  const quantidadeEmbalagem = positive(pedido.quantidadeEmbalagem)
    ? pedido.quantidadeEmbalagem
    : positive(embalagemProduto) ? embalagemProduto : 1;

  let precoEmbalagem = 0;
  if (positive(pedido.quantidade) && positive(pedido.valorTotalComDespesas)) {
    // Preserve every billed charge, including charges not represented in the breakdown.
    precoEmbalagem = pedido.valorTotalComDespesas / pedido.quantidade;
  } else if (positive(pedido.valorUnitarioReal)) {
    precoEmbalagem = pedido.valorUnitarioReal;
  } else if (positive(pedido.quantidade)) {
    const d = pedido.despesas;
    const total = (d?.valorProduto || pedido.valorTotal || 0)
      + (d?.valorFrete || 0) + (d?.valorSeguro || 0)
      + (d?.valorOutrasDespesas || 0) + (d?.valorIPI || 0)
      + (d?.valorICMSST || 0) - (d?.valorDesconto || 0);
    precoEmbalagem = total / pedido.quantidade;
  } else if (positive(pedido.valorUnitario)) {
    precoEmbalagem = pedido.valorUnitario;
  }

  return {
    precoEmbalagem,
    quantidadeEmbalagem,
    precoUnitario: precoEmbalagem / quantidadeEmbalagem,
  };
}