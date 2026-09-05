import { ValuationFormInputs, ValuationResult } from '../types';

// We currently only deliver/service Nankana Sahib and the surrounding towns —
// keep this list scoped to the real service area, don't expand back to a
// generic "major Pakistani cities" list.
export const SERVICE_AREA_CITIES = [
  'Nankana Sahib',
  'Shahkot',
  'Manawala',
  'Mor Khunda',
  'Bachyana',
  'Buchaki',
];

export const BRAND_TIERS: Record<string, { multiplier: number; name: string }> = {
  apple: { multiplier: 1.35, name: 'Apple' },
  dell: { multiplier: 1.05, name: 'Dell' },
  lenovo: { multiplier: 1.05, name: 'Lenovo (ThinkPad/Yoga)' },
  hp: { multiplier: 1.0, name: 'HP (EliteBook/Pavilion)' },
  asus: { multiplier: 1.08, name: 'Asus (ROG/ZenBook)' },
  acer: { multiplier: 0.95, name: 'Acer' },
  msi: { multiplier: 1.05, name: 'MSI Gaming' },
  microsoft: { multiplier: 1.15, name: 'Microsoft Surface' },
  other: { multiplier: 0.9, name: 'Other Brand' },
};

export const CPU_BASE_VALUES: Record<string, number> = {
  // Intel Generations
  'intel_core_4th_5th': 28000,
  'intel_core_6th_7th': 42000,
  'intel_core_8th': 58000,
  'intel_core_9th_10th': 78000,
  'intel_core_11th': 105000,
  'intel_core_12th': 140000,
  'intel_core_13th_14th': 195000,
  'intel_celeron_pentium': 24000,
  
  // AMD Ryzen
  'amd_ryzen_2000_3000': 48000,
  'amd_ryzen_4000_5000': 85000,
  'amd_ryzen_6000_7000': 135000,
  'amd_ryzen_8000_ai': 190000,
  
  // Apple Silicon
  'apple_m1': 165000,
  'apple_m1_pro_max': 230000,
  'apple_m2': 210000,
  'apple_m2_pro_max': 290000,
  'apple_m3': 280000,
  'apple_intel_legacy': 75000,
};

export const RAM_ADJUSTMENTS: Record<string, number> = {
  '4gb': -6000,
  '8gb': 0,
  '16gb': 9000,
  '24gb': 15000,
  '32gb': 24000,
  '64gb': 45000,
};

export const STORAGE_ADJUSTMENTS: Record<string, number> = {
  '128gb_ssd': -4000,
  '256gb_ssd': 0,
  '512gb_ssd': 7000,
  '1tb_ssd': 15000,
  '2tb_ssd': 28000,
  '500gb_hdd': -8000,
  '1tb_hdd': -5000,
};

/**
 * Core Rule-Based Laptop Price Valuation Engine
 * Separated and easily maintainable.
 */
