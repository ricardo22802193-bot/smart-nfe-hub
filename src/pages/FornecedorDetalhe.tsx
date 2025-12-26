import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Phone, Mail, MessageSquare, Plus, Edit2, Trash2, Save, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNFeStore } from "@/store/nfe-store";
import { formatCurrency } from "@/lib/nfe-parser";
import { Contato } from "@/types/nfe";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const FornecedorDetalhe = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fornecedores, nfes, updateFornecedorObservacoes, addContatoFornecedor, updateContatoFornecedor, removeContatoFornecedor } = useNFeStore();

  const fornecedor = fornecedores.find((f) => f.id === id);
  const nfesFornecedor = nfes.filter((n) => n.fornecedor.id === id);

  const [editingObs, setEditingObs] = useState(false);
  const [observacoes, setObservacoes] = useState(fornecedor?.observacoes || "");
  const [showAddContato, setShowAddContato] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [novoContato, setNovoContato] = useState<Partial<Contato>>({});

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Fornecedor não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/fornecedores")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveObs = () => {
    updateFornecedorObservacoes(fornecedor.id, observacoes);
    setEditingObs(false);
    toast.success("Observações salvas");
  };

  const handleSaveContato = () => {
    if (!novoContato.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    const contato: Contato = {
      id: editingContato?.id || uuidv4(),
      nome: novoContato.nome || "",
      cargo: novoContato.cargo,
      telefone: novoContato.telefone,
      email: novoContato.email,
      observacoes: novoContato.observacoes,
    };

    if (editingContato) {
      updateContatoFornecedor(fornecedor.id, contato);
      toast.success("Contato atualizado");
    } else {
      addContatoFornecedor(fornecedor.id, contato);
      toast.success("Contato adicionado");
    }

    setNovoContato({});
    setShowAddContato(false);
    setEditingContato(null);
  };

  const handleEditContato = (contato: Contato) => {
    setNovoContato(contato);
    setEditingContato(contato);
    setShowAddContato(true);
  };

  const handleDeleteContato = (contatoId: string) => {
    removeContatoFornecedor(fornecedor.id, contatoId);
    toast.success("Contato removido");
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
              onClick={() => navigate("/fornecedores")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                {fornecedor.nomeFantasia || fornecedor.razaoSocial}
              </h1>
              <p className="text-sm text-muted-foreground">
                CNPJ: {fornecedor.cnpj}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Stats */}
        <div className="gradient-success rounded-xl p-6 animate-fade-in">
          <p className="text-sm text-success-foreground/80 mb-1">Total em Compras</p>
          <p className="text-3xl font-bold text-success-foreground">
            {formatCurrency(fornecedor.totalCompras)}
          </p>
          <p className="text-sm text-success-foreground/70 mt-2">
            {nfesFornecedor.length} NFe(s) importada(s)
          </p>
        </div>

        {/* Info */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Informações
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Razão Social:</span> {fornecedor.razaoSocial}
            </p>
            {fornecedor.endereco && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Endereço:</span> {fornecedor.endereco}
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Observações
            </h3>
            {!editingObs && (
              <Button variant="ghost" size="sm" onClick={() => setEditingObs(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {editingObs ? (
            <div className="space-y-3">
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre este fornecedor..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveObs}>
                  <Save className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingObs(false)}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {fornecedor.observacoes || "Nenhuma observação adicionada"}
            </p>
          )}
        </div>

        {/* Contatos */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Contatos ({fornecedor.contatos.length})
            </h3>
            <Button variant="outline" size="sm" onClick={() => {
              setNovoContato({});
              setEditingContato(null);
              setShowAddContato(true);
            }}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>

          {showAddContato && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-4 space-y-3">
              <Input
                placeholder="Nome *"
                value={novoContato.nome || ""}
                onChange={(e) => setNovoContato((prev) => ({ ...prev, nome: e.target.value }))}
              />
              <Input
                placeholder="Cargo"
                value={novoContato.cargo || ""}
                onChange={(e) => setNovoContato((prev) => ({ ...prev, cargo: e.target.value }))}
              />
              <Input
                placeholder="Telefone"
                value={novoContato.telefone || ""}
                onChange={(e) => setNovoContato((prev) => ({ ...prev, telefone: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={novoContato.email || ""}
                onChange={(e) => setNovoContato((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Textarea
                placeholder="Observações"
                value={novoContato.observacoes || ""}
                onChange={(e) => setNovoContato((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveContato}>
                  <Save className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddContato(false);
                  setEditingContato(null);
                  setNovoContato({});
                }}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          )}

          {fornecedor.contatos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
          ) : (
            <div className="space-y-3">
              {fornecedor.contatos.map((contato) => (
                <div key={contato.id} className="bg-secondary/30 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{contato.nome}</p>
                      {contato.cargo && (
                        <p className="text-xs text-muted-foreground">{contato.cargo}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditContato(contato)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteContato(contato.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {contato.telefone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> {contato.telefone}
                      </p>
                    )}
                    {contato.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" /> {contato.email}
                      </p>
                    )}
                    {contato.observacoes && (
                      <p className="text-xs text-muted-foreground mt-2">{contato.observacoes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FornecedorDetalhe;
