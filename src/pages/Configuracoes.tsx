import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Trash2, Loader2, Smartphone, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { parseNFeXML, formatCurrency, formatDate } from "@/lib/nfe-parser";
import { toast } from "sonner";

const Configuracoes = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ file: string; success: boolean; message: string }[]>([]);
  const { addNFe, nfes, removeNFe, loading } = useSupabaseData();
  const { isIOS, isStandalone, promptInstall, canInstall } = usePwaInstall();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setImporting(true);
    setResults([]);
    const newResults: { file: string; success: boolean; message: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.name.toLowerCase().endsWith(".xml")) {
        newResults.push({ file: file.name, success: false, message: "Arquivo não é XML" });
        continue;
      }

      try {
        const text = await file.text();
        const nfe = parseNFeXML(text);

        if (!nfe) {
          newResults.push({ file: file.name, success: false, message: "Erro ao processar XML" });
          continue;
        }

        const result = await addNFe(nfe);
        newResults.push({ file: file.name, success: result.success, message: result.message });
      } catch (error) {
        newResults.push({ file: file.name, success: false, message: "Erro ao ler arquivo" });
      }
    }

    setResults(newResults);
    setImporting(false);

    const successCount = newResults.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} NFe(s) importada(s) com sucesso!`);
    }
  }, [addNFe]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Importe suas notas fiscais</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* PWA Install Card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Instalar Aplicativo</h3>
              {isStandalone ? (
                <p className="text-sm text-success">✓ App já instalado no dispositivo</p>
              ) : isIOS ? (
                <p className="text-sm text-muted-foreground">
                  Toque em <Share className="w-4 h-4 inline mx-1" /> e depois "Adicionar à Tela de Início"
                </p>
              ) : canInstall ? (
                <p className="text-sm text-muted-foreground">
                  Instale o app para acesso rápido offline
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No menu do navegador <MoreVertical className="w-4 h-4 inline mx-1" /> toque em "Instalar app"
                </p>
              )}
            </div>
            {!isStandalone && !isIOS && canInstall && (
              <Button onClick={promptInstall} size="sm">
                Instalar
              </Button>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors animate-fade-in"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
            {importing ? (
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {importing ? "Importando..." : "Importar NFe XML"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste arquivos XML ou clique para selecionar
          </p>
          <Button variant="outline" disabled={importing}>
            <FileText className="w-4 h-4 mr-2" />
            Selecionar Arquivos
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
            <h3 className="font-semibold text-foreground mb-3">Resultado da Importação</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.success ? "bg-success/10" : "bg-destructive/10"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.file}
                    </p>
                    <p className={`text-xs ${result.success ? "text-success" : "text-destructive"}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent NFes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : nfes.length > 0 ? (
          <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
            <h3 className="font-semibold text-foreground mb-3">
              NFes Importadas ({nfes.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {nfes.slice().reverse().map((nfe) => (
                <div
                  key={nfe.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      NFe {nfe.numero} - {nfe.fornecedor.razaoSocial}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(nfe.dataEmissao))} • {formatCurrency(nfe.valorTotal)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removeNFe(nfe.id);
                      toast.success("NFe removida");
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Configuracoes;
