import React, { useState } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Flag,
} from 'lucide-react';
import { Order, P2PListing, User } from '../types';
import { formatPKR } from '../utils/helpers';

interface UserDashboardViewProps {
  currentUser: User | null;
  orders: Order[];
  p2pListings: P2PListing[];
  deleteP2PListing: (id: string) => void;
  updateP2PListing: (id: string, updates: Partial<P2PListing>) => void;
  navigateTo: (route: string, params?: any) => void;
  romanUrduMode: boolean;
}

const statusStyles: Record<Order['status'], { badge: string; icon: React.ElementType }> = {
  pending: { badge: 'bg-surface-container-high text-on-surface-variant', icon: Clock },
  confirmed: { badge: 'bg-secondary-container/60 text-on-secondary-container', icon: CheckCircle2 },
  shipped: { badge: 'bg-secondary-container/60 text-on-secondary-container', icon: Truck },
  delivered: { badge: 'bg-whatsapp/10 text-whatsapp-dark', icon: PackageCheck },
  cancelled: { badge: 'bg-error-container text-on-error-container', icon: Clock },
};

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  currentUser,
  orders,
  p2pListings,
  deleteP2PListing,
  updateP2PListing,
  navigateTo,
  romanUrduMode,
}) => {
  const [tab, setTab] = useState<'orders' | 'listings'>('orders');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-outline-variant mx-auto" />
        <h1 className="text-lg font-bold text-on-surface font-display">You're browsing as a guest</h1>
        <p className="text-sm text-on-surface-variant">
          Switch to one of the demo accounts from the profile menu to see orders and listings here.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="bg-primary hover:opacity-90 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.buyer_id === currentUser.id);
  const myListings = p2pListings.filter((l) => l.seller_id === currentUser.id);

  const handleEditListing = (listing: P2PListing) => {
    navigateTo('sell', {
      sellSpecs: {
        title: listing.title,
        brand: listing.brand,
        model: listing.model,
        asking_price: listing.asking_price,
        condition: listing.condition,
        box_included: listing.box_included,
        charger_included: listing.charger_included,
        specs: listing.specs,
      },
    });
  };

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
              <span className="flex items-center gap-1 bg-whatsapp/20 text-whatsapp text-[10px] font-bold px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Bharosa Mand
              </span>
            )}
          </div>
          <p className="text-xs text-on-primary-container mt-1">
            {currentUser.city} · Member since {currentUser.joined_at}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-lg w-fit">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
            tab === 'orders' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'
          }`}
        >
          My Orders ({myOrders.length})
        </button>
        <button
          onClick={() => setTab('listings')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
            tab === 'listings' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant'
          }`}
        >
          My Listings ({myListings.length})
        </button>
      </div>

      {tab === 'orders' && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center border border-outline-variant text-sm text-on-surface-variant">
              No Hub orders yet. Browse the Laptop Hub to place your first order.
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
                    <span className="font-extrabold text-on-surface font-display">{formatPKR(order.total_price)}</span>
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
      )}

      {tab === 'listings' && (
        <div className="space-y-3">
          <button
            onClick={() => navigateTo('sell')}
            className="w-full border-2 border-dashed border-outline-variant hover:border-whatsapp rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant hover:text-whatsapp-dark transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create New Listing
          </button>

          {myListings.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 text-center border border-outline-variant text-sm text-on-surface-variant">
              You haven't posted any laptops for sale yet.
            </div>
          ) : (
            myListings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex items-center gap-4 ${
                  listing.status === 'sold' ? 'opacity-60' : ''
                }`}
              >
                <img src={listing.images[0]} alt={listing.title} className="w-16 h-16 rounded-lg object-cover bg-surface-container" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface text-sm truncate">{listing.title}</h3>
                  <p className="text-xs font-extrabold text-whatsapp-dark font-display">{formatPKR(listing.asking_price)}</p>
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-1">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.view_count}</span>
                    {listing.reports_count > 0 && (
                      <span className="flex items-center gap-1 text-error"><Flag className="w-3 h-3" /> {listing.reports_count}</span>
                    )}
                    <span className="uppercase font-bold">{listing.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {listing.status === 'active' && (
                    <button
                      onClick={() => updateP2PListing(listing.id, { status: 'sold' })}
                      className="text-[11px] font-bold text-whatsapp-dark border border-outline-variant rounded-md px-2 py-1.5"
                    >
                      Mark Sold
                    </button>
                  )}
                  <button
                    onClick={() => handleEditListing(listing)}
                    className="text-on-surface-variant border border-outline-variant rounded-md p-1.5"
                    title="Edit listing"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteP2PListing(listing.id)}
                    className="text-error border border-outline-variant hover:border-error rounded-md p-1.5"
                    title="Delete listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
