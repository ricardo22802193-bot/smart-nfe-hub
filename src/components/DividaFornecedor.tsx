import { useState, useEffect } from "react";
import { DollarSign, Plus, Minus, History, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/nfe-parser";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Pagamento {
  id: string;
  valor: number;
  data_pagamento: Date;
  observacao?: string;
}

interface DividaFornecedorProps {
  fornecedorId: string;
}

const DividaFornecedor = ({ fornecedorId }: DividaFornecedorProps) => {
  const [loading, setLoading] = useState(true);
  const [dividaId, setDividaId] = useState<string | null>(null);
  const [valorTotal, setValorTotal] = useState(0);
  const [valorPago, setValorPago] = useState(0);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showAddDivida, setShowAddDivida] = useState(false);
  const [showAddPagamento, setShowAddPagamento] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [novoValor, setNovoValor] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");
  const [motivoDivida, setMotivoDivida] = useState("");

  const saldoDevedor = valorTotal - valorPago;

  useEffect(() => {
    fetchDivida();
  }, [fornecedorId]);

  const fetchDivida = async () => {
    try {
      setLoading(true);
      
      // Buscar dívida existente usando rpc ou query direta
      const { data: dividaData, error: dividaError } = await supabase
        .from("dividas_fornecedor" as any)
        .select("*")
        .eq("fornecedor_id", fornecedorId)
        .maybeSingle();

      if (dividaError && dividaError.code !== "PGRST116" && dividaError.code !== "42P01") {
        console.error("Erro ao buscar dívida:", dividaError);
        setLoading(false);
        return;
      }

      if (dividaData) {
        setDividaId((dividaData as any).id);
        setValorTotal(parseFloat((dividaData as any).valor_total));

        // Buscar pagamentos
        const { data: pagamentosData } = await supabase
          .from("pagamentos_divida" as any)
          .select("*")
          .eq("divida_id", (dividaData as any).id)
          .order("data_pagamento", { ascending: false });

        if (pagamentosData) {
          const pagamentosList = (pagamentosData as any[]).map((p: any) => ({
            id: p.id,
            valor: parseFloat(p.valor),
            data_pagamento: new Date(p.data_pagamento),
            observacao: p.observacao,
          }));
          setPagamentos(pagamentosList);
          setValorPago(pagamentosList.reduce((acc, p) => acc + p.valor, 0));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dívida:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDivida = async () => {
    const valor = parseFloat(novoValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      if (dividaId) {
        // Atualizar dívida existente
        const novoTotal = valorTotal + valor;
        await supabase
          .from("dividas_fornecedor" as any)
          .update({ valor_total: novoTotal, updated_at: new Date().toISOString() } as any)
          .eq("id", dividaId);
        setValorTotal(novoTotal);
      } else {
        // Criar nova dívida
        const novaId = uuidv4();
        await supabase.from("dividas_fornecedor" as any).insert({
          id: novaId,
          fornecedor_id: fornecedorId,
          valor_total: valor,
        } as any);
        setDividaId(novaId);
        setValorTotal(valor);
      }

      toast.success("Dívida adicionada", { duration: 1000 });
      setNovoValor("");
      setMotivoDivida("");
      setShowAddDivida(false);
    } catch (err) {
      console.error("Erro ao adicionar dívida:", err);
      toast.error("Erro ao adicionar dívida");
    }
  };

  const handleAddPagamento = async () => {
    if (!dividaId) return;

    const valor = parseFloat(novoValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    if (valor > saldoDevedor) {
      toast.error("O pagamento não pode ser maior que o saldo devedor");
      return;
    }

    try {
      const novoPagamento = {
        id: uuidv4(),
        divida_id: dividaId,
        valor,
        data_pagamento: new Date().toISOString(),
        observacao: novaObservacao || null,
      };

      await supabase.from("pagamentos_divida" as any).insert(novoPagamento as any);

      setPagamentos((prev) => [
        {
          id: novoPagamento.id,
          valor,
          data_pagamento: new Date(),
          observacao: novaObservacao,
        },
        ...prev,
      ]);
      setValorPago((prev) => prev + valor);

      toast.success("Pagamento registrado", { duration: 1000 });
      setNovoValor("");
      setNovaObservacao("");
      setShowAddPagamento(false);
    } catch (err) {
      console.error("Erro ao registrar pagamento:", err);
      toast.error("Erro ao registrar pagamento", { duration: 1000 });
    }
  };

  const handleRemovePagamento = async (pagamentoId: string, valor: number) => {
    try {
      await supabase.from("pagamentos_divida" as any).delete().eq("id", pagamentoId);
      setPagamentos((prev) => prev.filter((p) => p.id !== pagamentoId));
      setValorPago((prev) => prev - valor);
      toast.success("Pagamento removido", { duration: 1000 });
    } catch (err) {
      console.error("Erro ao remover pagamento:", err);
      toast.error("Erro ao remover pagamento", { duration: 1000 });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Controle de Dívida
        </h3>
        <div className="flex gap-1">
          {dividaId && pagamentos.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistorico(!showHistorico)}
            >
              <History className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-destructive/10 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Dívida Total</p>
          <p className="font-bold text-destructive">{formatCurrency(valorTotal)}</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pago</p>
          <p className="font-bold text-green-600">{formatCurrency(valorPago)}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${saldoDevedor > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
          <p className={`font-bold ${saldoDevedor > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(saldoDevedor)}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            setShowAddDivida(true);
            setShowAddPagamento(false);
            setNovoValor("");
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Dívida
        </Button>
        {saldoDevedor > 0 && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              setShowAddPagamento(true);
              setShowAddDivida(false);
              setNovoValor("");
              setNovaObservacao("");
            }}
          >
            <Minus className="w-4 h-4 mr-1" />
            Registrar Pagamento
          </Button>
        )}
      </div>

      {/* Formulário de adicionar dívida */}
      {showAddDivida && (
        <div className="bg-secondary/50 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-sm font-medium">Adicionar valor à dívida</p>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Valor (R$)"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
          />
          <Textarea
            placeholder="Motivo da dívida (opcional)"
            value={motivoDivida}
            onChange={(e) => setMotivoDivida(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddDivida}>
              Confirmar
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setShowAddDivida(false);
              setNovoValor("");
              setMotivoDivida("");
            }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Formulário de pagamento */}
      {showAddPagamento && (
        <div className="bg-secondary/50 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-sm font-medium">Registrar pagamento</p>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Valor pago (R$)"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
          />
          <Textarea
            placeholder="Observação (opcional)"
            value={novaObservacao}
            onChange={(e) => setNovaObservacao(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddPagamento}>
              Registrar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddPagamento(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Histórico de pagamentos */}
      {showHistorico && pagamentos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Histórico de pagamentos</p>
          {pagamentos.map((pagamento) => (
            <div
              key={pagamento.id}
              className="bg-secondary/30 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-green-600">
                  {formatCurrency(pagamento.valor)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(pagamento.data_pagamento)}
                </p>
                {pagamento.observacao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {pagamento.observacao}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleRemovePagamento(pagamento.id, pagamento.valor)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DividaFornecedor;
