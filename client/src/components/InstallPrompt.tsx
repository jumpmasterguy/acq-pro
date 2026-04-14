import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // All window/navigator access inside useEffect — safe in all environments
    try {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) { setIsInstalled(true); return; }
      if (sessionStorage.getItem("pwa-prompt-dismissed")) { setDismissed(true); return; }

      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", handler);

      let iosTimer: ReturnType<typeof setTimeout> | undefined;
      if (isIOS) {
        iosTimer = setTimeout(() => setShowIOSGuide(true), 45000);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        if (iosTimer) clearTimeout(iosTimer);
      };
    } catch {
      // Silently fail — PWA features are non-critical
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowIOSGuide(false);
    try { sessionStorage.setItem("pwa-prompt-dismissed", "1"); } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    dismiss();
  };

  if (isInstalled || dismissed || (!deferredPrompt && !showIOSGuide)) return null;

  // ── Android / Chrome native prompt ──────────────────────────────────────
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50
                      bg-[#0C2340] border border-[#01696F]/40 rounded-2xl shadow-2xl p-4
                      flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-10 h-10 rounded-xl bg-[#01696F]/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-[#4FC3CB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug">Add Acqlerate to your home screen</p>
          <p className="text-white/60 text-xs mt-0.5 leading-snug">Faster access, works offline, no App Store needed.</p>
          <button
            onClick={handleInstall}
            className="mt-2.5 inline-flex items-center gap-1.5 bg-[#01696F] hover:bg-[#0C4E54]
                       text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
        </div>
        <button onClick={dismiss} className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── iOS manual guide ─────────────────────────────────────────────────────
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50
                      bg-[#0C2340] border border-[#01696F]/40 rounded-2xl shadow-2xl p-4
                      animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#4FC3CB]" />
            <span className="text-white text-sm font-semibold">Add to Home Screen</span>
          </div>
          <button onClick={dismiss} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ol className="space-y-2">
          {[
            <>Tap the <span className="text-[#4FC3CB] font-semibold">Share</span> button at the bottom of Safari</>,
            <>Tap <span className="text-[#4FC3CB] font-semibold">"Add to Home Screen"</span></>,
            <>Tap <span className="text-[#4FC3CB] font-semibold">Add</span> in the top right</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[#01696F]/30 text-[#4FC3CB] text-[10px]
                               font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return null;
}
