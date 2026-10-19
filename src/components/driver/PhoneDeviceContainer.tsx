import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCw,
  Sun,
  Volume2,
  VolumeX,
  Sliders,
  Check,
  Zap,
  Radio,
  BatteryCharging,
  Wifi,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PhoneModel, PhoneOrientation } from '../../types';
import { PageSetupModal } from '../common/PageSetupModal';

interface PhoneDeviceContainerProps {
  children: React.ReactNode;
}

export const PhoneDeviceContainer: React.FC<PhoneDeviceContainerProps> = ({ children }) => {
  const { pageSetup, updatePageSetup } = useInventory();
  const phoneSettings = pageSetup.phoneDevice;
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [hideSimToolbar, setHideSimToolbar] = useState(false);

  // Keep local Qatar time updated for status bar
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  // Screen Wake Lock API implementation
  useEffect(() => {
    let wakeLockSentinel: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && phoneSettings.keepScreenAwake) {
        try {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
          wakeLockSentinel.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        } catch {
          setWakeLockActive(false);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [phoneSettings.keepScreenAwake]);

  const toggleOrientation = () => {
    const next: PhoneOrientation =
      phoneSettings.orientation === 'portrait' ? 'landscape' : 'portrait';
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        orientation: next,
      },
    });
  };

  const setModel = (model: PhoneModel) => {
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        phoneModel: model,
      },
    });
  };

  const toggleFrameMode = () => {
    const next =
      phoneSettings.deviceFrame === 'phone_frame' ? 'responsive_fluid' : 'phone_frame';
    updatePageSetup({
      phoneDevice: {
        ...phoneSettings,
        deviceFrame: next,
      },
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Dimensions based on selected phone model & orientation
  const isLandscape = phoneSettings.orientation === 'landscape';

  const getPhoneDimensions = () => {
    switch (phoneSettings.phoneModel) {
      case 'iphone15':
        return isLandscape ? { width: '840px', height: '420px' } : { width: '400px', height: '840px' };
      case 'galaxy_s24':
        return isLandscape ? { width: '880px', height: '430px' } : { width: '414px', height: '860px' };
      case 'rugged_terminal':
        return isLandscape ? { width: '800px', height: '460px' } : { width: '390px', height: '800px' };
      default:
        return isLandscape ? { width: '840px', height: '420px' } : { width: '400px', height: '840px' };
    }
  };

  const dimensions = getPhoneDimensions();

  // If set to responsive fluid or screen is naturally narrow mobile screen, render full screen directly
  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;

  if (phoneSettings.deviceFrame === 'responsive_fluid' || isMobileScreen) {
    return (
      <div className={`w-full min-h-screen ${phoneSettings.touchTargetSize === 'large_glove_mode' ? 'touch-gloves-mode' : ''}`}>
        {/* Floating Quick Phone Controls pill for real mobile users */}
        <div className="bg-slate-900 text-white text-[11px] px-3 py-1 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Phone View Active</span>
            {wakeLockActive && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                Screen Awake
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>Settings</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-medium ml-2"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            {!isMobileScreen && (
              <button
                onClick={toggleFrameMode}
                className="text-indigo-400 hover:text-indigo-300 ml-1 font-semibold"
              >
                Show Phone Bezel
              </button>
            )}
          </div>
        </div>

        <div className="p-0 sm:p-2">
          {children}
        </div>

        {showSettingsModal && (
          <PageSetupModal
            initialTab="phone"
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] bg-slate-900/95 py-6 px-4 flex flex-col items-center justify-start ${phoneSettings.touchTargetSize === 'large_glove_mode' ? 'touch-gloves-mode' : ''}`}>
      {/* Device Toolbar Controls (Top) - Can be collapsed for 100% clean screen */}
      {hideSimToolbar ? (
        <button
          type="button"
          onClick={() => setHideSimToolbar(false)}
          className="mb-3 px-3 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full border border-slate-700 shadow-md flex items-center gap-1.5 transition-all"
          title="Show Device Simulator Controls"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Show Device Bar</span>
        </button>
      ) : (
        <div className="w-full max-w-2xl mb-4 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-white shadow-xl animate-in fade-in duration-150">
          {/* Left: Device Model Selector */}
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300 hidden sm:inline">Device:</span>
            <div className="inline-flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                type="button"
                onClick={() => setModel('iphone15')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  phoneSettings.phoneModel === 'iphone15'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                iPhone 15 Pro
              </button>
              <button
                type="button"
                onClick={() => setModel('galaxy_s24')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  phoneSettings.phoneModel === 'galaxy_s24'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Galaxy S24
              </button>
              <button
                type="button"
                onClick={() => setModel('rugged_terminal')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  phoneSettings.phoneModel === 'rugged_terminal'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rugged Van Scanner
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Rotate Orientation */}
            <button
              type="button"
              onClick={toggleOrientation}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-medium ${
                isLandscape
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:text-white'
              }`}
              title="Rotate to Landscape / Portrait"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLandscape ? 'Landscape' : 'Portrait'}</span>
            </button>

            {/* Toggle Full Width Mode */}
            <button
              type="button"
              onClick={toggleFrameMode}
              className="p-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
              title="Switch to Full Width Mode"
            >
              Full Width
            </button>

            {/* Device Settings Modal */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
              title="Configure Phone Device Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phone Settings</span>
            </button>

            {/* Hide Simulator Toolbar Button */}
            <button
              type="button"
              onClick={() => setHideSimToolbar(true)}
              className="p-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-400 hover:text-white text-[11px] font-medium transition-colors"
              title="Hide device bar"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hardware Phone Bezel Frame */}
      <div
        className={`relative transition-all duration-300 ${
          phoneSettings.phoneModel === 'rugged_terminal'
            ? 'bg-neutral-900 border-[10px] border-amber-600/80 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-8 ring-neutral-800'
            : phoneSettings.phoneModel === 'galaxy_s24'
            ? 'bg-neutral-950 border-[8px] border-slate-700 rounded-[2.5rem] shadow-2xl ring-4 ring-slate-800'
            : 'bg-neutral-950 border-[10px] border-slate-800 rounded-[3rem] shadow-2xl ring-4 ring-slate-700/50'
        }`}
        style={{
          width: dimensions.width,
          maxWidth: '96vw',
        }}
      >
        {/* Rugged Scanner Top Laser Window Header */}
        {phoneSettings.phoneModel === 'rugged_terminal' && !isLandscape && (
          <div className="bg-neutral-950 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-amber-400 border-b border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
              <span>LASER READY</span>
            </div>
            <span className="text-slate-400">ZEBRA / HONEYWELL VAN POS</span>
          </div>
        )}

        {/* Dynamic Island / Notch / Camera for iPhone & Galaxy */}
        {phoneSettings.showStatusBar && (
          <div className="bg-black text-white px-6 pt-3 pb-1 select-none flex items-center justify-between text-[11px] font-semibold tracking-tight border-b border-black">
            {/* Clock (Local Doha Time) */}
            <span className="font-mono text-[11px] tracking-normal text-slate-200">
              {currentTime || '10:45 AM'}
            </span>

            {/* Center: Dynamic Island or Camera Notch */}
            {phoneSettings.phoneModel === 'iphone15' && (
              <div className="h-5 px-3 bg-neutral-900 rounded-full flex items-center justify-center gap-2 border border-neutral-800 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80 animate-pulse" />
              </div>
            )}

            {phoneSettings.phoneModel === 'galaxy_s24' && (
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-black" />
              </div>
            )}

            {/* Right: Phone Status Icons (5G, Wifi, Battery) */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[9px] font-bold tracking-wider text-emerald-400">5G</span>
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono text-slate-300">98%</span>
                <div className="w-4 h-2 rounded-xs border border-slate-300 p-0.5 flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screen Viewport with smooth scroll */}
        <div
          className={`bg-slate-50 overflow-y-auto ${
            phoneSettings.phoneModel === 'rugged_terminal' ? 'rounded-b-[2rem]' : 'rounded-b-[2.2rem]'
          }`}
          style={{
            height: dimensions.height,
            maxHeight: 'calc(88vh - 5rem)',
          }}
        >
          {children}
        </div>

        {/* Bottom Hardware Home Bar (iOS indicator) */}
        {!isLandscape && phoneSettings.phoneModel !== 'rugged_terminal' && (
          <div className="bg-black py-1.5 flex justify-center rounded-b-[2.8rem]">
            <div className="w-32 h-1 bg-slate-600 rounded-full" />
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>
          Real-time driver phone simulation for Qatar logistics. All scans & stock updates sync instantly across devices.
        </span>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <PageSetupModal
          initialTab="phone"
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
