import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, TrendingUp, TrendingDown, Calculator, Edit2, Save, X, History, FileText, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import { HistoricoPedido } from "@/types/nfe";
import CalculatorModal from "@/components/CalculatorModal";
import PriceBreakdown from "@/components/PriceBreakdown";
import { toast } from "sonner";

const ProdutoDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { produtos, updateQuantidadeEmbalagem } = useNFeStore();

  const produto = produtos.find((p) => p.id === id);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState<HistoricoPedido | null>(null);
  const [editingEmbalagem, setEditingEmbalagem] = useState(false);
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState(
    produto?.quantidadeEmbalagem?.toString() || ""
  );

  if (!produto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Produto não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/consulta-preco")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const historicoOrdenado = [...produto.historicoPedidos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const ultimoPedido = historicoOrdenado[0];
  const penultimoPedido = historicoOrdenado[1];

  const calcularValorUnitarioReal = (pedido: HistoricoPedido) => {
    const valorBase = pedido.valorUnitarioReal || pedido.valorUnitario;
    if (produto.quantidadeEmbalagem && produto.quantidadeEmbalagem > 1) {
      return valorBase / produto.quantidadeEmbalagem;
    }
    return valorBase;
  };

  const valorUnitarioAtual = ultimoPedido
    ? calcularValorUnitarioReal(ultimoPedido)
    : 0;

  const valorUnitarioAnterior = penultimoPedido
    ? calcularValorUnitarioReal(penultimoPedido)
    : null;

  const variacao = valorUnitarioAnterior && valorUnitarioAtual
    ? ((valorUnitarioAtual - valorUnitarioAnterior) / valorUnitarioAnterior) * 100
    : null;

  const handleSaveEmbalagem = () => {
    const quantidade = parseInt(quantidadeEmbalagem);
    if (isNaN(quantidade) || quantidade < 1) {
      toast.error("Quantidade inválida");
      return;
    }
    updateQuantidadeEmbalagem(produto.id, quantidade);
    setEditingEmbalagem(false);
    toast.success("Quantidade por embalagem atualizada");
  };

  const handlePriceClick = (pedido: HistoricoPedido) => {
    if (pedido.despesas) {
      setShowPriceBreakdown(pedido);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border sticky top-0 z-10">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground line-clamp-2">
                {produto.descricao}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Cód: {produto.codigo}
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
        </div>
      </header>

      <div className="container py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Preço Atual */}
        <div 
          className="gradient-primary rounded-xl p-4 sm:p-6 animate-fade-in cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => ultimoPedido && handlePriceClick(ultimoPedido)}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-primary-foreground/80 mb-1">Último Preço (com despesas)</p>
                <Info className="w-4 h-4 text-primary-foreground/60" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary-foreground">
                {formatCurrency(valorUnitarioAtual)}
              </p>
              {produto.quantidadeEmbalagem && produto.quantidadeEmbalagem > 1 && (
                <p className="text-xs sm:text-sm text-primary-foreground/70 mt-1">
                  por unidade ({produto.quantidadeEmbalagem} un/embalagem)
                </p>
              )}
              <p className="text-xs text-primary-foreground/60 mt-1">
                Toque para ver o detalhamento
              </p>
            </div>
            {variacao !== null && (
              <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full ${
                variacao > 0 ? 'bg-destructive/20' : variacao < 0 ? 'bg-success/20' : 'bg-muted/20'
              }`}>
                {variacao > 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                ) : variacao < 0 ? (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                ) : null}
                <span className={`text-xs sm:text-sm font-medium ${
                  variacao > 0 ? 'text-destructive' : variacao < 0 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {ultimoPedido && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary-foreground/20">
              <p className="text-xs sm:text-sm text-primary-foreground/80">
                Comprado em {formatDate(new Date(ultimoPedido.data))} de {ultimoPedido.fornecedorNome}
              </p>
            </div>
          )}
        </div>

        {/* Grid responsivo para informações e embalagem */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Informações */}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-slide-up">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Package className="w-4 h-4" />
              Informações do Produto
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              {produto.codigoBarras && (
                <div>
                  <p className="text-muted-foreground">Código de Barras</p>
                  <p className="font-medium text-foreground break-all">{produto.codigoBarras}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Unidade</p>
                <p className="font-medium text-foreground">{produto.unidade}</p>
              </div>
              {produto.ncm && (
                <div>
                  <p className="text-muted-foreground">NCM</p>
                  <p className="font-medium text-foreground">{produto.ncm}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Total de Compras</p>
                <p className="font-medium text-foreground">{produto.historicoPedidos.length}</p>
              </div>
            </div>
          </div>

          {/* Quantidade por Embalagem */}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Quantidade por Embalagem</h3>
              {!editingEmbalagem && (
                <Button variant="ghost" size="sm" onClick={() => setEditingEmbalagem(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {editingEmbalagem ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantidadeEmbalagem}
                  onChange={(e) => setQuantidadeEmbalagem(e.target.value)}
                  placeholder="Ex: 12 unidades por caixa"
                  className="flex-1 text-sm"
                />
                <Button size="icon" onClick={handleSaveEmbalagem}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setEditingEmbalagem(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {produto.quantidadeEmbalagem
                  ? `${produto.quantidadeEmbalagem} unidades por embalagem`
                  : "Não definido - clique para configurar"}
              </p>
            )}
          </div>
        </div>

        {/* Histórico de Pedidos */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
            <History className="w-4 h-4" />
            Histórico de Compras ({historicoOrdenado.length})
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {historicoOrdenado.map((pedido, index) => (
              <div
                key={pedido.id}
                className={`p-3 rounded-lg ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}
              >
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">NFe {pedido.nfeNumero}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                        Última
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {formatDate(new Date(pedido.data))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{pedido.fornecedorNome}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-medium text-foreground">{pedido.quantidade}</p>
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-primary/10 rounded p-1 -m-1 transition-colors"
                    onClick={() => handlePriceClick(pedido)}
                  >
                    <p className="text-muted-foreground flex items-center gap-1">
                      Valor Unit. <Info className="w-3 h-3" />
                    </p>
                    <p className="font-medium text-primary">
                      {formatCurrency(calcularValorUnitarioReal(pedido))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impostos</p>
                    <p className="font-medium text-foreground">{formatCurrency(pedido.valorImposto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(pedido.valorTotalComDespesas || pedido.valorTotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}

      {showPriceBreakdown && showPriceBreakdown.despesas && (
        <PriceBreakdown
          valorUnitarioReal={showPriceBreakdown.valorUnitarioReal || showPriceBreakdown.valorUnitario}
          quantidade={showPriceBreakdown.quantidade}
          despesas={showPriceBreakdown.despesas}
          quantidadeEmbalagem={produto.quantidadeEmbalagem}
          onClose={() => setShowPriceBreakdown(null)}
        />
      )}
    </div>
  );
};

export default ProdutoDetalhe;
