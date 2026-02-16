import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Upload, Trash2, Loader2, AlertTriangle, CheckCircle, Download, FileKey, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseData } from "@/hooks/use-supabase-data";
import { parseNFeXML } from "@/lib/nfe-parser";
import { toast } from "sonner";

interface Certificado {
  id: string;
  cnpj: string;
  razao_social: string | null;
  validade: string | null;
  ultimo_nsu: string;
  created_at: string;
  updated_at: string;
}

const CertificadoManager = () => {
  const { user } = useAuth();
  const { addNFe } = useSupabaseData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [consultando, setConsultando] = useState(false);

  // Form state
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [pfxFile, setPfxFile] = useState<File | null>(null);

  const fetchCertificados = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await supabase.functions.invoke("nuvem-fiscal", {
        body: { action: "get-certificate" },
      });
      if (data?.success) {
        setCertificados(data.certificados);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCertificados();
  }, [fetchCertificados]);

  const handleUpload = async () => {
    if (!pfxFile || !senha || !cnpj) {
      toast.error("Preencha todos os campos: arquivo .pfx, senha e CNPJ");
      return;
    }

    setUploading(true);
    try {
      const arrayBuffer = await pfxFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pfxBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("nuvem-fiscal", {
        body: {
          action: "upload-certificate",
          pfxBase64,
          senha,
          cnpj: cnpj.replace(/\D/g, ""),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao salvar certificado");

      toast.success("Certificado salvo com sucesso!");
      setPfxFile(null);
      setSenha("");
      setCnpj("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchCertificados();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar certificado");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (certId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("nuvem-fiscal", {
        body: { action: "delete-certificate", certificadoId: certId },
      });
      if (error) throw error;
      toast.success("Certificado removido");
      await fetchCertificados();
    } catch (err: any) {
      toast.error("Erro ao remover certificado");
    }
  };

  const handleConsultar = async (cert: Certificado) => {
    setConsultando(true);
    try {
      const { data, error } = await supabase.functions.invoke("nuvem-fiscal", {
        body: { action: "consultar-nfes", cnpj: cert.cnpj },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na consulta");

      const docs = data.documentos || [];
      if (docs.length === 0) {
        toast.info("Nenhuma NFe nova encontrada no SEFAZ");
        await fetchCertificados();
        return;
      }

      let imported = 0;
      for (const doc of docs) {
        if (doc.xml && doc.tipo !== "resumo") {
          try {
            const nfe = parseNFeXML(doc.xml);
            if (nfe) {
              const result = await addNFe(nfe);
              if (result.success) imported++;
            }
          } catch (parseErr) {
            console.error("Error parsing NFe XML:", parseErr);
          }
        }
      }

      toast.success(`Consulta concluída! ${imported} NFe(s) importada(s) de ${docs.length} documento(s)`);
      await fetchCertificados();
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar SEFAZ");
      console.error(err);
    } finally {
      setConsultando(false);
    }
  };

  const getDaysUntilExpiry = (validade: string | null) => {
    if (!validade) return null;
    const expiryDate = new Date(validade);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  return (
    <div className="space-y-4">
      {/* Upload Certificate */}
      <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Certificado Digital A1</h3>
            <p className="text-xs text-muted-foreground">Upload do certificado .pfx para consulta no SEFAZ</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="cnpj-cert">CNPJ da Empresa</Label>
            <Input
              id="cnpj-cert"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              maxLength={18}
            />
          </div>

          <div>
            <Label htmlFor="pfx-file">Arquivo do Certificado (.pfx)</Label>
            <Input
              id="pfx-file"
              ref={fileInputRef}
              type="file"
              accept=".pfx,.p12"
              onChange={(e) => setPfxFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <Label htmlFor="senha-cert">Senha do Certificado</Label>
            <Input
              id="senha-cert"
              type="password"
              placeholder="Digite a senha do certificado"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !pfxFile || !senha || !cnpj}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Salvando..." : "Salvar Certificado"}
          </Button>
        </div>
      </div>

      {/* Certificates List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : certificados.length > 0 ? (
        <div className="space-y-3">
          {certificados.map((cert) => {
            const daysLeft = getDaysUntilExpiry(cert.validade);
            const isExpired = daysLeft !== null && daysLeft <= 0;
            const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 10;

            return (
              <div key={cert.id} className="bg-card rounded-xl border border-border p-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <FileKey className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {cert.razao_social || `CNPJ: ${cert.cnpj}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CNPJ: {cert.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cert.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Expiry Info */}
                {cert.validade && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${
                    isExpired
                      ? "bg-destructive/10 text-destructive"
                      : isExpiringSoon
                      ? "bg-yellow-500/10 text-yellow-600"
                      : "bg-success/10 text-success"
                  }`}>
                    {isExpired ? (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ) : isExpiringSoon ? (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {isExpired
                          ? "Certificado VENCIDO"
                          : isExpiringSoon
                          ? `⚠️ Vence em ${daysLeft} dia(s)!`
                          : `Válido - ${daysLeft} dia(s) restantes`}
                      </p>
                      <p className="text-xs opacity-75 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vencimento: {new Date(cert.validade).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )}

                {!cert.validade && (
                  <div className="flex items-center gap-2 p-2 rounded-lg mb-3 bg-muted text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <p className="text-xs">Data de validade não disponível</p>
                  </div>
                )}

                {/* NSU Info */}
                <p className="text-xs text-muted-foreground mb-3">
                  Último NSU consultado: <span className="font-mono font-medium">{cert.ultimo_nsu || "0"}</span>
                </p>

                {/* Consultar Button */}
                <Button
                  onClick={() => handleConsultar(cert)}
                  disabled={consultando || isExpired}
                  variant="outline"
                  className="w-full"
                >
                  {consultando ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {consultando ? "Consultando SEFAZ..." : "Consultar NFes no SEFAZ"}
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default CertificadoManager;
