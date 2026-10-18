import React, { useState } from 'react';
import {
  X,
  Printer,
  Sliders,
  FileText,
  Truck,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  QrCode,
  Layers,
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  FileCheck,
  Smartphone,
  RotateCw,
  Sun,
  Volume2,
  Radio,
  Maximize2,
  Zap,
  CheckCircle2,
  Shield,
  Wifi,
} from 'lucide-react';
import {
  PageSetupConfig,
  PaperSize,
  DEFAULT_PAGE_SETUP,
  PhoneModel,
  PhoneOrientation,
  TouchErgonomics,
} from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { formatQAR } from '../../utils/format';

interface PageSetupModalProps {
  onClose: () => void;
  onPreviewSampleReceipt?: () => void;
  initialTab?: 'phone' | 'paper' | 'company' | 'content' | 'labels';
}

export const PageSetupModal: React.FC<PageSetupModalProps> = ({
  onClose,
  onPreviewSampleReceipt,
  initialTab = 'phone',
}) => {
  const { pageSetup, updatePageSetup, resetPageSetup } = useInventory();
  const [formData, setFormData] = useState<PageSetupConfig>({ ...pageSetup });
  const [activeTab, setActiveTab] = useState<'phone' | 'paper' | 'company' | 'content' | 'labels'>(
    initialTab
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updatePageSetup(formData);
    // Set html body attribute for paper size printing
    document.body.setAttribute('data-paper-size', formData.paperSize);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (confirm('Reset page setup to default Qatar logistics settings?')) {
      resetPageSetup();
      setFormData(DEFAULT_PAGE_SETUP);
      document.body.setAttribute('data-paper-size', DEFAULT_PAGE_SETUP.paperSize);
    }
  };

  const handleTestPrint = () => {
    updatePageSetup(formData);
    document.body.setAttribute('data-paper-size', formData.paperSize);
    window.print();
  };

  const updatePhoneDevice = (patch: Partial<typeof formData.phoneDevice>) => {
    setFormData((prev) => ({
      ...prev,
      phoneDevice: {
        ...prev.phoneDevice,
        ...patch,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/90 flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Page & Device Setup
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Qatar Logistics (QAR)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure mobile phone device display, in-van ergonomics, receipt layouts, and thermal printers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-100/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {/* TAB: Phone Device Settings */}
          <button
            onClick={() => setActiveTab('phone')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'phone'
                ? 'border-indigo-600 text-indigo-700 bg-white/60'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Phone Device Settings</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              Driver View
            </span>
          </button>

          {/* TAB: Paper Format & Size */}
          <button
            onClick={() => setActiveTab('paper')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'paper'
                ? 'border-indigo-600 text-indigo-700 bg-white/60'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paper Format & Size</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-slate-200 text-slate-700 uppercase font-mono">
              {formData.paperSize === 'thermal_80mm'
                ? '80mm POS'
                : formData.paperSize === 'thermal_58mm'
                ? '58mm Mini'
                : formData.paperSize.toUpperCase()}
            </span>
          </button>

          {/* TAB: Company Header */}
          <button
            onClick={() => setActiveTab('company')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'company'
                ? 'border-indigo-600 text-indigo-700 bg-white/60'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company & Van Header</span>
          </button>

          {/* TAB: Receipt Options */}
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-indigo-600 text-indigo-700 bg-white/60'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Receipt Options</span>
          </button>

          {/* TAB: Labels */}
          <button
            onClick={() => setActiveTab('labels')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'labels'
                ? 'border-indigo-600 text-indigo-700 bg-white/60'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Barcode Sheet Setup</span>
          </button>
        </div>

        {/* Content Body with 2-Column Split: Controls + Live Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* ================= TAB: PHONE DEVICE SETTINGS ================= */}
            {activeTab === 'phone' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* 1. Device Container Mode */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Desktop Screen Display Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => updatePhoneDevice({ deviceFrame: 'phone_frame' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.phoneDevice.deviceFrame === 'phone_frame'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                          Phone Device Frame
                        </span>
                        {formData.phoneDevice.deviceFrame === 'phone_frame' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Renders authentic phone chassis with Dynamic Island, status bar, and realistic driver proportions.
                      </p>
                    </div>

                    <div
                      onClick={() => updatePhoneDevice({ deviceFrame: 'responsive_fluid' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.phoneDevice.deviceFrame === 'responsive_fluid'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                          Full-Width Responsive
                        </span>
                        {formData.phoneDevice.deviceFrame === 'responsive_fluid' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Fills standard browser viewport without phone bezels. (Automatically used on mobile devices).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Phone Device Hardware Model */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Phone Hardware Model Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'iphone15' as PhoneModel, title: 'iPhone 15 Pro', desc: 'Dynamic Island · 393px' },
                      { id: 'galaxy_s24' as PhoneModel, title: 'Samsung Galaxy', desc: 'Punch-hole · 412px' },
                      { id: 'rugged_terminal' as PhoneModel, title: 'Rugged Van Scanner', desc: 'Laser bumper · Zebra style' },
                    ].map((model) => (
                      <div
                        key={model.id}
                        onClick={() => updatePhoneDevice({ phoneModel: model.id })}
                        className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all text-left ${
                          formData.phoneDevice.phoneModel === model.id
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{model.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{model.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Orientation & Touch Targets */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Orientation */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                        Screen Orientation
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updatePhoneDevice({ orientation: 'portrait' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                            formData.phoneDevice.orientation === 'portrait'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePhoneDevice({ orientation: 'landscape' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                            formData.phoneDevice.orientation === 'landscape'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Van Mount
                        </button>
                      </div>
                    </div>

                    {/* Touch Ergonomics */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Driver Touch Ergonomics
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updatePhoneDevice({ touchTargetSize: 'standard' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                            formData.phoneDevice.touchTargetSize === 'standard'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Standard 44px
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePhoneDevice({ touchTargetSize: 'large_glove_mode' })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                            formData.phoneDevice.touchTargetSize === 'large_glove_mode'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Glove Mode 56px
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Hardware Feedback & In-Van Behavior Toggles */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    In-Van Driver Features & Hardware
                  </label>
                  <div className="divide-y divide-slate-100">
                    {/* Screen Wake Lock */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Keep Screen Awake (Wake Lock API)</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prevents phone screen from dimming or locking while driver is navigating delivery route
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.phoneDevice.keepScreenAwake}
                        onChange={(e) => updatePhoneDevice({ keepScreenAwake: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>

                    {/* Haptic Vibration */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Physical Haptic Vibration on Barcode Scan</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Vibrates the mobile phone device when a product is successfully scanned
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.phoneDevice.hapticVibration}
                        onChange={(e) => updatePhoneDevice({ hapticVibration: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>

                    {/* Audio Sound */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>High-Pitch Laser Beep Sound</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Plays acoustic scanner sound confirmation via Web Audio API
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.phoneDevice.soundFeedback}
                        onChange={(e) => updatePhoneDevice({ soundFeedback: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>

                    {/* Simulated Status Bar */}
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          Show Phone Status Bar (Doha Time, 5G, Battery)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Displays simulated device bar at the top of the phone frame
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.phoneDevice.showStatusBar}
                        onChange={(e) => updatePhoneDevice({ showStatusBar: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 1: Paper Format & Size ================= */}
            {activeTab === 'paper' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Paper Size Preset
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* A4 */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, paperSize: 'a4' }))}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paperSize === 'a4'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">📄 A4 Standard Sheet</span>
                        {formData.paperSize === 'a4' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        210 × 297 mm. Formal delivery order & tax invoice. Ideal for office printing and file copies.
                      </p>
                    </div>

                    {/* Thermal 80mm */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, paperSize: 'thermal_80mm' }))}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paperSize === 'thermal_80mm'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">🧾 80mm Van Thermal Roll</span>
                        {formData.paperSize === 'thermal_80mm' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Standard van Bluetooth/USB POS receipt printer. Fast drop-off print with tear-off edge.
                      </p>
                    </div>

                    {/* Thermal 58mm */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, paperSize: 'thermal_58mm' }))}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paperSize === 'thermal_58mm'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">🧾 58mm Mini Pocket Roll</span>
                        {formData.paperSize === 'thermal_58mm' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Compact belt-clip mobile printer. Ultra lightweight for driver delivery on foot.
                      </p>
                    </div>

                    {/* Letter */}
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, paperSize: 'letter' }))}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.paperSize === 'letter'
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">📄 US Letter Format</span>
                        {formData.paperSize === 'letter' && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        8.5 × 11 inches. Alternative full-page format for compatible invoice laser printers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copies & Density */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                        Number of Copies
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, printCopies: 1 }))}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                            formData.printCopies === 1
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Single (Customer)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, printCopies: 2 }))}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                            formData.printCopies === 2
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Dual (Customer + Van)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                        Print Density
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['compact', 'normal', 'spacious'] as const).map((density) => (
                          <button
                            key={density}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, printDensity: density }))}
                            className={`py-2 text-[11px] font-medium capitalize rounded-lg border transition-all ${
                              formData.printDensity === density
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {density}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: Company Header ================= */}
            {activeTab === 'company' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Tagline / Subtext
                    </label>
                    <input
                      type="text"
                      value={formData.companySubtext}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companySubtext: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Van Fleet ID
                      </label>
                      <input
                        type="text"
                        value={formData.vanIdentifier}
                        onChange={(e) => setFormData((prev) => ({ ...prev, vanIdentifier: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Qatar CR / Tax Registration
                      </label>
                      <input
                        type="text"
                        value={formData.taxRegistrationNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, taxRegistrationNumber: e.target.value }))
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Phone Contact(s)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Depot / Warehouse Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: Receipt Options ================= */}
            {activeTab === 'content' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-white p-4 rounded-xl border border-slate-200 divide-y divide-slate-100">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Show Item Barcode on Receipt</div>
                      <div className="text-[11px] text-slate-500">Prints the GTIN/EAN number beneath item title</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showBarcodeOnReceipt}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, showBarcodeOnReceipt: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Show Unit Price in QAR per Item</div>
                      <div className="text-[11px] text-slate-500">Display item rate breakdown beside line total</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showPricePerPiece}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, showPricePerPiece: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Show Remaining Stock in Van</div>
                      <div className="text-[11px] text-slate-500">Prints driver's onboard van inventory balance</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showVanStockRemaining}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, showVanStockRemaining: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Customer & Driver Signature Section</div>
                      <div className="text-[11px] text-slate-500">Include signature lines for proof of delivery</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showSignatureOnReceipt}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, showSignatureOnReceipt: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: Barcode Sheet Setup ================= */}
            {activeTab === 'labels' && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      Label Sheet Grid Columns
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([2, 3, 4] as const).map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, labelGridCols: cols }))}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                            formData.labelGridCols === cols
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cols} Columns ({cols === 2 ? 'Large' : cols === 3 ? 'Standard' : 'Compact'})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 pt-2">
                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Print Price in QAR on Labels</div>
                        <div className="text-[11px] text-slate-500">Shows unit price badge on each label barcode</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showPriceOnLabels}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showPriceOnLabels: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Show Product SKU Code</div>
                        <div className="text-[11px] text-slate-500">Prints SKU identifier next to barcode</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showSkuOnLabels}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showSkuOnLabels: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                {activeTab === 'phone' ? 'Live Phone Device Preview' : 'Live Receipt Print Preview'}
              </span>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {activeTab === 'phone'
                  ? `${formData.phoneDevice.phoneModel.toUpperCase()} · ${formData.phoneDevice.orientation.toUpperCase()}`
                  : formData.paperSize === 'thermal_80mm'
                  ? '80mm Roll'
                  : formData.paperSize === 'thermal_58mm'
                  ? '58mm Roll'
                  : 'A4 Sheet'}
              </span>
            </div>

            {/* Dynamic Preview Area */}
            {activeTab === 'phone' ? (
              /* Phone Device Mockup Preview */
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[380px] shadow-inner">
                <div
                  className={`bg-neutral-950 border-4 border-slate-700 rounded-[2rem] p-2 shadow-2xl transition-all duration-300 ${
                    formData.phoneDevice.orientation === 'landscape'
                      ? 'w-[320px] h-[190px]'
                      : 'w-[210px] h-[340px]'
                  }`}
                >
                  {/* Status Bar */}
                  {formData.phoneDevice.showStatusBar && (
                    <div className="px-3 py-1 flex items-center justify-between text-[9px] text-slate-300 border-b border-neutral-800">
                      <span className="font-mono">10:45 AM</span>
                      <div className="w-10 h-3 bg-neutral-900 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-emerald-400">5G</span>
                        <div className="w-3 h-1.5 border border-slate-400 rounded-2xs p-0.2">
                          <div className="w-full h-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inside Screen Content Mockup */}
                  <div className="p-2 space-y-1.5 text-left text-slate-800 overflow-hidden">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg text-[10px]">
                      <div className="font-bold flex items-center justify-between">
                        <span>Nasroute Van #1</span>
                        <span className="text-[8px] bg-emerald-500/30 px-1 rounded">Qatar</span>
                      </div>
                      <div className="text-[8px] opacity-80 mt-0.5">Doha Central Delivery Route</div>
                    </div>

                    <div className="bg-slate-100 p-1.5 rounded-md border border-slate-200 text-[9px]">
                      <div className="text-slate-500 text-[8px]">Current Drop-off:</div>
                      <div className="font-bold text-slate-900">Al Meera Supermarket</div>
                    </div>

                    <div className="bg-slate-800 text-white p-1.5 rounded-md text-[9px] flex items-center justify-between">
                      <span className="text-[8px] font-mono text-emerald-400">CAMERA SCANNER</span>
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">
                        {formData.phoneDevice.touchTargetSize === 'large_glove_mode' ? 'GLOVE 56PX' : 'STD 44PX'}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-800">
                      <span>WakeLock: {formData.phoneDevice.keepScreenAwake ? 'ON' : 'OFF'}</span>
                      <span>Haptic: {formData.phoneDevice.hapticVibration ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Receipt Print Preview */
              <div className="bg-slate-200/80 p-3 sm:p-4 rounded-xl border border-slate-300 flex items-center justify-center min-h-[360px] overflow-hidden flex-1 shadow-inner">
                {formData.paperSize.startsWith('thermal') ? (
                  /* Thermal Roll Style Preview */
                  <div
                    className={`bg-white shadow-md border-x border-slate-200 p-4 transition-all duration-200 font-mono text-[11px] text-slate-800 ${
                      formData.paperSize === 'thermal_80mm' ? 'w-[280px]' : 'w-[230px]'
                    }`}
                  >
                    <div className="text-center pb-2 border-b border-dashed border-slate-300 mb-2">
                      <div className="font-bold text-xs uppercase tracking-wider text-slate-950">
                        {formData.companyName || 'Nasroute Logistics Qatar'}
                      </div>
                      <div className="text-[10px] text-slate-500">{formData.vanIdentifier}</div>
                      <div className="text-[9px] text-slate-400">{formData.taxRegistrationNumber}</div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-600 mb-2 pb-1 border-b border-slate-200">
                      <span>ORD #NR-8042</span>
                      <span>DOHA · TODAY</span>
                    </div>

                    <div className="space-y-1.5 mb-2 pb-2 border-b border-dashed border-slate-300">
                      <div className="flex justify-between font-bold text-[10px] text-slate-900">
                        <span>12x Baladna Milk 2L</span>
                        <span>{formatQAR(102.0)}</span>
                      </div>
                      {formData.showPricePerPiece && (
                        <div className="text-[9px] text-slate-400">@ {formatQAR(8.5)} / bottle</div>
                      )}
                    </div>

                    <div className="flex justify-between font-bold text-xs text-slate-950 pt-1 border-t border-slate-200">
                      <span>TOTAL DUE:</span>
                      <span className="text-emerald-700">{formatQAR(102.0)}</span>
                    </div>

                    {formData.showSignatureOnReceipt && (
                      <div className="text-center pt-2 pb-1 border-t border-dashed border-slate-300 mt-2">
                        <div className="h-5 border-b border-dotted border-slate-400 mx-6 mb-1"></div>
                        <div className="text-[9px] text-slate-400">Customer Signature</div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* A4 Standard Sheet Preview */
                  <div className="bg-white shadow-md border border-slate-200 p-4 w-[280px] sm:w-[320px] rounded text-[10px] text-slate-800">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2">
                      <div>
                        <div className="font-bold text-xs text-slate-950">{formData.companyName}</div>
                        <div className="text-[9px] text-slate-500">{formData.companySubtext}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                          DELIVERY ORDER
                        </span>
                      </div>
                    </div>

                    <div className="py-2 text-[10px] font-semibold text-slate-800 border-b border-slate-200">
                      Al Meera Supermarket - Mansoura Branch
                    </div>

                    <div className="py-2 text-right font-bold text-xs text-indigo-700">
                      Total: {formatQAR(102.0)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            {activeTab !== 'phone' && (
              <button
                type="button"
                onClick={handleTestPrint}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Test Print</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
