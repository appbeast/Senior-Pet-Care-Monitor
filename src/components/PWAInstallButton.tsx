import React, { useState, useEffect } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  X,
  Monitor,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect environment
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const desktop = !ios && !android;

    setIsIOS(ios);
    setIsAndroid(android);
    setIsDesktop(desktop);

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInIframe,
    install,
  };
}

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pc' | 'phone'>(() => {
    const userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase();
    return /iphone|ipad|ipod|android/.test(userAgent) ? 'phone' : 'pc';
  });

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleOpenDirect = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div
        className="inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:px-3 sm:py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl whitespace-nowrap shrink-0"
        title="Installed as App"
        aria-label="Installed as App"
      >
        <CheckCircle2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
        <span className="hidden sm:inline">Installed as App</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. Header / Nav Button Variant */}
      {variant === 'nav' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:px-3.5 sm:py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 min-h-[40px] ${className}`}
          title="Install app to Phone or PC"
          aria-label="Install App"
        >
          <Download className="w-4 h-4 text-slate-900 shrink-0" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {/* 2. Banner Variant (e.g. for Home Dashboard) */}
      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Offline-Ready PWA
                </span>
                <span className="text-xs text-amber-700">·</span>
                <span className="text-xs text-amber-800 font-medium">Phone & PC</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Install Senior Pet Care Monitor to Your Device
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Launches instantly with full offline access in vet waiting rooms, with zero browser address bars.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all min-h-[48px] sm:min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Install to Phone or PC</span>
            </button>
          </div>
        </div>
      )}

      {/* Guided Install Modal for Phone & PC */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Progressive Web App
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-medium">Standalone App</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Install on Your Phone or PC
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 1-Click Install Button if Native Prompt Is Ready */}
            {isInstallable && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-800">
                  <span className="font-bold text-slate-900 block text-sm">Browser Ready to Install</span>
                  Tap to add the icon directly to your home screen or desktop.
                </div>
                <button
                  onClick={async () => {
                    const res = await install();
                    if (res) setShowModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all shrink-0 min-h-[44px]"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* If inside an iframe preview (AI Studio iframe security restriction) */}
            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <ExternalLink className="w-4 h-4 text-blue-700" />
                  <span>Preview Environment Note</span>
                </div>
                <p className="leading-relaxed">
                  Web browsers restrict PWAs from installing directly inside embedded preview frames. Open the app in its own browser tab to trigger 1-tap installation:
                </p>
                <button
                  onClick={handleOpenDirect}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors min-h-[38px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Full Browser Tab to Install</span>
                </button>
              </div>
            )}

            {/* Platform Selection Tabs (PC vs Phone) */}
            <div className="flex items-center gap-2 p-1.5 bg-[#F5F2EB] rounded-2xl border border-[#E5E0D4]">
              <button
                type="button"
                onClick={() => setActiveTab('pc')}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all min-h-[42px] ${
                  activeTab === 'pc'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>PC / Mac / Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phone')}
                className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all min-h-[42px] ${
                  activeTab === 'phone'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>iPhone & Android</span>
              </button>
            </div>

            {/* TAB CONTENT: PC / MAC / LAPTOP */}
            {activeTab === 'pc' && (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-amber-700" />
                    <span>How to Install on Chrome, Edge & Brave (PC / Mac)</span>
                  </h4>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Look at the right side of your <strong>URL address bar</strong> at the top of your browser.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p>
                        Click the <strong className="font-bold text-slate-900">Install icon</strong> (computer monitor with a down arrow, or <Download className="w-3.5 h-3.5 inline text-amber-700" />) in the address bar.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p>
                        Or click the browser menu <strong className="font-bold text-slate-900">(⋮)</strong> → select <strong className="font-bold text-slate-900">"Install Senior Pet Care Monitor"</strong> or <strong>"Save and Share" → "Install app"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F2EB] text-[11px] text-slate-600">
                  ✓ Creates a dedicated desktop icon that opens in its own distraction-free window without browser tabs.
                </div>
              </div>
            )}

            {/* TAB CONTENT: PHONE (iOS & ANDROID) */}
            {activeTab === 'phone' && (
              <div className="space-y-3 text-xs text-slate-700">
                {/* iPhone / iPad */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>iPhone & iPad (Safari)</span>
                  </h4>
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Tap the <strong className="font-semibold text-slate-900">Share</strong> button <Share className="w-3.5 h-3.5 inline text-blue-600" /> in Safari's bottom toolbar.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p>
                        Scroll down and tap <strong className="font-semibold text-slate-900">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-900" />.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <p>Tap <strong className="font-semibold text-slate-900">Add</strong> in top right. Launches full-screen like a native iOS app!</p>
                    </div>
                  </div>
                </div>

                {/* Android Phone */}
                <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>Android (Chrome & Samsung Internet)</span>
                  </h4>
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <p>
                        Tap the three dots menu <strong className="font-semibold text-slate-900">(⋮)</strong> in Chrome’s top right corner.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <p>
                        Tap <strong className="font-semibold text-slate-900">"Install app"</strong> or <strong className="font-semibold text-slate-900">"Add to Home screen"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Close Action */}
            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
