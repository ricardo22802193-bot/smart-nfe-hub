import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, TrendingUp, Loader2, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import type { HistoricoPedido } from "@/types/nfe";

interface AlertaProduto {
  produtoId: string;
  codigo: string;
  descricao: string;
  precoAtual: number;
  precoAnterior: number;
  diferenca: number;
  percentual: number;
  dataAtual: Date;
  dataAnterior: Date;
}

interface AlertaFornecedor {
  fornecedorId: string;
  fornecedorNome: string;
  produtos: AlertaProduto[];
  maiorDiferenca: number;
}

const UMA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

const Alertas = () => {
  const navigate = useNavigate();
  const { produtos, fornecedores, loading } = useSupabaseData();

  const alertasPorFornecedor = useMemo<AlertaFornecedor[]>(() => {
    const mapaFornecedor = new Map<string, AlertaProduto[]>();

    for (const produto of produtos) {
      const historico = [...(produto.historicoPedidos || [])].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      if (historico.length < 2) continue;

      // Agrupa por fornecedor para comparar preços do mesmo fornecedor
      const porFornecedor = new Map<string, HistoricoPedido[]>();
      for (const h of historico) {
        if (!porFornecedor.has(h.fornecedorId)) porFornecedor.set(h.fornecedorId, []);
        porFornecedor.get(h.fornecedorId)!.push(h);
      }

      for (const [fornecedorId, itens] of porFornecedor) {
        if (itens.length < 2) continue;
        const atual = itens[0];
        const anterior = itens[1];
        const diffDias =
          (new Date(atual.data).getTime() - new Date(anterior.data).getTime()) / (24 * 60 * 60 * 1000);
        // considera aumento "de uma semana para outra": entradas com pelo menos 1 dia e até ~30 dias
        if (diffDias < 1 || diffDias > 30) continue;

        const precoAtual = atual.valorUnitarioReal || atual.valorUnitario;
        const precoAnterior = anterior.valorUnitarioReal || anterior.valorUnitario;
        if (precoAtual <= precoAnterior) continue;

        const diferenca = precoAtual - precoAnterior;
        const percentual = precoAnterior > 0 ? (diferenca / precoAnterior) * 100 : 0;

        if (!mapaFornecedor.has(fornecedorId)) mapaFornecedor.set(fornecedorId, []);
        mapaFornecedor.get(fornecedorId)!.push({
          produtoId: produto.id,
          codigo: produto.codigo,
          descricao: produto.descricao,
          precoAtual,
          precoAnterior,
          diferenca,
          percentual,
          dataAtual: new Date(atual.data),
          dataAnterior: new Date(anterior.data),
        });
      }
    }

    const resultado: AlertaFornecedor[] = [];
    for (const [fornecedorId, produtosAlerta] of mapaFornecedor) {
      const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
      const nome = fornecedor?.nomeFantasia || fornecedor?.razaoSocial || produtosAlerta[0]
        ? (fornecedor?.nomeFantasia || fornecedor?.razaoSocial || "Fornecedor")
        : "Fornecedor";
      produtosAlerta.sort((a, b) => b.diferenca - a.diferenca);
      resultado.push({
        fornecedorId,
        fornecedorNome: nome,
        produtos: produtosAlerta,
        maiorDiferenca: produtosAlerta[0]?.diferenca || 0,
      });
    }

    resultado.sort((a, b) => b.maiorDiferenca - a.maiorDiferenca);
    return resultado;
  }, [produtos, fornecedores]);

  const totalAlertas = alertasPorFornecedor.reduce((s, f) => s + f.produtos.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-card border-b border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Alertas de Aumento</h1>
                <p className="text-sm text-muted-foreground">
                  {totalAlertas} produto(s) com aumento em {alertasPorFornecedor.length} fornecedor(es)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4">
        {alertasPorFornecedor.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum aumento de preço identificado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Compare compras recentes para detectar variações
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertasPorFornecedor.map((f, idx) => (
              <div
                key={f.fornecedorId}
                className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <button
                  onClick={() => navigate(`/fornecedor/${f.fornecedorId}`)}
                  className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-success-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-foreground truncate">{f.fornecedorNome}</h2>
                    <p className="text-xs text-muted-foreground">
                      {f.produtos.length} produto(s) com aumento
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>

                <ul className="divide-y divide-border">
                  {f.produtos.map((p) => (
                    <li key={p.produtoId}>
                      <button
                        onClick={() => navigate(`/produto/${p.produtoId}`)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{p.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            Cód. {p.codigo} • {formatDate(p.dataAnterior)} → {formatDate(p.dataAtual)}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                            <span className="text-muted-foreground line-through">
                              {formatCurrency(p.precoAnterior)}
                            </span>
                            <span className="text-foreground font-semibold">
                              {formatCurrency(p.precoAtual)}
                            </span>
                            <span className="text-destructive font-bold">
                              +{formatCurrency(p.diferenca)} ({p.percentual.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
