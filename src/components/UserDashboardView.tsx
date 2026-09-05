import React from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { Order, User } from '../types';
import { formatPKR } from '../utils/helpers';

interface UserDashboardViewProps {
  currentUser: User | null;
  orders: Order[];
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

const statusStyles: Record<Order['status'], { badge: string; icon: React.ElementType }> = {
  pending: { badge: 'bg-surface-container-high text-on-surface-variant', icon: Clock },
  confirmed: { badge: 'bg-secondary-container/60 text-on-secondary-container', icon: CheckCircle2 },
  shipped: { badge: 'bg-secondary-container/60 text-on-secondary-container', icon: Truck },
  delivered: { badge: 'bg-steel-tint text-steel-dark', icon: PackageCheck },
  cancelled: { badge: 'bg-error-container text-on-error-container', icon: Clock },
};

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  currentUser,
  orders,
  navigateTo,
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-outline-variant mx-auto" />
        <h1 className="text-lg font-bold text-on-surface font-display">You're browsing as a guest</h1>
        <p className="text-sm text-on-surface-variant">
          Sign in or create a free account to see your order history here. You can still check out
          as a guest — your WhatsApp confirmation is your receipt either way.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigateTo('account')}
            className="bg-primary hover:opacity-90 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow"
          >
            Sign In / Create Account
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold px-6 py-2.5 rounded-lg border border-outline-variant"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.buyer_id === currentUser.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* Profile header */}
      <div className="bg-primary-container text-on-primary rounded-xl p-6 sm:p-8 shadow-sm flex items-center gap-4">
        <img
          src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
          alt={currentUser.name}
          className="w-16 h-16 rounded-xl object-cover border border-white/20"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold font-display">{currentUser.name}</h1>
            {currentUser.is_phone_verified && (
              <span className="flex items-center gap-1 bg-copper-tint text-copper-dark text-[10px] font-bold px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Bharosa Mand
              </span>
            )}
          </div>
          <p className="text-xs text-on-primary-container mt-1">
            {currentUser.city} · Member since {currentUser.joined_at}
          </p>
        </div>
      </div>

      <h2 className="text-heading-1 font-extrabold text-on-surface font-display">My Orders ({myOrders.length})</h2>

      <div className="space-y-3">
        {myOrders.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center border border-outline-variant text-sm text-on-surface-variant space-y-3">
            <p>No orders yet. Browse the Laptop Hub to place your first order.</p>
            <button
              onClick={() => navigateTo('hub')}
              className="bg-steel hover:bg-steel-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg"
            >
              Browse Laptop Hub
            </button>
          </div>
        ) : (
          myOrders.map((order) => {
            const style = statusStyles[order.status];
            const Icon = style.icon;
            return (
              <div key={order.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono-spec text-xs font-bold text-on-surface">{order.order_number}</span>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${style.badge}`}>
                    <Icon className="w-3 h-3" /> {order.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">
                  {order.items.map((i) => `${i.title} (x${i.qty})`).join(', ')}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                  <span className="price">{formatPKR(order.total_price)}</span>
                  {order.courier_name && (
                    <span className="text-[11px] text-on-surface-variant">
                      {order.courier_name} · {order.tracking_number}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
