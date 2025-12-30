import { Download, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export default function PWAInstallCard() {
  const { canInstall, dismiss, isIOS, installed, promptInstall } = usePwaInstall();

  if (!canInstall || installed) return null;

  return (
    <Card className="shadow-card border-border animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Instalar o app</CardTitle>
            <p className="text-sm text-muted-foreground">
              Instale no celular para abrir mais rápido e usar como aplicativo.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isIOS ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5" />
            <p>
              No iPhone: toque em <span className="font-medium text-foreground">Compartilhar</span> →{" "}
              <span className="font-medium text-foreground">Adicionar à Tela de Início</span>.
            </p>
          </div>
        ) : (
          <Button onClick={promptInstall} className="w-full gap-2" variant="default">
            <Download className="h-4 w-4" />
            Instalar agora
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
