import { type MouseEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Building2, ChevronRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { formatCurrency } from "@/lib/nfe-parser";

const Fornecedores = () => {
  const navigate = useNavigate();
  const { fornecedores, loading } = useSupabaseData();
  const [visibleTotals, setVisibleTotals] = useState<Set<string>>(new Set());

  const toggleTotalVisibility = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setVisibleTotals(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const fornecedoresOrdenados = [...fornecedores].sort(
    (a, b) => b.totalCompras - a.totalCompras
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-foreground">Fornecedores</h1>
              <p className="text-sm text-muted-foreground">
                {fornecedores.length} fornecedor(es) cadastrado(s)
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4">
        
        {fornecedoresOrdenados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum fornecedor cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Importe NFes para cadastrar fornecedores automaticamente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fornecedoresOrdenados.map((fornecedor, index) => (
              <button
                key={fornecedor.id}
                onClick={() => navigate(`/fornecedor/${fornecedor.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-lg hover:border-primary/30 transition-all text-left animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-success-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      CNPJ: {fornecedor.cnpj}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div 
                        onClick={(e) => toggleTotalVisibility(fornecedor.id, e)}
                        className="cursor-pointer select-none"
                      >
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          Total Compras
                          {visibleTotals.has(fornecedor.id) ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {visibleTotals.has(fornecedor.id) ? formatCurrency(fornecedor.totalCompras) : "••••••"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contatos</p>
                        <p className="text-sm font-medium text-foreground">
                          {fornecedor.contatos.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fornecedores;