export function calculateLaptopValuation(inputs: ValuationFormInputs): ValuationResult {
  const brandKey = inputs.brand.toLowerCase();
  const brandInfo = BRAND_TIERS[brandKey] || { multiplier: 1.0, name: inputs.brand };
  
  const baseCpuValue = CPU_BASE_VALUES[inputs.cpuGen] || 60000;
  
  let currentValuation = baseCpuValue * brandInfo.multiplier;
  
  // Adjust for RAM
  const ramAdj = RAM_ADJUSTMENTS[inputs.ram.toLowerCase()] ?? 0;
  currentValuation += ramAdj;
  
  // Adjust for Storage
  const storageKey = `${inputs.storageSize.toLowerCase()}_${inputs.storageType.toLowerCase()}`.replace(/\s+/g, '');
  const storageAdj = STORAGE_ADJUSTMENTS[storageKey] ?? (inputs.storageType.includes('HDD') ? -6000 : 4000);
  currentValuation += storageAdj;
  
  // Screen Condition Multipliers
  let screenMultiplier = 1.0;
  if (inputs.screenCondition === 'flawless') screenMultiplier = 1.04;
  else if (inputs.screenCondition === 'minor_scratches') screenMultiplier = 0.95;
  else if (inputs.screenCondition === 'spots_lines') screenMultiplier = 0.78;
  else if (inputs.screenCondition === 'cracked') screenMultiplier = 0.55;
  
  // Battery Condition Multipliers
  let batteryMultiplier = 1.0;
  if (inputs.batteryCondition === 'excellent_90_plus') batteryMultiplier = 1.05;
  else if (inputs.batteryCondition === 'good_80_89') batteryMultiplier = 1.0;
  else if (inputs.batteryCondition === 'moderate_60_79') batteryMultiplier = 0.90;
  else if (inputs.batteryCondition === 'dead_plugged_only') batteryMultiplier = 0.75;
  
  // Body Condition Multipliers
  let bodyMultiplier = 1.0;
  if (inputs.bodyCondition === 'mint_like_new') bodyMultiplier = 1.06;
  else if (inputs.bodyCondition === 'minor_wear') bodyMultiplier = 1.0;
  else if (inputs.bodyCondition === 'visible_dents_scratches') bodyMultiplier = 0.88;
  else if (inputs.bodyCondition === 'broken_hinges') bodyMultiplier = 0.70;
  
  currentValuation = currentValuation * screenMultiplier * batteryMultiplier * bodyMultiplier;
  
  // Box and original charger bonus
  let accessoriesBonus = 0;
  if (inputs.chargerOriginal) accessoriesBonus += 3500;
  if (inputs.boxAvailable) accessoriesBonus += 3000;
  currentValuation += accessoriesBonus;
  
  // Repair penalties
  if (inputs.repairsDone === 'screen_replaced') currentValuation *= 0.88;
  if (inputs.repairsDone === 'motherboard_repaired') currentValuation *= 0.78;
  if (inputs.repairsDone === 'battery_replaced') currentValuation *= 0.95;
  
  // Age depreciation factor
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - inputs.purchaseYear);
  const ageDepreciation = Math.max(0.70, 1 - (age * 0.04));
  currentValuation = currentValuation * ageDepreciation;
  
  // Round to nearest 500 PKR
  const roundedFair = Math.round(currentValuation / 500) * 500;
  const spread = Math.round((roundedFair * 0.08) / 500) * 500; // ±8% spread
  const minPrice = Math.max(15000, roundedFair - spread);
  const maxPrice = roundedFair + spread;
  
  // Build factor explanations
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  
  if (brandInfo.multiplier > 1.0) {
    positiveFactors.push(`${brandInfo.name} retains strong resale demand in Pakistan.`);
  }
  if (inputs.ram === '16GB' || inputs.ram === '32GB' || inputs.ram === '64GB') {
    positiveFactors.push(`High capacity RAM (${inputs.ram}) provides a valuable +Rs. ${Math.abs(ramAdj).toLocaleString()} edge for developers & multitasking.`);
  }
  if (inputs.storageType.includes('SSD') && (inputs.storageSize === '512GB' || inputs.storageSize === '1TB')) {
    positiveFactors.push(`Fast NVMe SSD (${inputs.storageSize}) boosts daily responsiveness and buyer interest.`);
  }
  if (inputs.batteryCondition === 'excellent_90_plus') {
    positiveFactors.push('Healthy battery (90%+) is a major selling point in Pakistan (loadshedding/portable use).');
  }
  if (inputs.boxAvailable && inputs.chargerOriginal) {
    positiveFactors.push('Original box & OEM charger package adds ~Rs. 6,500 trust premium.');
  }
  
  if (inputs.screenCondition === 'spots_lines' || inputs.screenCondition === 'cracked') {
    negativeFactors.push('Display defects significantly decrease used market value.');
  }
  if (inputs.batteryCondition === 'dead_plugged_only') {
    negativeFactors.push('Dead/Non-functional battery requires immediate buyer replacement (-Rs. 6,000 to Rs. 10,000 deduction).');
  }
  if (inputs.bodyCondition === 'visible_dents_scratches' || inputs.bodyCondition === 'broken_hinges') {
    negativeFactors.push('Physical cosmetic wear or loose hinges lowers buyer willingness to pay.');
  }
  if (inputs.repairsDone === 'motherboard_repaired') {
    negativeFactors.push('Repaired motherboard raises reliability concerns among buyers.');
  }
  if (inputs.storageType.includes('HDD')) {
    negativeFactors.push('Mechanical HDD reduces price because modern buyers expect fast SSD.');
  }

  // Fallbacks if lists are empty
  if (positiveFactors.length === 0) {
    positiveFactors.push('Standard working specs suitable for everyday office and student use.');
  }
  if (negativeFactors.length === 0) {
    negativeFactors.push('No critical penalties detected. Hardware health is well preserved.');
  }

  let marketDemandTier: 'Very High' | 'High' | 'Moderate' | 'Low' = 'High';
  if (inputs.brand.toLowerCase() === 'apple' || inputs.cpuGen.includes('8th') || inputs.cpuGen.includes('11th') || inputs.cpuGen.includes('m1')) {
    marketDemandTier = 'Very High';
  } else if (inputs.batteryCondition === 'dead_plugged_only' || inputs.screenCondition === 'cracked') {
    marketDemandTier = 'Low';
  }

  const specsSummary = `${inputs.brand} ${inputs.seriesModel || ''} (${inputs.ram} RAM, ${inputs.storageSize} ${inputs.storageType}, ${inputs.screenSize}" Display)`;

  return {
    minPrice,
    maxPrice,
    fairValue: roundedFair,
    confidence: 'High',
    positiveFactors,
    negativeFactors,
    marketDemandTier,
    specsSummary,
  };
}

export function generateWhatsAppValuationLink(valuation: ValuationResult, inputs: ValuationFormInputs): string {
  const text = `Assalam o Alaikum Apna Laptop Team! 
I calculated the valuation for my laptop on your website and want to sell it directly to you or get it verified:
- Laptop: ${inputs.brand} ${inputs.seriesModel || ''}
- Specs: ${inputs.cpuGen.replace(/_/g, ' ').toUpperCase()}, ${inputs.ram} RAM, ${inputs.storageSize} ${inputs.storageType}
- Condition: Body (${inputs.bodyCondition}), Battery (${inputs.batteryCondition}), Screen (${inputs.screenCondition})
- Estimated Valuation: Rs. ${valuation.minPrice.toLocaleString()} - Rs. ${valuation.maxPrice.toLocaleString()}
Please let me know your best offer and pickup/verification process.`;

  return `https://wa.me/923001234567?text=${encodeURIComponent(text)}`;
}
