import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  PlusCircle,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ValuationFormInputs, ValuationResult } from '../types';
import {
  calculateLaptopValuation,
  generateWhatsAppValuationLink,
  BRAND_TIERS,
  CPU_BASE_VALUES,
} from '../services/pricingEngine';
import { formatPKR } from '../utils/helpers';

interface PriceCalculatorViewProps {
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

const DEFAULT_INPUTS: ValuationFormInputs = {
  brand: 'Lenovo',
  seriesModel: 'ThinkPad T480',
  cpuBrand: 'Intel',
  cpuGen: 'intel_core_8th',
  ram: '16GB',
  storageType: 'SSD',
  storageSize: '512GB',
  screenSize: '14.0',
  screenCondition: 'flawless',
  batteryCondition: 'good_80_89',
  bodyCondition: 'minor_wear',
  boxAvailable: true,
  chargerOriginal: true,
  repairsDone: 'none',
  purchaseYear: 2020,
};

export const PriceCalculatorView: React.FC<PriceCalculatorViewProps> = ({
  navigateTo,
  romanUrduMode,
}) => {
  const [inputs, setInputs] = useState<ValuationFormInputs>(DEFAULT_INPUTS);
  const [valuationResult, setValuationResult] = useState<ValuationResult>(() =>
    calculateLaptopValuation(DEFAULT_INPUTS)
  );
  const [calculated, setCalculated] = useState<boolean>(true);

  const handleInputChange = (field: keyof ValuationFormInputs, value: any) => {
    const updated = { ...inputs, [field]: value };
    setInputs(updated);
    // Real-time valuation recalculation
    const result = calculateLaptopValuation(updated);
    setValuationResult(result);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setValuationResult(calculateLaptopValuation(DEFAULT_INPUTS));
  };

  const handleListOnMarketplace = () => {
    // Pass prefilled specs to the sell form
    navigateTo('sell', {
      sellSpecs: {
        brand: inputs.brand,
        model: inputs.seriesModel,
        title: `${inputs.brand} ${inputs.seriesModel || ''} - ${inputs.ram} RAM / ${inputs.storageSize} ${inputs.storageType}`,
        asking_price: valuationResult.fairValue,
        specs: {
          cpu: inputs.cpuGen.replace(/_/g, ' ').toUpperCase(),
          cpuGen: inputs.cpuGen,
          ram: inputs.ram,
          storage: `${inputs.storageSize} ${inputs.storageType}`,
          screenSize: inputs.screenSize,
          batteryHealth: inputs.batteryCondition.includes('90')
            ? '90%+ Health'
            : inputs.batteryCondition.includes('80')
            ? '85% Health'
            : 'Moderate Backup',
        },
        box_included: inputs.boxAvailable,
        charger_included: inputs.chargerOriginal,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-primary-container text-on-primary rounded-lg p-6 sm:p-8 border border-outline-variant/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-whatsapp flex items-center justify-center text-white font-bold">
              <Calculator className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              Used Laptop <span className="text-whatsapp">Price Calculator</span>
            </h1>
            <span className="bg-whatsapp/15 text-whatsapp text-xs px-2 py-0.5 rounded-md font-bold border border-whatsapp/30">
              PKR Valuation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-primary-container max-w-xl">
            {romanUrduMode
              ? 'Apne used laptop ke specs select karein aur Pakistani market ki fair resale price range paayein. Rule-based valuation engine.'
              : 'Calculate the accurate fair market resale value of any used laptop in Pakistan based on actual market demand, CPU generation, RAM, and battery health.'}
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start md:self-auto bg-on-primary/10 hover:bg-on-primary/20 text-on-primary-container hover:text-on-primary text-xs font-semibold px-4 py-2.5 rounded-xl border border-on-primary/10 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Form & Result Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
          <div className="border-b border-outline-variant pb-3">
            <h2 className="text-base font-extrabold text-on-surface font-display">
              1. Laptop Specifications & Identity
            </h2>
            <p className="text-xs text-on-surface-variant">Provide the core hardware specs of your device.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Brand */}
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Brand / Manufacturer</label>
              <select
                value={inputs.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface focus:outline-none focus:border-whatsapp"
              >
                <option value="Dell">Dell (Latitude, XPS, Inspiron)</option>
                <option value="HP">HP (EliteBook, ProBook, Omen)</option>
                <option value="Lenovo">Lenovo (ThinkPad, Yoga, Legion)</option>
                <option value="Apple">Apple (MacBook Air / Pro)</option>
                <option value="Asus">Asus (ROG, TUF, ZenBook)</option>
                <option value="Acer">Acer (Nitro, Swift, Aspire)</option>
                <option value="MSI">MSI Gaming</option>
                <option value="Microsoft">Microsoft Surface</option>
              </select>
            </div>

            {/* Series / Model */}
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Model / Series Name</label>
              <input
                type="text"
                value={inputs.seriesModel}
                onChange={(e) => handleInputChange('seriesModel', e.target.value)}
                placeholder="e.g. ThinkPad T480, EliteBook 840 G6"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-on-surface focus:outline-none focus:border-whatsapp"
              />
            </div>

            {/* CPU Generation */}
            <div className="sm:col-span-2">
              <label className="font-bold text-on-surface-variant block mb-1">Processor Tier & Generation</label>
              <select
                value={inputs.cpuGen}
                onChange={(e) => handleInputChange('cpuGen', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface focus:outline-none focus:border-whatsapp"
              >
                <optgroup label="Intel Core Series">
                  <option value="intel_core_4th_5th">Intel Core i3/i5/i7 (4th & 5th Gen - Haswell/Broadwell)</option>
                  <option value="intel_core_6th_7th">Intel Core i3/i5/i7 (6th & 7th Gen - Skylake/Kaby Lake)</option>
                  <option value="intel_core_8th">Intel Core i5/i7 (8th Gen - Quad Core Workhorse)</option>
                  <option value="intel_core_9th_10th">Intel Core i5/i7 (9th & 10th Gen Comet Lake)</option>
                  <option value="intel_core_11th">Intel Core i5/i7 (11th Gen Tiger Lake / Iris Xe)</option>
                  <option value="intel_core_12th">Intel Core i5/i7 (12th Gen Alder Lake Hybrid)</option>
                  <option value="intel_core_13th_14th">Intel Core i5/i7/i9 (13th/14th Gen / Ultra)</option>
                </optgroup>
                <optgroup label="AMD Ryzen Series">
                  <option value="amd_ryzen_2000_3000">AMD Ryzen 3 / 5 / 7 (2000 / 3000 Series)</option>
                  <option value="amd_ryzen_4000_5000">AMD Ryzen 5 / 7 (4000 / 5000 Zen 2/3)</option>
                  <option value="amd_ryzen_6000_7000">AMD Ryzen 5 / 7 (6000 / 7000 Zen 3+/4)</option>
                </optgroup>
                <optgroup label="Apple Silicon / Mac">
                  <option value="apple_m1">Apple M1 Chip (2020)</option>
                  <option value="apple_m1_pro_max">Apple M1 Pro / M1 Max</option>
                  <option value="apple_m2">Apple M2 Chip (2022)</option>
                  <option value="apple_m3">Apple M3 Chip (2023)</option>
                  <option value="apple_intel_legacy">Apple Intel Core i5/i7 (Legacy 2017-2019)</option>
                </optgroup>
              </select>
            </div>

            {/* RAM */}
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Installed RAM</label>
              <select
                value={inputs.ram}
                onChange={(e) => handleInputChange('ram', e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface focus:outline-none focus:border-whatsapp"
              >
                <option value="4GB">4GB RAM</option>
                <option value="8GB">8GB RAM</option>
                <option value="16GB">16GB RAM</option>
                <option value="24GB">24GB RAM</option>
                <option value="32GB">32GB RAM</option>
                <option value="64GB">64GB RAM</option>
              </select>
            </div>

            {/* Storage */}
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Primary Storage Type & Size</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={inputs.storageSize}
                  onChange={(e) => handleInputChange('storageSize', e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-2.5 py-2.5 font-semibold text-on-surface text-xs"
                >
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                  <option value="2TB">2TB</option>
                </select>
                <select
                  value={inputs.storageType}
                  onChange={(e) => handleInputChange('storageType', e.target.value)}
                  className="bg-surface-container-low border border-outline-variant rounded-xl px-2.5 py-2.5 font-semibold text-on-surface text-xs"
                >
                  <option value="SSD">NVMe / SATA SSD</option>
                  <option value="HDD">Mechanical HDD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4 space-y-4">
            <h2 className="text-base font-extrabold text-on-surface font-display">
              2. Condition, Battery & Health Factors
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Screen condition */}
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Screen / Display Health</label>
                <select
                  value={inputs.screenCondition}
                  onChange={(e) => handleInputChange('screenCondition', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                >
                  <option value="flawless">Flawless (Zero scratches, no dead pixels)</option>
                  <option value="minor_scratches">Minor hairline scratches (barely visible)</option>
                  <option value="spots_lines">White spots, pressure marks, or lines</option>
                  <option value="cracked">Cracked glass / broken display</option>
                </select>
              </div>

              {/* Battery condition */}
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Battery Backup</label>
                <select
                  value={inputs.batteryCondition}
                  onChange={(e) => handleInputChange('batteryCondition', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                >
                  <option value="excellent_90_plus">Excellent 90%+ Health (4+ hours backup)</option>
                  <option value="good_80_89">Good 80-89% Health (2.5 to 4 hours backup)</option>
                  <option value="moderate_60_79">Moderate 60-79% Health (1 to 2 hours backup)</option>
                  <option value="dead_plugged_only">Dead / Only works when plugged in</option>
                </select>
              </div>

              {/* Body condition */}
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Body / Cosmetic Condition</label>
                <select
                  value={inputs.bodyCondition}
                  onChange={(e) => handleInputChange('bodyCondition', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                >
                  <option value="mint_like_new">Mint 10/10 (Scratchless, like new)</option>
                  <option value="minor_wear">Grade A (Normal slight palmrest wear)</option>
                  <option value="visible_dents_scratches">Grade B (Visible dents, scuffs, corner chips)</option>
                  <option value="broken_hinges">Loose or broken hinges</option>
                </select>
              </div>

              {/* Repairs done */}
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Repair / Modification History</label>
                <select
                  value={inputs.repairsDone}
                  onChange={(e) => handleInputChange('repairsDone', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 font-semibold text-on-surface"
                >
                  <option value="none">100% Genuine (Never opened/repaired)</option>
                  <option value="battery_replaced">Battery replaced with new pack</option>
                  <option value="screen_replaced">Screen panel replaced</option>
                  <option value="motherboard_repaired">Motherboard IC/Chip repaired</option>
                </select>
              </div>
            </div>

            {/* Accessories Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={inputs.chargerOriginal}
                  onChange={(e) => handleInputChange('chargerOriginal', e.target.checked)}
                  className="w-4 h-4 accent-whatsapp rounded"
                />
                <span className="font-bold text-on-surface">Original OEM Charger Available (+Rs. 3,500 value)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={inputs.boxAvailable}
                  onChange={(e) => handleInputChange('boxAvailable', e.target.checked)}
                  className="w-4 h-4 accent-whatsapp rounded"
                />
                <span className="font-bold text-on-surface">Original Box & Manuals Included (+Rs. 3,000 value)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Output Valuation Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          {/* Main Price Card */}
          <div className="bg-primary text-on-primary rounded-lg p-6 border border-whatsapp/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-on-primary/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-whatsapp" />
                <span className="text-xs font-bold text-whatsapp uppercase tracking-wider">
                  Estimated Resale Value
                </span>
              </div>
              <span className="text-[10px] bg-whatsapp/15 text-whatsapp font-bold px-2 py-0.5 rounded-full border border-whatsapp/40">
                Confidence: {valuationResult.confidence}
              </span>
            </div>

            {/* Price Range Display */}
            <div className="text-center py-2 space-y-1">
              <span className="text-xs text-on-primary-container block">Expected Pakistani Market Range</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-on-primary font-display">
                {formatPKR(valuationResult.minPrice)} – {formatPKR(valuationResult.maxPrice)}
              </div>
              <p className="text-xs text-whatsapp font-semibold pt-1">
                Fair Market Midpoint: ~{formatPKR(valuationResult.fairValue)}
              </p>
            </div>

            {/* Spec summary capsule */}
            <div className="bg-on-primary/5 p-3 rounded border border-on-primary/10 text-xs text-on-primary-container text-center">
              <span className="font-bold text-on-primary block">{valuationResult.specsSummary}</span>
              <span className="text-[11px] text-on-primary-container">
                Market Demand: <strong className="text-whatsapp">{valuationResult.marketDemandTier}</strong> in Pakistani IT hubs
              </span>
            </div>

            {/* Positive & Negative Factors Breakdown */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <span className="font-bold text-whatsapp flex items-center gap-1 mb-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> What Increased Your Valuation:
                </span>
                <ul className="space-y-1 text-on-primary-container text-[11px] pl-4 list-disc">
                  {valuationResult.positiveFactors.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>

              {valuationResult.negativeFactors.length > 0 && (
                <div>
                  <span className="font-bold text-error flex items-center gap-1 mb-1 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" /> Deductions & Risk Factors:
                  </span>
                  <ul className="space-y-1 text-on-primary-container text-[11px] pl-4 list-disc">
                    {valuationResult.negativeFactors.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="border-t border-on-primary/10 pt-4 space-y-2.5">
              {/* Option 1: List on P2P */}
              <button
                id="list-on-apna-laptop-btn"
                onClick={handleListOnMarketplace}
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-extrabold py-3 rounded text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>{romanUrduMode ? 'Apna Laptop Par Free List Karein (Pre-filled)' : 'List it Now on Apna Laptop (Auto-fills)'}</span>
              </button>

              {/* Option 2: Sell Directly via WhatsApp */}
              <a
                id="sell-direct-whatsapp-btn"
                href={generateWhatsAppValuationLink(valuationResult, inputs)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-transparent hover:bg-whatsapp/10 text-whatsapp font-bold py-3 rounded text-xs flex items-center justify-center gap-2 transition-colors border border-whatsapp/50"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{romanUrduMode ? 'Humein Direct Bechein (WhatsApp Offer)' : 'Sell Directly to Us on WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
