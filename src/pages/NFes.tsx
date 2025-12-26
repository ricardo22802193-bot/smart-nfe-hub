import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";

const NFes = () => {
  const navigate = useNavigate();
  const { nfes, getTotalCompras } = useNFeStore();

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
              <div
                key={nfe.id}
                className="bg-card rounded-xl border border-border p-4 shadow-card animate-slide-up"
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFes;
