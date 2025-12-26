import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Camera, X, Filter, Calculator, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import { Produto, FiltrosProduto } from "@/types/nfe";
import CalculatorModal from "@/components/CalculatorModal";
import BarcodeScanner from "@/components/BarcodeScanner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ConsultaPreco = () => {
  const navigate = useNavigate();
  const { produtos, fornecedores, nfes, getProdutoByCodigoBarras } = useNFeStore();
  const [showScanner, setShowScanner] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosProduto>({
    busca: "",
    fornecedorId: undefined,
    nfeId: undefined,
    dataInicio: undefined,
    dataFim: undefined,
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos];

    // Filtro por busca
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.descricao.toLowerCase().includes(termo) ||
          p.codigo.toLowerCase().includes(termo) ||
          (p.codigoBarras && p.codigoBarras.includes(termo))
      );
    }

    // Filtro por fornecedor
    if (filtros.fornecedorId) {
      resultado = resultado.filter((p) =>
        p.historicoPedidos.some((h) => h.fornecedorId === filtros.fornecedorId)
      );
    }

    // Filtro por NFe
    if (filtros.nfeId) {
      resultado = resultado.filter((p) =>
        p.historicoPedidos.some((h) => h.nfeId === filtros.nfeId)
      );
    }

    // Filtro por data
    if (filtros.dataInicio || filtros.dataFim) {
      resultado = resultado.filter((p) =>
        p.historicoPedidos.some((h) => {
          const dataCompra = new Date(h.data);
          if (filtros.dataInicio && dataCompra < filtros.dataInicio) return false;
          if (filtros.dataFim && dataCompra > filtros.dataFim) return false;
          return true;
        })
      );
    }

    // Ordenar por último pedido
    resultado.sort((a, b) => {
      const lastA = a.historicoPedidos[a.historicoPedidos.length - 1];
      const lastB = b.historicoPedidos[b.historicoPedidos.length - 1];
      if (!lastA) return 1;
      if (!lastB) return -1;
      return new Date(lastB.data).getTime() - new Date(lastA.data).getTime();
    });

    return resultado;
  }, [produtos, filtros]);

  const handleBarcodeScan = (code: string) => {
    setShowScanner(false);
    const produto = getProdutoByCodigoBarras(code);
    if (produto) {
      navigate(`/produto/${produto.id}`);
    } else {
      setFiltros((prev) => ({ ...prev, busca: code }));
    }
  };

  const clearFilters = () => {
    setFiltros({ busca: "", fornecedorId: undefined, nfeId: undefined, dataInicio: undefined, dataFim: undefined });
  };

  const hasFilters = filtros.fornecedorId || filtros.nfeId || filtros.dataInicio || filtros.dataFim;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Consulta Preço</h1>
              <p className="text-sm text-muted-foreground">
                {produtosFiltrados.length} produto(s) encontrado(s)
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowCalculator(true)}
            >
              <Calculator className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar produto, código ou código de barras..."
                value={filtros.busca}
                onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
                className="pl-10 pr-10"
              />
              {filtros.busca && (
                <button
                  onClick={() => setFiltros((prev) => ({ ...prev, busca: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(true)}
              className="shrink-0"
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filtros.fornecedorId || "all"}
            onValueChange={(value) =>
              setFiltros((prev) => ({ ...prev, fornecedorId: value === "all" ? undefined : value }))
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Fornecedores</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nomeFantasia || f.razaoSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.nfeId || "all"}
            onValueChange={(value) =>
              setFiltros((prev) => ({ ...prev, nfeId: value === "all" ? undefined : value }))
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Nota Fiscal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas NFes</SelectItem>
              {nfes.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  NFe {n.numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product List */}
      <div className="container py-4">
        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Importe NFes para começar a consultar preços
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtosFiltrados.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}
    </div>
  );
};

function ProdutoCard({ produto }: { produto: Produto }) {
  const navigate = useNavigate();
  const [showCalculator, setShowCalculator] = useState(false);

  const ultimoPedido = produto.historicoPedidos[produto.historicoPedidos.length - 1];
  const valorUnitario = ultimoPedido
    ? produto.quantidadeEmbalagem
      ? ultimoPedido.valorUnitario / produto.quantidadeEmbalagem
      : ultimoPedido.valorUnitario
    : 0;

  return (
    <>
      <div
        onClick={() => navigate(`/produto/${produto.id}`)}
        className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer animate-fade-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground line-clamp-2 mb-1">
              {produto.descricao}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Cód: {produto.codigo}
              {produto.codigoBarras && ` • EAN: ${produto.codigoBarras}`}
            </p>
            {ultimoPedido && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Última compra: {formatDate(new Date(ultimoPedido.data))}</span>
                <span>•</span>
                <span>{ultimoPedido.fornecedorNome}</span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(valorUnitario)}
            </p>
            {produto.quantidadeEmbalagem && (
              <p className="text-xs text-muted-foreground">
                por unidade ({produto.quantidadeEmbalagem} un/cx)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {produto.historicoPedidos.length} compra(s)
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowCalculator(true);
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <Calculator className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}
    </>
  );
}

export default ConsultaPreco;
