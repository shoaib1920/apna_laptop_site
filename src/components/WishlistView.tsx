import React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { HubListing } from '../types';
import { formatPKR } from '../utils/helpers';

interface WishlistViewProps {
  wishlist: string[];
  hubListings: HubListing[];
  toggleWishlist: (id: string) => void;
  navigateTo: (route: string, params?: any) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlist = [],
  hubListings = [],
  toggleWishlist,
  navigateTo,
}) => {
  const savedHubItems = (hubListings || []).filter((l) => (wishlist || []).includes(l.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface font-display flex items-center gap-2">
            <Heart className="w-6 h-6 text-error fill-error" />
            <span>Saved Laptops & Wishlist</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            Keep track of laptop deals you are considering before making a decision.
          </p>
        </div>
        <span className="text-xs font-bold bg-surface-container-low px-3 py-1 rounded-full text-on-surface">
          {savedHubItems.length} saved
        </span>
      </div>

      {savedHubItems.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant space-y-4">
          <Heart className="w-12 h-12 text-outline-variant mx-auto" />
          <h3 className="font-bold text-on-surface text-base">No saved laptops yet</h3>
          <p className="text-xs text-on-surface-variant">
            Click the heart icon on any laptop in the Hub to bookmark it here.
          </p>
          <button
            onClick={() => navigateTo('hub')}
            className="bg-steel hover:bg-steel-dark text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow"
          >
            Explore Laptop Hub
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedHubItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-white">
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-contain p-3" />
                  <span className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded">
                    Verified Hub
                  </span>
                </div>
                <h3 className="font-bold text-on-surface text-sm line-clamp-1">{item.title}</h3>
                <p className="price text-xs">
                  {formatPKR(item.sale_price)}
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                <button
                  onClick={() => navigateTo('hub_detail', { hubId: item.id })}
                  className="flex-1 bg-primary hover:opacity-90 text-white text-xs font-bold py-2 rounded-lg"
                >
                  View Product
                </button>
                <button
                  onClick={() => toggleWishlist(item.id)}
                  className="p-2 text-error hover:bg-error-container rounded-lg"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
