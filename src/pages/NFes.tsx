import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Calendar, Building2, ChevronRight, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import { NFe } from "@/types/nfe";

const NFes = () => {
  const navigate = useNavigate();
  const { nfes, getTotalCompras } = useNFeStore();
  const [selectedNFe, setSelectedNFe] = useState<NFe | null>(null);

  const nfesOrdenadas = [...nfes].sort(
    (a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notas Fiscais</h1>
              <p className="text-sm text-muted-foreground">
                {nfes.length} NFe(s) importada(s)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Total */}
      <div className="container py-4">
        <div className="gradient-primary rounded-xl p-6 mb-6 animate-fade-in">
          <p className="text-sm text-primary-foreground/80 mb-1">Total em Compras</p>
          <p className="text-3xl font-bold text-primary-foreground">
            {formatCurrency(getTotalCompras())}
          </p>
        </div>

        {/* NFe List */}
        {nfesOrdenadas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma NFe importada</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/configuracoes")}
            >
              Importar NFes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {nfesOrdenadas.map((nfe, index) => (
              <button
                key={nfe.id}
                onClick={() => setSelectedNFe(nfe)}
                className="w-full bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-lg hover:border-primary/30 transition-all animate-slide-up text-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      NFe {nfe.numero}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{nfe.fornecedor.razaoSocial}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(new Date(nfe.dataEmissao))}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Produtos</p>
                        <p className="text-sm font-medium text-foreground">{nfe.produtos.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Impostos</p>
                        <p className="text-sm font-medium text-foreground">{formatCurrency(nfe.valorImpostos)}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(nfe.valorTotal)}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Produtos da NFe */}
      {selectedNFe && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" 
          onClick={() => setSelectedNFe(null)}
        >
          <div 
            className="bg-card w-full sm:w-auto sm:min-w-[500px] sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">NFe {selectedNFe.numero}</h2>
                  <p className="text-sm text-muted-foreground">{selectedNFe.produtos.length} produto(s)</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNFe(null)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Info da NFe */}
            <div className="p-4 bg-secondary/30 border-b border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fornecedor</p>
                  <p className="font-medium text-foreground truncate">{selectedNFe.fornecedor.razaoSocial}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium text-foreground">{formatDate(new Date(selectedNFe.dataEmissao))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Impostos</p>
                  <p className="font-medium text-foreground">{formatCurrency(selectedNFe.valorImpostos)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">{formatCurrency(selectedNFe.valorTotal)}</p>
                </div>
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {selectedNFe.produtos.map((produto, index) => (
                  <div
                    key={produto.id}
                    className="bg-secondary/30 rounded-xl p-4 border border-border/50 animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-warning flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-warning-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm leading-tight">
                          {produto.descricao}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Código: {produto.codigo}
                          {produto.codigoBarras && ` | EAN: ${produto.codigoBarras}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                          <span className="text-muted-foreground">
                            Qtd: <span className="text-foreground font-medium">{produto.quantidade} {produto.unidade}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Unit: <span className="text-foreground font-medium">{formatCurrency(produto.valorUnitarioReal || produto.valorUnitario)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Total: <span className="text-primary font-bold">{formatCurrency(produto.valorTotalComDespesas || produto.valorTotal)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFes;