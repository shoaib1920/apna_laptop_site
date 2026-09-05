import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Laptop,
  Check,
  RotateCcw,
  MessageCircle,
  Cpu,
  Layers,
  Zap,
  Code,
  GraduationCap,
  Palette,
  Gamepad2,
  BarChart3,
  Plane,
} from 'lucide-react';
import { FinderQuizAnswers, FinderMatch, HubListing } from '../types';
import { matchLaptopsForQuiz } from '../services/finderEngine';
import { formatPKR, getHubWhatsAppLink } from '../utils/helpers';

interface LaptopFinderViewProps {
  hubListings: HubListing[];
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

export const LaptopFinderView: React.FC<LaptopFinderViewProps> = ({
  hubListings = [],
  navigateTo,
  romanUrduMode,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<FinderQuizAnswers>({
    primaryUseCase: 'Programming & Dev',
    budgetTier: '80k_130k',
    portability: 'standard',
    batteryPriority: 'moderate',
    conditionPref: 'any',
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleSelect = (field: keyof FinderQuizAnswers, value: any) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setIsCompleted(false);
  };

  const matches: FinderMatch[] = isCompleted
    ? matchLaptopsForQuiz(answers, hubListings)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-extrabold font-display text-on-surface flex items-center gap-2">
            <Compass className="w-5 h-5 text-steel-dark" />
            <span>Laptop Finder Wizard</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {romanUrduMode
              ? '5 aasan sawalaat ka jawab dein aur behtareen laptop talash karein.'
              : 'Answer 5 quick questions to get the ideal hardware match for your budget.'}
          </p>
        </div>

        {isCompleted && (
          <button
            onClick={handleRestart}
            className="text-xs font-bold text-on-surface-variant border border-outline-variant px-3.5 py-2 rounded flex items-center gap-1 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        )}
      </div>

      {!isCompleted ? (
        /* QUIZ STEPS */
        <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
              <span>Step {currentStep} of 5</span>
              <span>{Math.round((currentStep / 5) * 100)}% Completed</span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-steel transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Use Case */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">
                  1. What will you primarily use this laptop for?
                </h3>
                <p className="text-xs text-on-surface-variant">Select the task that requires the most computing power.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'Programming & Dev',
                    title: 'Software Development & Coding',
                    desc: 'VS Code, Docker, Web Dev, Python, Flutter, Virtual Machines',
                    icon: Code,
                  },
                  {
                    id: 'Study & Online Classes',
                    title: 'University / College Student',
                    desc: 'Assignments, Zoom, Presentations, Research, Long Battery Life',
                    icon: GraduationCap,
                  },
                  {
                    id: 'Video & Graphic Editing',
                    title: 'Graphic Design & Video Editing',
                    desc: 'Premiere Pro, Photoshop, After Effects, Illustrator, 3D',
                    icon: Palette,
                  },
                  {
                    id: 'Gaming',
                    title: 'AAA Gaming & Streaming',
                    desc: 'GTA V, Valorant, Cyberpunk, High FPS, Dedicated GPU',
                    icon: Gamepad2,
                  },
                  {
                    id: 'Office & Daily Work',
                    title: 'Office Work & Freelance Browsing',
                    desc: 'MS Excel, Accounting, Google Docs, Multiple Tabs, Email',
                    icon: BarChart3,
                  },
                  {
                    id: 'Business & Frequent Travel',
                    title: 'Business & Frequent Travel',
                    desc: 'Ultra lightweight, all-day battery, sleek metal chassis',
                    icon: Plane,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('primaryUseCase', item.id)}
                    className={`p-4 rounded border text-left flex items-start gap-3 transition-all ${
                      answers.primaryUseCase === item.id
                        ? 'border-steel bg-steel-tint shadow-sm ring-2 ring-steel/20'
                        : 'border-outline-variant hover:border-outline hover:bg-surface-container-low'
                    }`}
                  >
                    <item.icon className="w-5 h-5 text-steel-dark shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-on-surface text-xs">{item.title}</h4>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Budget */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">
                  2. What is your approximate maximum budget?
                </h3>
                <p className="text-xs text-on-surface-variant">All prices in Pakistani Rupees (PKR).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'under_50k',
                    range: 'Under Rs. 50,000',
                    desc: 'Budget entry-level (Core i5 6th Gen / 8GB RAM)',
                  },
                  {
                    id: '50k_80k',
                    range: 'Rs. 50,000 – Rs. 80,000',
                    desc: 'Sweet spot for students (i5 8th Gen Quad-Core)',
                  },
                  {
                    id: '80k_130k',
                    range: 'Rs. 80,000 – Rs. 130,000',
                    desc: 'High performance Dev machines / Open-Box ThinkPads',
                  },
                  {
                    id: '130k_200k',
                    range: 'Rs. 130,000 – Rs. 200,000',
                    desc: 'Apple M1/M2 MacBooks, Dedicated RTX Gaming rigs',
                  },
                  {
                    id: '200k_plus',
                    range: 'Above Rs. 200,000 (Premium)',
                    desc: 'MacBook Pro M-Series, Dell XPS 15, High-end Workstations',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('budgetTier', item.id)}
                    className={`p-4 rounded border text-left transition-all ${
                      answers.budgetTier === item.id
                        ? 'border-steel bg-steel-tint shadow-sm ring-2 ring-steel/20'
                        : 'border-outline-variant hover:border-outline hover:bg-surface-container-low'
                    }`}
                  >
                    <h4 className="font-extrabold text-on-surface text-sm font-display">{item.range}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Portability & Battery */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">
                  3. How important is battery backup & weight?
                </h3>
                <p className="text-xs text-on-surface-variant">Balances chassis size vs raw thermal power.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'ultraportable',
                    title: 'Ultraportable (13-14 inch, <1.4kg, 5+ Hours Battery)',
                    desc: 'For moving around university campus, offices, coffee shops.',
                  },
                  {
                    id: 'standard',
                    title: 'Balanced Workhorse (14-15.6 inch, ~1.8kg, 3-4 Hours Battery)',
                    desc: 'The classic business laptop format (ThinkPad T series, Dell Latitude).',
                  },
                  {
                    id: 'desktop_replacement',
                    title: 'Max Power & Screen (15.6-17 inch, Heavy, Always Plugged in)',
                    desc: 'Prioritizes maximum CPU/GPU clock speeds and cooling fans.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('portability', item.id)}
                    className={`w-full p-4 rounded border text-left transition-all ${
                      answers.portability === item.id
                        ? 'border-steel bg-steel-tint shadow-sm ring-2 ring-steel/20'
                        : 'border-outline-variant hover:border-outline hover:bg-surface-container-low'
                    }`}
                  >
                    <h4 className="font-bold text-on-surface text-xs">{item.title}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Battery Priority */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">
                  4. Battery Duration Requirement
                </h3>
                <p className="text-xs text-on-surface-variant">During load-shedding or campus usage.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'all_day',
                    title: 'All-Day Battery (5 to 8+ Hours)',
                    desc: 'MacBook M-series or low-power Intel EVO platform.',
                  },
                  {
                    id: 'moderate',
                    title: 'Moderate (3 to 4 Hours)',
                    desc: 'Standard commercial battery health (ThinkPad, Dell Latitude).',
                  },
                  {
                    id: 'plugged_mostly',
                    title: 'Mostly Plugged into Desk',
                    desc: 'High TDP performance CPU/GPU where wall power is available.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('batteryPriority', item.id)}
                    className={`w-full p-4 rounded border text-left transition-all ${
                      answers.batteryPriority === item.id
                        ? 'border-steel bg-steel-tint shadow-sm ring-2 ring-steel/20'
                        : 'border-outline-variant hover:border-outline hover:bg-surface-container-low'
                    }`}
                  >
                    <h4 className="font-bold text-on-surface text-xs">{item.title}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Condition Preference */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">
                  5. Condition Preference
                </h3>
                <p className="text-xs text-on-surface-variant">Choose between open-box premium or maximum value used.</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'any',
                    title: 'Any Good Condition (Best Value for Money)',
                    desc: 'Clean Grade A/A+ tested units with warranty.',
                  },
                  {
                    id: 'new_or_openbox',
                    title: 'Like New / Open Box 10/10 Only',
                    desc: 'Flawless condition with near 100% battery health.',
                  },
                  {
                    id: 'used_budget',
                    title: 'Maximum Hardware Specs on a Tight Budget',
                    desc: 'Grade A/B cosmetic condition acceptable to maximize CPU/RAM.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('conditionPref', item.id)}
                    className={`w-full p-4 rounded border text-left transition-all ${
                      answers.conditionPref === item.id
                        ? 'border-steel bg-steel-tint shadow-sm ring-2 ring-steel/20'
                        : 'border-outline-variant hover:border-outline hover:bg-surface-container-low'
                    }`}
                  >
                    <h4 className="font-bold text-on-surface text-xs">{item.title}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="bg-steel hover:bg-steel-dark text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <span>{currentStep === 5 ? 'Show Recommended Matches' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* RESULTS VIEW */
        <div className="space-y-6 animate-fade-in">
          <div className="bg-primary text-on-primary rounded-lg p-6 sm:p-8 border border-steel/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-steel" />
              <h2 className="text-base font-extrabold font-display text-steel uppercase tracking-wider">
                Recommendation Summary
              </h2>
            </div>
            <p className="text-xs text-on-primary-container leading-relaxed">
              Based on your requirements for <strong>{answers.primaryUseCase}</strong>, here are the top-rated laptop matches currently available:
            </p>
          </div>

          {/* Matched List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, idx) => {
              const item = match.listing as HubListing;
              const price = item.sale_price;
              const isVerifiedBadge = match.highlightBadge.toLowerCase().includes('verified');

              return (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-lg border-2 border-steel/60 p-5 shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          isVerifiedBadge ? 'bg-copper' : 'bg-steel'
                        }`}
                      >
                        {match.highlightBadge}
                      </span>
                      <span className="price text-base">
                        {formatPKR(price)}
                      </span>
                    </div>

                    <div className="aspect-16/9 rounded overflow-hidden bg-surface-container-high">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <h4 className="font-bold text-on-surface text-sm line-clamp-1">{item.title}</h4>

                    {/* Match reasons */}
                    <div className="bg-steel-tint p-2.5 rounded-xl border border-steel/20 space-y-1">
                      {match.reasons.map((r, i) => (
                        <div key={i} className="text-[11px] text-steel-dark flex items-start gap-1">
                          <Check className="w-3 h-3 text-steel-dark shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-on-surface-variant">
                      <div className="bg-surface-container-low p-1.5 rounded border border-outline-variant"><span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">CPU:</span> {item.specs.cpu.split('(')[0]}</div>
                      <div className="bg-surface-container-low p-1.5 rounded border border-outline-variant"><span className="font-mono-spec text-[10px] uppercase text-outline tracking-wide">RAM:</span> {item.specs.ram}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant">
                    <a
                      href={getHubWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => navigateTo('hub_detail', { hubId: item.id })}
                      className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs py-2.5 rounded-xl"
                    >
                      View Specs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sourcing WhatsApp Consultation CTA */}
          <div className="bg-whatsapp/10 rounded-lg p-6 border border-whatsapp/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-on-surface text-sm">Need a custom lot configuration?</h4>
              <p className="text-xs text-on-surface-variant">
                Send your Finder profile to our Nankana Sahib technical team on WhatsApp. We will handpick a tested unit for you today.
              </p>
            </div>

            <a
              href={`https://wa.me/923016672356?text=${encodeURIComponent(`Salam Apna Laptop team! I took the Finder Quiz for ${answers.primaryUseCase} with budget ${answers.budgetTier}. Can you share current available stock?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-5 py-3 rounded flex items-center gap-2 whitespace-nowrap shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Consult on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
