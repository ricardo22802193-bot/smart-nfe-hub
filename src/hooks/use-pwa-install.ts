import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  const isIOS = useMemo(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }, []);

  const isStandalone = useMemo(() => {
    // iOS: navigator.standalone
    const nav = navigator as any;
    if (typeof nav.standalone === "boolean") return nav.standalone;
    // Others
    return window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  }, []);

  useEffect(() => {
    setInstalled(isStandalone);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isStandalone]);

  const canInstall = useMemo(() => {
    if (dismissed) return false;
    if (installed) return false;
    // iOS doesn't fire beforeinstallprompt; we still show instructions.
    if (isIOS) return true;
    return Boolean(deferredPrompt);
  }, [deferredPrompt, dismissed, installed, isIOS]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    isIOS,
    isStandalone,
    installed,
    canInstall,
    dismiss: () => setDismissed(true),
    promptInstall,
  };
}
