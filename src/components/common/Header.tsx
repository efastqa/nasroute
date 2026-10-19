import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Columns,
  QrCode,
  RefreshCw,
  X,
  ExternalLink,
  Sliders,
  Printer,
  ChevronDown,
  Settings,
  Shield,
  Menu,
} from 'lucide-react';
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
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              NR
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-950 whitespace-nowrap leading-none">
                Nasroute
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono tracking-tight flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Van #1 · Qatar
              </span>
            </div>
          </div>

          {/* DRIVER MAIN SCREEN: CLEAN, DISTRACTION-FREE HEADER */}
          {currentMode === 'driver' ? (
            <div className="flex items-center gap-3">
              {/* Route status indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Driver Delivery Route Active</span>
              </div>

              {/* Single discreet Admin / Menu button (hides all clutter from driver main screen) */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs"
                  title="Switch to Manager Console or Open Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manager Menu</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu for Manager / Admin Access */}
                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Mode / View
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('manager');
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-medium transition-colors"
                    >
                      <Monitor className="w-4 h-4 text-indigo-600" />
                      <span>Switch to Manager Console</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('split');
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 font-medium transition-colors"
                    >
                      <Columns className="w-4 h-4 text-indigo-600" />
                      <span>Split Live View</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Configuration
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPageSetupTab('phone');
                        setShowPageSetupModal(true);
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Phone Device Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPageSetupTab('paper');
                        setShowPageSetupModal(true);
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>Print Page Setup</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowQrModal(true);
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-slate-600" />
                      <span>Phone QR Link</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all products, outlets, and logs to start completely fresh?')) {
                          resetAllData();
                        }
                        setShowAdminMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-rose-500" />
                      <span>Reset Empty Data</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* MANAGER & SPLIT VIEW: FULL NAVIGATION & SETUP CONTROLS */
            <>
              {/* Zone 2: View Switchers */}
              <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setMode('driver')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900"
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
                <button
                  onClick={() => {
                    setPageSetupTab('paper');
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
            </>
          )}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-slate-900">Open on Driver Phone</span>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  currentUrl
                )}`}
                alt="Scan to open on driver phone"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Point your physical phone camera at this QR code to open the driver scanner directly on your mobile device!
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 truncate font-mono"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
