import { UpgradePartOption } from '../types';

export const UPGRADE_CATALOG: UpgradePartOption[] = [
  {
    id: 'ram_8gb_ddr4',
    name: '+8GB DDR4 3200MHz RAM Upgrade',
    category: 'RAM',
    costPkr: 4800,
    perfScoreGain: 22,
    description: 'Allows dual-channel bandwidth and eliminates stutter when running multiple heavy applications.',
    compatibilityNote: 'Compatible with Intel 6th-12th gen and AMD Ryzen laptops with an open SODIMM slot.',
  },
  {
    id: 'ram_16gb_ddr4',
    name: '+16GB DDR4 3200MHz RAM Upgrade',
    category: 'RAM',
    costPkr: 8900,
    perfScoreGain: 35,
    description: 'Provides 24GB-32GB total memory, ideal for professional video editing, Android Studio, and VMs.',
    compatibilityNote: 'Requires standard DDR4 SODIMM expandable slot.',
  },
  {
    id: 'ram_16gb_ddr5',
    name: '+16GB DDR5 4800/5600MHz RAM Upgrade',
    category: 'RAM',
    costPkr: 14500,
    perfScoreGain: 40,
    description: 'Next-gen high frequency memory for Intel 12th/13th/14th Gen and Ryzen 6000+ gaming/creator laptops.',
    compatibilityNote: 'Only for DDR5 compatible motherboards.',
  },
  {
    id: 'ssd_512gb_nvme',
    name: '512GB M.2 NVMe PCIe High-Speed SSD',
    category: 'SSD',
    costPkr: 6200,
    perfScoreGain: 30,
    description: 'Replaces slow HDD or 128GB drive with 2400MB/s read speeds. Windows boots in under 6 seconds.',
    compatibilityNote: 'M.2 2280 NVMe slot required (present in 95% laptops 2017+).',
  },
  {
    id: 'ssd_1tb_nvme',
    name: '1TB M.2 NVMe PCIe Gen3/Gen4 SSD',
    category: 'SSD',
    costPkr: 12500,
    perfScoreGain: 35,
    description: 'Huge high-speed storage for 15+ AAA game installs, large video assets, or massive datasets.',
    compatibilityNote: 'M.2 2280 NVMe slot.',
  },
  {
    id: 'thermal_service',
    name: 'Premium Arctic MX-4 Thermal Repaste & Fan Cleaning',
    category: 'Thermal & Service',
    costPkr: 2200,
    perfScoreGain: 15,
    description: 'Lowers CPU/GPU operating temps by 8°C–14°C, preventing thermal throttling during warm Pakistani summers.',
    compatibilityNote: 'Universal for all used and gaming laptops.',
  },
];

export interface UpgradeSimulationResult {
  totalUpgradeCost: number;
  estimatedNewValue: number;
  overallPerformanceBoostPercent: number;
  newRamCapacity: string;
  newStorageCapacity: string;
  recommendations: string[];
}

export function simulateLaptopUpgrade(
  baseLaptopPrice: number,
  baseRam: string,
  baseStorage: string,
  selectedUpgradeIds: string[]
): UpgradeSimulationResult {
  const selectedUpgrades = UPGRADE_CATALOG.filter((u) => selectedUpgradeIds.includes(u.id));
  
  const totalUpgradeCost不易 = selectedUpgrades.reduce((sum, u) => sum + u.costPkr, 0);
  const totalGain = selectedUpgrades.reduce((sum, u) => sum + u.perfScoreGain, 0);
  
  // Base estimates
  let newRamCapacity = baseRam;
  let newStorageCapacity = baseStorage;
  const recommendations: string[] = [];

  if (selectedUpgradeIds.includes('ram_8gb_ddr4')) {
    newRamCapacity = baseRam === '8GB' ? '16GB (Dual Channel)' : '12GB+';
    recommendations.push('Dual-channel RAM will give you an immediate 15-20% boost in integrated graphics (Intel Iris / AMD Vega) gaming.');
  }
  if (selectedUpgradeIds.includes('ram_16gb_ddr4') || selectedUpgradeIds.includes('ram_16gb_ddr5')) {
    newRamCapacity = '32GB';
    recommendations.push('32GB total memory ensures zero tab freezing in Chrome with 100+ open tabs alongside VS Code.');
  }
  if (selectedUpgradeIds.includes('ssd_512gb_nvme')) {
    newStorageCapacity = '512GB NVMe SSD';
    recommendations.push('NVMe SSD reduces application startup time from 45s down to 4s.');
  }
  if (selectedUpgradeIds.includes('ssd_1tb_nvme')) {
    newStorageCapacity = '1TB NVMe SSD';
    recommendations.push('1TB storage means you never have to delete video projects or modern games.');
  }
  if (selectedUpgradeIds.includes('thermal_service')) {
    recommendations.push('Fresh thermal paste prevents CPU fan roaring and battery drain.');
  }

  const overallPerformanceBoostPercent不易 = Math.min(85, Math.round(totalGain * 0.9));
  const estimatedNewValue = baseLaptopPrice + Math.round(totalUpgradeCost不易 * 0.92);

  return {
    totalUpgradeCost: totalUpgradeCost不易,
    estimatedNewValue,
    overallPerformanceBoostPercent: overallPerformanceBoostPercent不易,
    newRamCapacity,
    newStorageCapacity,
    recommendations,
  };
}
