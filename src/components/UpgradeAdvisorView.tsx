import React, { useMemo, useState } from 'react';
import {
  Sliders,
  Cpu,
  HardDrive,
  Wrench,
  MessageCircle,
  Sparkles,
  Check,
  Gauge,
} from 'lucide-react';
import { HubListing } from '../types';
import { UPGRADE_CATALOG, simulateLaptopUpgrade } from '../services/upgradeAdvisor';
import { formatPKR, getSupportWhatsAppLink } from '../utils/helpers';

interface UpgradeAdvisorViewProps {
  hubListings: HubListing[];
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  RAM: Cpu,
  SSD: HardDrive,
  'Thermal & Service': Wrench,
};

export const UpgradeAdvisorView: React.FC<UpgradeAdvisorViewProps> = ({
  hubListings = [],
  navigateTo,
  romanUrduMode,
}) => {
  const [selectedLaptopId, setSelectedLaptopId] = useState<string>(hubListings[0]?.id || '');
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);

  const baseLaptop = hubListings.find((l) => l.id === selectedLaptopId) || hubListings[0];

  const toggleUpgrade = (id: string) => {
    setSelectedUpgrades((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const result = useMemo(() => {
    if (!baseLaptop) return null;
    return simulateLaptopUpgrade(baseLaptop.sale_price, baseLaptop.specs.ram, baseLaptop.specs.storage, selectedUpgrades);
  }, [baseLaptop, selectedUpgrades]);

  const categories = ['RAM', 'SSD', 'Thermal & Service'] as const;

  const whatsappMessage = baseLaptop && result
    ? `Assalam o Alaikum! I used the Upgrade Advisor on *${baseLaptop.title}* and I'm interested in fitting:\n${UPGRADE_CATALOG.filter((u) => selectedUpgrades.includes(u.id)).map((u) => `- ${u.name}`).join('\n') || '(no add-ons selected yet)'}\nEstimated total: ${formatPKR(result.estimatedNewValue)}. Please confirm availability and fitting time.`
    : undefined;

  if (!baseLaptop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
        <Sliders className="w-10 h-10 text-outline mx-auto" />
        <h1 className="text-lg font-bold text-on-surface">No Hub stock to simulate right now</h1>
        <button onClick={() => navigateTo('hub')} className="bg-steel text-white text-xs font-bold px-5 py-2.5 rounded-lg">
          Browse Laptop Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold font-display text-on-surface flex items-center gap-2">
          <Sliders className="w-5 h-5 text-steel-dark" />
          <span>Upgrade & Boost Advisor</span>
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {romanUrduMode
            ? 'Koi bhi Hub laptop chunein, RAM/SSD upgrade simulate karein, aur turant performance boost dekhein.'
            : 'Pick any Hub laptop, simulate a RAM/SSD/thermal upgrade, and see the performance boost before you pay for it.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Configurator (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant shadow-sm space-y-3">
            <label className="font-bold text-on-surface-variant text-xs block">1. Choose a laptop from the Hub</label>
            <select
              value={selectedLaptopId}
              onChange={(e) => setSelectedLaptopId(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface focus:outline-none focus:border-steel"
            >
              {hubListings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <div className="flex items-center gap-4 text-[11px] font-mono-spec text-on-surface-variant pt-1">
              <span>CPU: {baseLaptop.specs.cpu.split('(')[0].trim()}</span>
              <span>RAM: {baseLaptop.specs.ram}</span>
              <span>Storage: {baseLaptop.specs.storage}</span>
              <span className="price ml-auto">{formatPKR(baseLaptop.sale_price)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-bold text-on-surface-variant text-xs block">2. Select upgrades to simulate</label>
            {categories.map((cat) => {
              const Icon = CATEGORY_ICON[cat];
              const options = UPGRADE_CATALOG.filter((u) => u.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wide">
                    <Icon className="w-3.5 h-3.5 text-steel-dark" /> {cat}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {options.map((opt) => {
                      const selected = selectedUpgrades.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleUpgrade(opt.id)}
                          className={`text-left p-3.5 rounded-lg border transition-all ${
                            selected ? 'border-steel bg-steel-tint' : 'border-outline-variant bg-surface-container-lowest hover:border-outline'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-on-surface text-xs">{opt.name}</span>
                            {selected && <Check className="w-4 h-4 text-steel-dark shrink-0" />}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{opt.description}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/60">
                            <span className="price text-xs">{formatPKR(opt.costPkr)}</span>
                            <span className="text-[10px] font-bold text-copper-dark bg-copper-tint px-1.5 py-0.5 rounded">
                              +{opt.perfScoreGain}% perf
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Result Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-graphite text-on-graphite rounded-lg p-6 border border-steel/30 shadow-panel space-y-5">
            <div className="flex items-center gap-2 border-b border-graphite-line pb-3">
              <Sparkles className="w-5 h-5 text-steel" />
              <span className="text-xs font-bold text-steel uppercase tracking-wider">Simulated Result</span>
            </div>

            {/* Performance boost gauge */}
            <div className="text-center py-2">
              <span className="text-xs text-on-graphite-elevated block mb-1">Overall Performance Boost</span>
              <div className="text-display-2 font-extrabold font-display text-steel">
                +{result!.overallPerformanceBoostPercent}%
              </div>
              <div className="h-2 rounded-full bg-graphite-elevated overflow-hidden mt-3">
                <div
                  className="h-full bg-steel transition-all duration-300"
                  style={{ width: `${result!.overallPerformanceBoostPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-graphite-elevated p-3 rounded">
                <span className="text-on-graphite-elevated block text-[10px] uppercase font-mono-spec">New RAM</span>
                <span className="font-bold text-on-graphite">{result!.newRamCapacity}</span>
              </div>
              <div className="bg-graphite-elevated p-3 rounded">
                <span className="text-on-graphite-elevated block text-[10px] uppercase font-mono-spec">New Storage</span>
                <span className="font-bold text-on-graphite">{result!.newStorageCapacity}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-graphite-line pt-3">
              <div>
                <span className="text-[11px] text-on-graphite-elevated block">Upgrade Cost</span>
                <span className="price text-lg">{formatPKR(result!.totalUpgradeCost)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-on-graphite-elevated block">Laptop + Upgrades</span>
                <span className="price text-lg">{formatPKR(result!.estimatedNewValue)}</span>
              </div>
            </div>

            {result!.recommendations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {result!.recommendations.map((r, i) => (
                  <div key={i} className="text-[11px] text-on-graphite-elevated flex items-start gap-1.5">
                    <Gauge className="w-3 h-3 text-steel shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            <a
              href={getSupportWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-3 rounded text-xs flex items-center justify-center gap-2 mt-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{romanUrduMode ? 'Yeh Upgrade Fitting Karwayein' : 'Get This Upgrade Fitted'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
