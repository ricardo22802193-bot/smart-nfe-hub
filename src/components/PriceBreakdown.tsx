import { useState } from "react";
import { X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { DespesasProduto } from "@/types/nfe";
import { formatCurrency } from "@/lib/nfe-parser";

interface PriceBreakdownProps {
  valorUnitarioReal: number;
  quantidade: number;
  despesas: DespesasProduto;
  quantidadeEmbalagem?: number;
  onClose: () => void;
}

const PriceBreakdown = ({
  valorUnitarioReal,
  quantidade,
  despesas,
  quantidadeEmbalagem,
  onClose,
}: PriceBreakdownProps) => {
  const [showDetalhesImpostos, setShowDetalhesImpostos] = useState(false);

  const valorUnitarioFinal = quantidadeEmbalagem && quantidadeEmbalagem > 1
    ? valorUnitarioReal / quantidadeEmbalagem
    : valorUnitarioReal;

  const totalImpostos = despesas.valorIPI + despesas.valorICMS + despesas.valorPIS + 
    despesas.valorCOFINS + despesas.valorICMSST;

  const valorTotalComDespesas = despesas.valorProduto + despesas.valorFrete + 
    despesas.valorSeguro + despesas.valorOutrasDespesas + despesas.valorIPI + 
    despesas.valorICMSST - despesas.valorDesconto;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div 
        className="bg-card w-full sm:w-auto sm:min-w-[380px] sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Detalhamento do Valor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Valor Total Destacado */}
          <div className="gradient-primary rounded-xl p-4 text-center">
            <p className="text-sm text-primary-foreground/80 mb-1">Valor Unitário Real</p>
            <p className="text-3xl font-bold text-primary-foreground">
              {formatCurrency(valorUnitarioFinal)}
            </p>
            {quantidadeEmbalagem && quantidadeEmbalagem > 1 && (
              <p className="text-xs text-primary-foreground/70 mt-1">
                por unidade ({quantidadeEmbalagem} un/embalagem)
              </p>
            )}
            <p className="text-xs text-primary-foreground/70 mt-1">
              Inclui impostos e despesas
            </p>
          </div>

          {/* Breakdown do Produto */}
          <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-3">Composição do Valor</h3>
            
            <div className="space-y-2">
              {/* Valor do Produto */}
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <div>
                  <p className="text-sm text-foreground">Valor do Produto</p>
                  <p className="text-xs text-muted-foreground">Valor base sem impostos</p>
                </div>
                <span className="font-medium text-foreground">{formatCurrency(despesas.valorProduto)}</span>
              </div>

              {/* Frete */}
              {despesas.valorFrete > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">Frete</p>
                    <p className="text-xs text-muted-foreground">Custo de transporte</p>
                  </div>
                  <span className="font-medium text-warning">+{formatCurrency(despesas.valorFrete)}</span>
                </div>
              )}

              {/* Seguro */}
              {despesas.valorSeguro > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">Seguro</p>
                    <p className="text-xs text-muted-foreground">Seguro da mercadoria</p>
                  </div>
                  <span className="font-medium text-warning">+{formatCurrency(despesas.valorSeguro)}</span>
                </div>
              )}

              {/* Outras Despesas */}
              {despesas.valorOutrasDespesas > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">Outras Despesas</p>
                    <p className="text-xs text-muted-foreground">Despesas acessórias</p>
                  </div>
                  <span className="font-medium text-warning">+{formatCurrency(despesas.valorOutrasDespesas)}</span>
                </div>
              )}

              {/* IPI */}
              {despesas.valorIPI > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">IPI</p>
                    <p className="text-xs text-muted-foreground">Imposto s/ Prod. Industrializados</p>
                  </div>
                  <span className="font-medium text-destructive">+{formatCurrency(despesas.valorIPI)}</span>
                </div>
              )}

              {/* ICMS-ST */}
              {despesas.valorICMSST > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">ICMS-ST</p>
                    <p className="text-xs text-muted-foreground">Substituição Tributária</p>
                  </div>
                  <span className="font-medium text-destructive">+{formatCurrency(despesas.valorICMSST)}</span>
                </div>
              )}

              {/* Desconto */}
              {despesas.valorDesconto > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm text-foreground">Desconto</p>
                    <p className="text-xs text-muted-foreground">Desconto aplicado</p>
                  </div>
                  <span className="font-medium text-success">-{formatCurrency(despesas.valorDesconto)}</span>
                </div>
              )}

              {/* Total Pago */}
              <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3 mt-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Total Pago</p>
                  <p className="text-xs text-muted-foreground">{quantidade} unidade(s)</p>
                </div>
                <span className="font-bold text-lg text-primary">{formatCurrency(valorTotalComDespesas)}</span>
              </div>
            </div>
          </div>

          {/* Impostos Detalhados (Colapsável) */}
          <button
            onClick={() => setShowDetalhesImpostos(!showDetalhesImpostos)}
            className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              Detalhes dos Impostos ({formatCurrency(totalImpostos)})
            </span>
            {showDetalhesImpostos ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showDetalhesImpostos && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ICMS</span>
                <span className="text-foreground">{formatCurrency(despesas.valorICMS)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ICMS-ST</span>
                <span className="text-foreground">{formatCurrency(despesas.valorICMSST)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IPI</span>
                <span className="text-foreground">{formatCurrency(despesas.valorIPI)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PIS</span>
                <span className="text-foreground">{formatCurrency(despesas.valorPIS)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">COFINS</span>
                <span className="text-foreground">{formatCurrency(despesas.valorCOFINS)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border/50 font-medium">
                <span className="text-foreground">Total de Impostos</span>
                <span className="text-primary">{formatCurrency(totalImpostos)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * ICMS e PIS/COFINS geralmente já estão inclusos no valor do produto. 
                IPI e ICMS-ST são adicionados ao custo final.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
