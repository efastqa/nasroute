import React, { useState } from 'react';
import { Smartphone, Monitor, Columns, QrCode, RefreshCw, X, ExternalLink, Sliders, Printer } from 'lucide-react';
import { AppMode } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { PageSetupModal } from './PageSetupModal';

interface HeaderProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, setMode }) => {
  const { resetAllData, pageSetup } = useInventory();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPageSetupModal, setShowPageSetupModal] = useState(false);
  const [pageSetupTab, setPageSetupTab] = useState<'phone' | 'paper' | 'company' | 'content' | 'labels'>('phone');

  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              NR
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950 whitespace-nowrap leading-none">
                Nasroute
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono tracking-tight">
                Van #1 · Qatar
              </span>
            </div>
          </div>

          {/* Zone 2: View Switchers (Single line) */}
          <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMode('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'driver'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Driver Scanner</span>
            </button>

            <button
              onClick={() => setMode('manager')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'manager'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Manager Console</span>
            </button>

            <button
              onClick={() => setMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                currentMode === 'split'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Live View</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {currentMode === 'driver' && (
              <button
                onClick={() => {
                  setPageSetupTab('phone');
                  setShowPageSetupModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
                title="Configure Phone Device Settings, Screen Orientation & Ergonomics"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phone Settings</span>
              </button>
            )}

            <button
              onClick={() => {
                setPageSetupTab(currentMode === 'driver' ? 'phone' : 'paper');
                setShowPageSetupModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              title="Configure Delivery Order Page Setup, Paper Size & Thermal Van Printer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Page Setup</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-indigo-200/80 text-[10px] uppercase font-mono font-bold text-indigo-900">
                {pageSetup.paperSize === 'thermal_80mm'
                  ? '80mm'
                  : pageSetup.paperSize === 'thermal_58mm'
                  ? '58mm'
                  : pageSetup.paperSize.toUpperCase()}
              </span>
            </button>

            <button
              onClick={() => {
                if (confirm('Clear all products, outlets, and logs to start completely fresh?')) {
                  resetAllData();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Clear all data to empty"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Reset Empty</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Open Driver Scanner on Real Phone"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Phone QR Link</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page Setup Configuration Modal */}
      {showPageSetupModal && (
        <PageSetupModal
          initialTab={pageSetupTab}
          onClose={() => setShowPageSetupModal(false)}
        />
      )}

      {/* QR Code Phone Link Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-900">Open on Driver's Smartphone</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Scan this QR code with the driver's phone camera to open the barcode scanner directly on mobile:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mb-3">
              {/* Dynamic QR image via public qr API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  currentUrl
                )}`}
                alt="Driver App QR Code"
                className="w-44 h-44 mx-auto rounded"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-mono break-all mb-4">
              {currentUrl}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex-1 py-2 text-white rounded-lg text-xs font-semibold transition-colors ${
                  copied ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {copied ? 'Link Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
