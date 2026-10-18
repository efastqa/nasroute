import React, { useState, useEffect } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { AppMode } from './types';
import { Header } from './components/common/Header';
import { DriverView } from './components/driver/DriverView';
import { PhoneDeviceContainer } from './components/driver/PhoneDeviceContainer';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { SplitLiveView } from './components/common/SplitLiveView';

export default function App() {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode') as AppMode;
        if (urlMode && ['driver', 'manager', 'split'].includes(urlMode)) {
          return urlMode;
        }
      }
    } catch {
      // ignore
    }
    return 'driver';
  });

  // Sync mode changes to URL query param safely
  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    try {
      if (typeof window !== 'undefined' && window.history) {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', newMode);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // iframe sandbox restriction
    }
  };

  return (
    <InventoryProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
        <Header currentMode={mode} setMode={handleSetMode} />

        <main className="flex-1">
          {mode === 'driver' && (
            <PhoneDeviceContainer>
              <DriverView />
            </PhoneDeviceContainer>
          )}
          {mode === 'manager' && <ManagerDashboard />}
          {mode === 'split' && <SplitLiveView />}
        </main>
      </div>
    </InventoryProvider>
  );
}
