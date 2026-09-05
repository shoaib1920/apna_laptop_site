import React from 'react';
import { Home, Store, Heart, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  currentRoute: string;
  navigateTo: (route: string, params?: any) => void;
  currentUser: User | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, navigateTo, currentUser }) => {
  const items = [
    { route: 'home', label: 'Home', icon: Home },
    { route: 'hub', label: 'Browse', icon: Store },
    { route: 'wishlist', label: 'Saved', icon: Heart },
    { route: currentUser ? 'dashboard' : 'home', label: currentUser ? 'Profile' : 'Guest', icon: UserIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant shadow-[0px_-4px_12px_rgba(26,32,44,0.05)] flex justify-around items-center px-2 py-2">
      {items.map(({ route, label, icon: Icon }) => {
        const isActive = currentRoute === route || (route === 'hub' && currentRoute === 'hub_detail');
        return (
          <button
            key={label}
            onClick={() => navigateTo(route)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
              isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
