import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, TrendingUp, TrendingDown, Calculator, Edit2, Save, X, History, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency, formatDate } from "@/lib/nfe-parser";
import CalculatorModal from "@/components/CalculatorModal";
import { toast } from "sonner";

const ProdutoDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { produtos, updateQuantidadeEmbalagem } = useNFeStore();

  const produto = produtos.find((p) => p.id === id);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingEmbalagem, setEditingEmbalagem] = useState(false);
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState(
    produto?.quantidadeEmbalagem?.toString() || ""
  );

  if (!produto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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

  const calcularValorUnitario = (valor: number) => {
    if (produto.quantidadeEmbalagem && produto.quantidadeEmbalagem > 1) {
      return valor / produto.quantidadeEmbalagem;
    }
    return valor;
  };

  const valorUnitarioAtual = ultimoPedido
    ? calcularValorUnitario(ultimoPedido.valorUnitario)
    : 0;

  const variacao = penultimoPedido && ultimoPedido
    ? ((ultimoPedido.valorUnitario - penultimoPedido.valorUnitario) / penultimoPedido.valorUnitario) * 100
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground line-clamp-2">
                {produto.descricao}
              </h1>
              <p className="text-sm text-muted-foreground">
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

      <div className="container py-4 space-y-4">
        {/* Preço Atual */}
        <div className="gradient-primary rounded-xl p-6 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-primary-foreground/80 mb-1">Último Preço</p>
              <p className="text-3xl font-bold text-primary-foreground">
                {formatCurrency(valorUnitarioAtual)}
              </p>
              {produto.quantidadeEmbalagem && produto.quantidadeEmbalagem > 1 && (
                <p className="text-sm text-primary-foreground/70 mt-1">
                  por unidade ({produto.quantidadeEmbalagem} un/embalagem)
                </p>
              )}
            </div>
            {variacao !== null && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                variacao > 0 ? 'bg-destructive/20' : variacao < 0 ? 'bg-success/20' : 'bg-muted/20'
              }`}>
                {variacao > 0 ? (
                  <TrendingUp className="w-4 h-4 text-destructive" />
                ) : variacao < 0 ? (
                  <TrendingDown className="w-4 h-4 text-success" />
                ) : null}
                <span className={`text-sm font-medium ${
                  variacao > 0 ? 'text-destructive' : variacao < 0 ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {ultimoPedido && (
            <div className="mt-4 pt-4 border-t border-primary-foreground/20">
              <p className="text-sm text-primary-foreground/80">
                Comprado em {formatDate(new Date(ultimoPedido.data))} de {ultimoPedido.fornecedorNome}
              </p>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Informações do Produto
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {produto.codigoBarras && (
              <div>
                <p className="text-muted-foreground">Código de Barras</p>
                <p className="font-medium text-foreground">{produto.codigoBarras}</p>
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
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Quantidade por Embalagem</h3>
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
                className="flex-1"
              />
              <Button size="icon" onClick={handleSaveEmbalagem}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setEditingEmbalagem(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {produto.quantidadeEmbalagem
                ? `${produto.quantidadeEmbalagem} unidades por embalagem`
                : "Não definido - clique para configurar"}
            </p>
          )}
        </div>

        {/* Histórico de Pedidos */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de Compras ({historicoOrdenado.length})
          </h3>
          <div className="space-y-3">
            {historicoOrdenado.map((pedido, index) => (
              <div
                key={pedido.id}
                className={`p-3 rounded-lg ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">NFe {pedido.nfeNumero}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                        Última
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(new Date(pedido.data))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{pedido.fornecedorNome}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-medium text-foreground">{pedido.quantidade}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Unit.</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(calcularValorUnitario(pedido.valorUnitario))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Impostos</p>
                    <p className="font-medium text-foreground">{formatCurrency(pedido.valorImposto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">{formatCurrency(pedido.valorTotal)}</p>
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
    </div>
  );
};

export default ProdutoDetalhe;
