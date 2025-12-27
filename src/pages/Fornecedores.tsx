import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Building2, ChevronRight, FileText, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency } from "@/lib/nfe-parser";

const Fornecedores = () => {
  const navigate = useNavigate();
  const { fornecedores, nfes } = useNFeStore();

  const fornecedoresOrdenados = [...fornecedores].sort(
    (a, b) => b.totalCompras - a.totalCompras
  );

  // Dashboard do mês atual
  const dashboardMes = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const nfesDoMes = nfes.filter(nfe => {
      const dataNfe = new Date(nfe.dataEmissao);
      return dataNfe >= inicioMes && dataNfe <= fimMes;
    });

    const fornecedoresDoMes = new Set(nfesDoMes.map(nfe => nfe.fornecedor.id));
    const totalComprasMes = nfesDoMes.reduce((acc, nfe) => acc + nfe.valorTotal, 0);

    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return {
      mesNome: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
      quantidadeNfes: nfesDoMes.length,
      quantidadeFornecedores: fornecedoresDoMes.size,
      totalCompras: totalComprasMes
    };
  }, [nfes]);

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
        {/* Dashboard do Mês */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">{dashboardMes.mesNome}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                  <FileText className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{dashboardMes.quantidadeNfes}</p>
              <p className="text-xs text-muted-foreground">NFe(s)</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-success flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-success-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{dashboardMes.quantidadeFornecedores}</p>
              <p className="text-xs text-muted-foreground">Empresa(s)</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-lg font-bold text-primary truncate">{formatCurrency(dashboardMes.totalCompras)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Lista de Fornecedores */}
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Todos os Fornecedores</h3>
        
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
                      <div>
                        <p className="text-xs text-muted-foreground">Total Compras</p>
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(fornecedor.totalCompras)}
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