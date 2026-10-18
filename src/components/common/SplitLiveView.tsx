import React, { useState } from 'react';
import { DriverView } from '../driver/DriverView';
import { ManagerDashboard } from '../manager/ManagerDashboard';
import { Smartphone, Monitor, Zap, Wifi, Sliders } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PageSetupModal } from './PageSetupModal';

export const SplitLiveView: React.FC = () => {
  const { pageSetup } = useInventory();
  const phoneSettings = pageSetup.phoneDevice;
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="w-full max-w-[1560px] mx-auto px-2 sm:px-4 py-4">
      {/* Top Info Banner */}
      <div className="mb-4 bg-indigo-50 border border-indigo-200/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-indigo-900 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Real-time Dual View:</strong> Scan or test items on the Driver's phone (left) and watch the inventory and prices update on the Manager console (right) in real-time!
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
          >
            <Sliders className="w-3 h-3 text-indigo-600" />
            <span>Phone Settings</span>
          </button>
          <span className="font-mono text-[11px] text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
            Cross-Tab & Cross-Device Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Driver Mobile Phone Frame (5 cols on lg, 4 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-md bg-neutral-950 rounded-[2.8rem] p-3 shadow-2xl border-[6px] border-slate-800">
            {/* Phone Status Bar with Dynamic Island */}
            <div className="px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] text-white select-none">
              <span className="font-mono text-[11px] text-slate-300">{currentTime || '10:45 AM'}</span>
              <div className="h-4 px-2.5 bg-neutral-900 rounded-full flex items-center justify-center gap-1.5 border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-black border border-neutral-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-[9px] font-bold text-emerald-400">5G</span>
                <Wifi className="w-3 h-3" />
                <div className="w-3.5 h-2 border border-slate-400 rounded-2xs p-0.2">
                  <div className="w-full h-full bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Mobile Viewport Screen */}
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden min-h-[720px] max-h-[820px] overflow-y-auto">
              <DriverView />
            </div>

            {/* Phone Home Bar */}
            <div className="flex justify-center mt-2.5">
              <div className="w-28 h-1 bg-slate-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Col: Manager Dashboard (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-slate-100/60 rounded-2xl p-1 border border-slate-200">
            <ManagerDashboard />
          </div>
        </div>
      </div>

      {showSettingsModal && (
        <PageSetupModal
          initialTab="phone"
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
