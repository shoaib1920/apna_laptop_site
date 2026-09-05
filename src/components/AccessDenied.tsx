import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
  navigateTo: (route: string) => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 bg-error-container text-on-error-container rounded-xl flex items-center justify-center mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-extrabold text-on-surface font-display">Admins Only</h1>
      <p className="text-sm text-on-surface-variant">
        Your account doesn't have admin access. If you believe this is a mistake, contact the site
        owner to get added as an admin.
      </p>
      <button
        onClick={() => navigateTo('home')}
        className="bg-primary hover:opacity-90 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow"
      >
        Back to Home
      </button>
    </div>
  );
};
