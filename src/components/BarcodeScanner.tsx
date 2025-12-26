import { useEffect, useRef, useState } from "react";
import { X, Camera, Flashlight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            // Código encontrado
            onScan(decodedText);
            scanner.stop();
          },
          () => {
            // Erro de escaneamento (ignorado pois é chamado constantemente)
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-foreground z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/90 backdrop-blur-sm">
        <h2 className="font-semibold text-foreground">Escanear Código de Barras</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative">
        <div
          id="barcode-reader"
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Overlay with scanning frame */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-32">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary animate-pulse top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4">
            <div className="text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-destructive font-medium mb-2">Erro</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-background/90 backdrop-blur-sm text-center">
        <p className="text-sm text-muted-foreground">
          Posicione o código de barras dentro da área de escaneamento
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
