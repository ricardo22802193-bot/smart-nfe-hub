import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ChevronRight,
  Building2,
  Search,
  X,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import type { HistoricoPedido } from "@/types/nfe";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";

interface AlertaProduto {
  id: string;
  produtoId: string;
  codigo: string;
  descricao: string;
  unidade: string;
  nfeAtualId: string;
  nfeAnteriorId: string;
  nfeAtualNumero: string;
  nfeAnteriorNumero: string;
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

const persistedAlertasFilters: {
  fornecedor: string;
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
} = {
  fornecedor: "todos",
  dataInicio: undefined,
  dataFim: undefined,
};

const getPrecoHistorico = (h: HistoricoPedido) => h.valorUnitarioReal || h.valorUnitario || 0;

const getTime = (date: Date) => new Date(date).getTime();

const isInDateRange = (date: Date, inicio: number | null, fim: number | null) => {
  const time = getTime(date);
  if (inicio !== null && time < inicio) return false;
  if (fim !== null && time > fim) return false;
  return true;
};

const Alertas = () => {
  const navigate = useNavigate();
  const { produtos, fornecedores, loading } = useSupabaseData();

  const [filtroFornecedor, setFiltroFornecedorState] = useState<string>(persistedAlertasFilters.fornecedor);
  const [filtroDataInicio, setFiltroDataInicioState] = useState<Date | undefined>(persistedAlertasFilters.dataInicio);
  const [filtroDataFim, setFiltroDataFimState] = useState<Date | undefined>(persistedAlertasFilters.dataFim);

  const setFiltroFornecedor = (v: string) => {
    persistedAlertasFilters.fornecedor = v;
    setFiltroFornecedorState(v);
  };
  const setFiltroDataInicio = (v: Date | undefined) => {
    persistedAlertasFilters.dataInicio = v;
    setFiltroDataInicioState(v);
  };
  const setFiltroDataFim = (v: Date | undefined) => {
    persistedAlertasFilters.dataFim = v;
    setFiltroDataFimState(v);
  };

  const fornecedoresComAlertas = useMemo(() => {
    const ids = new Set<string>();
    for (const p of produtos) {
      for (const h of p.historicoPedidos || []) {
        ids.add(h.fornecedorId);
      }
    }
    return fornecedores
      .filter((f) => ids.has(f.id))
      .sort((a, b) => (a.nomeFantasia || a.razaoSocial || "").localeCompare(b.nomeFantasia || b.razaoSocial || ""));
  }, [produtos, fornecedores]);

  const alertasPorFornecedor = useMemo<AlertaFornecedor[]>(() => {
    const mapaFornecedor = new Map<string, AlertaProduto[]>();
    const inicio = filtroDataInicio ? new Date(filtroDataInicio).setHours(0, 0, 0, 0) : null;
    const fim = filtroDataFim ? new Date(filtroDataFim).setHours(23, 59, 59, 999) : null;

    for (const produto of produtos) {
      const historico = [...(produto.historicoPedidos || [])]
        .filter((h) => isInDateRange(new Date(h.data), inicio, fim))
        .sort((a, b) => getTime(a.data) - getTime(b.data));
      if (historico.length < 2) continue;

      const porFornecedor = new Map<string, HistoricoPedido[]>();
      for (const h of historico) {
        if (!porFornecedor.has(h.fornecedorId)) porFornecedor.set(h.fornecedorId, []);
        porFornecedor.get(h.fornecedorId)!.push(h);
      }

      for (const [fornecedorId, itens] of porFornecedor) {
        if (itens.length < 2) continue;
        const itensOrdenados = [...itens].sort((a, b) => getTime(a.data) - getTime(b.data));

        for (let i = 1; i < itensOrdenados.length; i++) {
          const anterior = itensOrdenados[i - 1];
          const atual = itensOrdenados[i];
          const precoAtual = getPrecoHistorico(atual);
          const precoAnterior = getPrecoHistorico(anterior);
          if (precoAtual <= precoAnterior) continue;

          const diferenca = precoAtual - precoAnterior;
          const percentual = precoAnterior > 0 ? (diferenca / precoAnterior) * 100 : 0;
          const dataAtual = new Date(atual.data);
          const dataAnterior = new Date(anterior.data);

          if (!mapaFornecedor.has(fornecedorId)) mapaFornecedor.set(fornecedorId, []);
          mapaFornecedor.get(fornecedorId)!.push({
            id: `${produto.id}-${fornecedorId}-${anterior.id}-${atual.id}`,
            produtoId: produto.id,
            codigo: produto.codigo,
            descricao: produto.descricao,
            unidade: produto.unidade,
            nfeAtualId: atual.nfeId,
            nfeAnteriorId: anterior.nfeId,
            nfeAtualNumero: atual.nfeNumero,
            nfeAnteriorNumero: anterior.nfeNumero,
            precoAtual,
            precoAnterior,
            diferenca,
            percentual,
            dataAtual,
            dataAnterior,
          });
        }
      }
    }

    const resultado: AlertaFornecedor[] = [];
    for (const [fornecedorId, produtosAlerta] of mapaFornecedor) {
      const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
      const nome = fornecedor?.nomeFantasia || fornecedor?.razaoSocial || "Fornecedor";
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
  }, [produtos, fornecedores, filtroDataInicio, filtroDataFim]);

  const alertasFiltrados = useMemo(() => {
    let result = [...alertasPorFornecedor];

    if (filtroFornecedor !== "todos") {
      result = result.filter((f) => f.fornecedorId === filtroFornecedor);
    }

    return result;
  }, [alertasPorFornecedor, filtroFornecedor]);

  const totalAlertas = alertasFiltrados.reduce((s, f) => s + f.produtos.length, 0);
  const filtrosAtivos = filtroFornecedor !== "todos" || !!filtroDataInicio || !!filtroDataFim;

  const limparFiltros = () => {
    setFiltroFornecedor("todos");
    setFiltroDataInicio(undefined);
    setFiltroDataFim(undefined);
  };

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
        <div className="container py-4 space-y-4">
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
                  {totalAlertas} produto(s) com aumento em {alertasFiltrados.length} fornecedor(es)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={filtroFornecedor}
                onChange={(e) => setFiltroFornecedor(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-md border border-input bg-background text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="todos">Todos os fornecedores</option>
                {fornecedoresComAlertas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomeFantasia || f.razaoSocial}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rotate-90 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {filtroDataInicio ? (
                      <span className="text-foreground">{formatDate(filtroDataInicio)}</span>
                    ) : (
                      <span className="text-muted-foreground">Data início</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtroDataInicio}
                    onSelect={setFiltroDataInicio}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {filtroDataFim ? (
                      <span className="text-foreground">{formatDate(filtroDataFim)}</span>
                    ) : (
                      <span className="text-muted-foreground">Data fim</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtroDataFim}
                    onSelect={setFiltroDataFim}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {filtrosAtivos && (
                <Button variant="ghost" size="icon" onClick={limparFiltros} className="shrink-0">
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4">
        {alertasFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum aumento de preço identificado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filtrosAtivos
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Compare compras recentes para detectar variações"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertasFiltrados.map((f, idx) => (
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
                    <li key={p.id}>
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
                          <p className="text-xs text-muted-foreground">
                            NF {p.nfeAnteriorNumero} → NF {p.nfeAtualNumero}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
                            <span className="text-destructive font-bold">
                              +{formatCurrency(p.diferenca)} ({p.percentual.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                          <span className="text-[11px] text-muted-foreground">
                            unid. era <span className="line-through">{formatCurrency(p.precoAnterior)}</span>
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            agora {formatCurrency(p.precoAtual)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">/{p.unidade}</span>
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
