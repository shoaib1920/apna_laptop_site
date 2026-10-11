import React from 'react';
import { Home, Store, Heart, ShoppingCart, MessageCircle } from 'lucide-react';
import { useShop } from '../services/store';
import { getSupportWhatsAppLink } from '../utils/helpers';

interface BottomNavProps {
  currentRoute: string;
  navigateTo: (route: string, params?: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, navigateTo }) => {
  const { cart, wishlist } = useShop();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemClass = (active: boolean) =>
    `relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
      active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
    }`;
  const badge = (count: number) =>
    count > 0 && (
      <span className="absolute top-0 right-1.5 bg-steel text-white text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
        {count}
      </span>
    );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant shadow-[0px_-4px_12px_rgba(26,32,44,0.05)] flex justify-around items-center px-2 py-2 print:hidden">
      <button onClick={() => navigateTo('home')} className={itemClass(currentRoute === 'home')}>
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>
      <button onClick={() => navigateTo('hub')} className={itemClass(currentRoute === 'hub')}>
        <Store className="w-5 h-5" />
        <span>Shop</span>
      </button>
      <a href={getSupportWhatsAppLink()} target="_blank" rel="noopener noreferrer" className={itemClass(false)}>
        <MessageCircle className="w-5 h-5 text-whatsapp-dark" />
        <span>WhatsApp</span>
      </a>
      <button onClick={() => navigateTo('wishlist')} className={itemClass(currentRoute === 'wishlist')}>
        <Heart className="w-5 h-5" />
        {badge(wishlist.length)}
        <span>Saved</span>
      </button>
      <button onClick={() => navigateTo('cart')} className={itemClass(false)}>
        <ShoppingCart className="w-5 h-5" />
        {badge(cartCount)}
        <span>Bag</span>
      </button>
    </nav>
  );
};
