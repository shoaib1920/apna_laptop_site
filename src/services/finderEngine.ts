import { FinderQuizAnswers, FinderMatch, HubListing, P2PListing } from '../types';

/**
 * Intelligent Laptop Finder Wizard Engine
 * Evaluates budget, use-case constraints, specs, and form factors.
 */
export function matchLaptopsForQuiz(
  answers: FinderQuizAnswers,
  hubListings: HubListing[],
  p2pListings: P2PListing[]
): FinderMatch[] {
  const matches: FinderMatch[] = [];

  // Parse budget range
  let minBudget = 0;
  let maxBudget = 999999;
  if (answers.budgetTier === 'under_50k') {
    minBudget = 20000;
    maxBudget = 55000;
  } else if (answers.budgetTier === '50k_80k') {
    minBudget = 48000;
    maxBudget = 85000;
  } else if (answers.budgetTier === '80k_130k') {
    minBudget = 75000;
    maxBudget = 138000;
  } else if (answers.budgetTier === '130k_200k') {
    minBudget = 125000;
    maxBudget = 210000;
  } else if (answers.budgetTier === '200k_plus') {
    minBudget = 195000;
    maxBudget = 600000;
  }

  // Helper score function
  const scoreItem = (
    item: HubListing | P2PListing,
    isHub: boolean
  ): { score: number; reasons: string[]; highlightBadge: string } => {
    let score = 70; // baseline
    const reasons: string[] = [];
    let highlightBadge = isHub ? 'Verified Hub Stock' : 'P2P Deal';

    const price = isHub ? (item as HubListing).sale_price : (item as P2PListing).asking_price;
    const title = item.title.toLowerCase();
    const cpu = item.specs.cpu.toLowerCase();
    const ram = item.specs.ram.toLowerCase();
    const gpu = item.specs.gpu.toLowerCase();
    const tags = isHub ? (item as HubListing).use_case_tags : [];

    // 1. Budget fit
    if (price >= minBudget && price <= maxBudget) {
      score += 25;
      reasons.push(`Perfect fit within your selected budget of Rs. ${price.toLocaleString()}`);
    } else if (price < minBudget) {
      score += 10;
      reasons.push(`Under your budget, saving you money at Rs. ${price.toLocaleString()}`);
    } else {
      score -= 20; // slightly over budget
    }

    // 2. Primary Use-case evaluation
    if (answers.primaryUseCase === 'Programming & Dev') {
      if (ram.includes('16gb') || ram.includes('32gb')) {
        score += 20;
        reasons.push('16GB+ RAM ensures fast Docker containers, VS Code, and browser tabs.');
      }
      if (cpu.includes('i7') || cpu.includes('ryzen 7') || cpu.includes('m1') || cpu.includes('m2') || cpu.includes('i5-11') || cpu.includes('i5-12')) {
        score += 15;
        reasons.push('High multi-core CPU handles code compilation effortlessly.');
      }
      if (tags.includes('Programming & Dev')) score += 10;
      highlightBadge = 'Top Dev Choice';
    } else if (answers.primaryUseCase === 'Gaming') {
      if (gpu.includes('rtx') || gpu.includes('gtx') || gpu.includes('radeon') || gpu.includes('nvidia')) {
        score += 35;
        reasons.push(`Dedicated GPU (${item.specs.gpu}) delivers smooth 60+ FPS in GTA V, Valorant & CS2.`);
      } else {
        score -= 25; // no dedicated GPU for gaming
      }
      if (item.specs.refreshRate && item.specs.refreshRate.includes('144Hz')) {
        score += 10;
        reasons.push('144Hz high refresh rate screen for competitive gaming.');
      }
      highlightBadge = 'Gaming Machine';
    } else if (answers.primaryUseCase === 'Video & Graphic Editing') {
      if (gpu.includes('rtx') || gpu.includes('gtx') || cpu.includes('m1') || cpu.includes('m2')) {
        score += 25;
        reasons.push('GPU acceleration & fast media encoding for Premiere Pro & After Effects.');
      }
      if (ram.includes('16gb') || ram.includes('32gb')) {
        score += 15;
        reasons.push('Generous RAM for 4K video timelines and heavy Photoshop layers.');
      }
      highlightBadge = 'Creator Ready';
    } else if (answers.primaryUseCase === 'Study & Online Classes' || answers.primaryUseCase === 'Office & Daily Work') {
      if (item.specs.weightKg && parseFloat(item.specs.weightKg) <= 1.5) {
        score += 15;
        reasons.push('Lightweight and portable for university backpacks and daily commute.');
      }
      if (item.specs.batteryHealth || (isHub && (item as HubListing).specs.batteryHealth)) {
        score += 10;
        reasons.push('Reliable battery backup suited for study sessions during power cuts.');
      }
      highlightBadge = 'Best Value Pick';
    } else if (answers.primaryUseCase === 'Business & Frequent Travel') {
      if (title.includes('thinkpad') || title.includes('elitebook') || title.includes('macbook') || title.includes('latitude')) {
        score += 25;
        reasons.push('Military-grade durable chassis and premium keyboard for business productivity.');
      }
      highlightBadge = 'Executive Business';
    }

    // 3. Portability preference
    if (answers.portability === 'ultraportable') {
      if (item.specs.screenSize.includes('13') || item.specs.screenSize.includes('14')) {
        score += 15;
      }
    } else if (answers.portability === 'desktop_replacement') {
      if (item.specs.screenSize.includes('15') || item.specs.screenSize.includes('16') || item.specs.screenSize.includes('17')) {
        score += 15;
      }
    }

    // Hub verified items get a 10 pt trust boost
    if (isHub) {
      score += 10;
      reasons.push('Includes Apna Laptop 7-Day Checking Warranty and verified supplier inspection.');
    }

    return { score, reasons, highlightBadge };
  };

  // Score all Hub listings
  hubListings.forEach((item) => {
    if (item.status === 'out_of_stock') return;
    const { score, reasons, highlightBadge } = scoreItem(item, true);
    matches.push({
      listing: item,
      type: 'hub',
      matchScore: score,
      reasons: reasons.slice(0, 3),
      highlightBadge,
    });
  });

  // Score active P2P listings
  p2pListings.forEach((item) => {
    if (item.status !== 'active') return;
    const { score, reasons, highlightBadge } = scoreItem(item, false);
    matches.push({
      listing: item,
      type: 'p2p',
      matchScore: score,
      reasons: reasons.slice(0, 3),
      highlightBadge,
    });
  });

  // Sort descending by score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 3-4 matches
  return matches.slice(0, 3);
}
