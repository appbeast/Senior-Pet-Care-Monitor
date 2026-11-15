import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Heart, ExternalLink, Copy, Check, Bitcoin } from 'lucide-react';

export const PATREON_DONATE_URL =
  'https://www.patreon.com/u77495219/posts/senior-pet-care-175385465?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link';

export const BITCOIN_DONATE_ADDRESS = 'bc1q2u4dr3ctru5khz2amug98a9jpxsk4qpytqr6vx';
export const DONATE_AMOUNT_USD = '$3';

interface DonateModalProps {
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
  const [selectedOption, setSelectedOption] = useState<'patreon' | 'bitcoin'>('patreon');
  const [copiedBtc, setCopiedBtc] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(`bitcoin:${BITCOIN_DONATE_ADDRESS}`, {
      width: 176,
      margin: 1,
      color: {
        dark: '#1F2421',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCopyBitcoinAddress = async () => {
    try {
      await navigator.clipboard.writeText(BITCOIN_DONATE_ADDRESS);
      setCopiedBtc(true);
      setTimeout(() => setCopiedBtc(false), 2500);
    } catch {
      // Fallback selection handled cleanly without window.alert
      setCopiedBtc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Support Independent Care Tools
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-bold text-slate-900">{DONATE_AMOUNT_USD}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Donate {DONATE_AMOUNT_USD}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Senior Pet Care Monitor is offline-first with no subscriptions required. Choose how you would like to contribute {DONATE_AMOUNT_USD}:
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close donate dialog"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F2EB] rounded-2xl border border-[#E5E0D4]">
          <button
            type="button"
            onClick={() => setSelectedOption('patreon')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all min-h-[44px] ${
              selectedOption === 'patreon'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Option 1: Patreon ({DONATE_AMOUNT_USD})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedOption('bitcoin')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all min-h-[44px] ${
              selectedOption === 'bitcoin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bitcoin className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Option 2: Bitcoin ({DONATE_AMOUNT_USD})</span>
          </button>
        </div>

        {/* Option 1: Patreon */}
        {selectedOption === 'patreon' && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E0D4] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Option 1 · Become a Patron
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Support on Patreon ({DONATE_AMOUNT_USD})
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Join on Patreon to contribute {DONATE_AMOUNT_USD} and help keep senior pet health logging and vet brief exports free for every caregiver.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-sm font-extrabold text-amber-900 shrink-0">
                {DONATE_AMOUNT_USD}
              </div>
            </div>

            <a
              href={PATREON_DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Continue to Patreon ({DONATE_AMOUNT_USD})</span>
              <ExternalLink className="w-4 h-4 text-slate-300 shrink-0" />
            </a>

            <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E5E0D4] text-[11px] text-slate-500 break-all">
              {PATREON_DONATE_URL}
            </div>
          </div>
        )}

        {/* Option 2: Bitcoin */}
        {selectedOption === 'bitcoin' && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E0D4] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Option 2 · Direct Bitcoin
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Send {DONATE_AMOUNT_USD} in Bitcoin (BTC)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Scan the QR code or copy the Bitcoin address below to send {DONATE_AMOUNT_USD} worth of BTC from your wallet.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-sm font-extrabold text-amber-900 shrink-0">
                {DONATE_AMOUNT_USD}
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="p-3 rounded-2xl bg-white border border-[#E5E0D4] shadow-2xs">
                  <img
                    src={qrDataUrl}
                    alt="Bitcoin donation address QR code"
                    className="w-40 h-40 block"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Bitcoin Address (SegWit)
              </label>
              <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E5E0D4] font-mono text-xs text-slate-900 break-all select-all">
                {BITCOIN_DONATE_ADDRESS}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyBitcoinAddress}
                className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {copiedBtc ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Address Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Copy Bitcoin Address</span>
                  </>
                )}
              </button>

              <a
                href={`bitcoin:${BITCOIN_DONATE_ADDRESS}`}
                className="h-11 px-4 rounded-xl bg-[#F5F2EB] hover:bg-[#EAE5D9] text-slate-900 font-bold text-xs border border-[#D5D0C4] transition-all flex items-center justify-center gap-2"
              >
                <Bitcoin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Open Wallet App</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
