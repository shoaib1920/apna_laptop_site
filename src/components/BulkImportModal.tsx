import React, { useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { HubListing } from '../types';
import { IMPORT_CATALOG } from '../data/importCatalog';
import { uploadHubListingImage } from '../services/firestoreData';
import { formatPKR } from '../utils/helpers';

interface BulkImportModalProps {
  onClose: () => void;
  createHubListing: (listing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>) => HubListing;
}

type RowStatus = 'pending' | 'uploading' | 'done' | 'error';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, createHubListing }) => {
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [costPrices, setCostPrices] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});
  const [running, setRunning] = useState(false);

  const attachedCount = Object.values(files).filter(Boolean).length;

  const handleImportAll = async () => {
    setRunning(true);
    for (let i = 0; i < IMPORT_CATALOG.length; i++) {
      const file = files[i];
      if (!file) continue;
      setStatuses((s) => ({ ...s, [i]: 'uploading' }));
      try {
        const imageUrl = await uploadHubListingImage(file);
        const entry = IMPORT_CATALOG[i];
        const costPrice = Number(costPrices[i]) || 0;
        createHubListing({
          ...entry.listing,
          cost_price: costPrice,
          images: [imageUrl],
        });
        setStatuses((s) => ({ ...s, [i]: 'done' }));
      } catch (e) {
        console.error('Bulk import failed for', IMPORT_CATALOG[i].listing.title, e);
        setStatuses((s) => ({ ...s, [i]: 'error' }));
      }
    }
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl p-6 max-w-3xl w-full border border-outline-variant shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <div>
            <h3 className="font-bold text-on-surface text-sm">Bulk Import New Arrivals</h3>
            <p className="text-[11px] text-on-surface-variant">
              Attach each laptop's photo from the <code className="font-mono-spec">import_photos</code> folder,
              set your real supplier cost, then import all at once.
            </p>
          </div>
          <button onClick={onClose} className="text-xs text-on-surface-variant">✕</button>
        </div>

        <div className="space-y-2">
          {IMPORT_CATALOG.map((entry, i) => {
            const status = statuses[i];
            return (
              <div
                key={entry.expectedFilename}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-outline-variant bg-surface-container-low text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{entry.listing.title}</p>
                  <p className="text-on-surface-variant">
                    Sale price: <span className="price">{formatPKR(entry.listing.sale_price)}</span>
                  </p>
                </div>

                <input
                  type="number"
                  placeholder="Cost price (PKR)"
                  value={costPrices[i] || ''}
                  onChange={(e) => setCostPrices((c) => ({ ...c, [i]: e.target.value }))}
                  className="w-full sm:w-32 bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1.5"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFiles((f) => ({ ...f, [i]: e.target.files?.[0] || null }))}
                  className="w-full sm:w-56 text-[11px]"
                />

                <div className="w-6 flex justify-center shrink-0">
                  {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-steel" />}
                  {status === 'done' && <CheckCircle2 className="w-4 h-4 text-steel-dark" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4 text-error" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <p className="text-[11px] text-on-surface-variant">
            {attachedCount} of {IMPORT_CATALOG.length} photos attached
          </p>
          <button
            onClick={handleImportAll}
            disabled={running || attachedCount === 0}
            className="flex items-center gap-2 bg-steel hover:bg-steel-dark disabled:opacity-60 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{running ? 'Importing...' : `Import ${attachedCount} Listing${attachedCount === 1 ? '' : 's'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
