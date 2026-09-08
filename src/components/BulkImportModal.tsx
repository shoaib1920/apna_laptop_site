import React, { useState } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import { HubListing } from '../types';
import { IMPORT_CATALOG } from '../data/importCatalog';
import { uploadHubListingImage } from '../services/firestoreData';
import { formatPKR } from '../utils/helpers';

interface BulkImportModalProps {
  onClose: () => void;
  createHubListing: (listing: Omit<HubListing, 'id' | 'rating' | 'reviewCount'>) => HubListing;
}

type RowStatus = 'pending' | 'uploading' | 'done' | 'error';

// Rough placeholder margin so cost price isn't a blank you must fill in by
// hand for every row - editable per row before importing, and easy to
// correct later via the normal Edit button once real supplier costs are known.
const estimateCostPrice = (salePrice: number) => Math.round((salePrice * 0.82) / 1000) * 1000;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, createHubListing }) => {
  const [files, setFiles] = useState<Record<number, File[]>>({});
  const [costPrices, setCostPrices] = useState<Record<number, string>>(() =>
    Object.fromEntries(IMPORT_CATALOG.map((e, i) => [i, String(estimateCostPrice(e.listing.sale_price))]))
  );
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});
  const [running, setRunning] = useState(false);

  const attachedCount = Object.values(files).filter((f) => f && f.length > 0).length;

  // One folder pick matches every photo to its listing by filename, instead
  // of attaching each photo one at a time - a listing can expect several
  // photos (multiple angles of the same real unit).
  const handleFolderPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const next: Record<number, File[]> = {};
    IMPORT_CATALOG.forEach((entry, i) => {
      const matches = entry.expectedFilenames
        .map((name) => picked.find((f) => f.name.toLowerCase() === name.toLowerCase()))
        .filter((f): f is File => !!f);
      if (matches.length) next[i] = matches;
    });
    setFiles((f) => ({ ...f, ...next }));
  };

  const handleImportAll = async () => {
    setRunning(true);
    for (let i = 0; i < IMPORT_CATALOG.length; i++) {
      const rowFiles = files[i];
      if (!rowFiles || rowFiles.length === 0) continue;
      setStatuses((s) => ({ ...s, [i]: 'uploading' }));
      try {
        const imageUrls = await Promise.all(rowFiles.map((file) => uploadHubListingImage(file)));
        const entry = IMPORT_CATALOG[i];
        const costPrice = Number(costPrices[i]) || 0;
        createHubListing({
          ...entry.listing,
          cost_price: costPrice,
          images: imageUrls,
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
              Pick the <code className="font-mono-spec">import_photos</code> folder once to attach every photo,
              then just review cost prices below (pre-filled as estimates) and import.
            </p>
          </div>
          <button onClick={onClose} className="text-xs text-on-surface-variant">✕</button>
        </div>

        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant rounded-xl p-4 text-xs font-bold text-steel-dark cursor-pointer hover:bg-surface-container-low">
          <FolderOpen className="w-4 h-4" />
          <span>Select the import_photos folder</span>
          <input
            type="file"
            // @ts-ignore - non-standard but supported in Chromium/Edge for folder picking
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFolderPick}
            className="hidden"
          />
        </label>

        <div className="space-y-2">
          {IMPORT_CATALOG.map((entry, i) => {
            const status = statuses[i];
            const rowFiles = files[i] || [];
            const expectedCount = entry.expectedFilenames.length;
            const hasAnyFile = rowFiles.length > 0;
            const fullyMatched = rowFiles.length === expectedCount;
            return (
              <div
                key={entry.expectedFilenames[0]}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border text-xs ${
                  hasAnyFile ? 'border-steel-tint bg-steel-tint/20' : 'border-outline-variant bg-surface-container-low'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{entry.listing.title}</p>
                  <p className="text-on-surface-variant">
                    Sale: <span className="price">{formatPKR(entry.listing.sale_price)}</span>
                    {' · '}
                    {hasAnyFile ? (
                      <span className={`font-semibold ${fullyMatched ? 'text-steel-dark' : 'text-copper-dark'}`}>
                        {rowFiles.length}/{expectedCount} photos matched
                      </span>
                    ) : (
                      <span className="text-error">no photos attached</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-on-surface-variant">Cost:</span>
                  <input
                    type="number"
                    value={costPrices[i] || ''}
                    onChange={(e) => setCostPrices((c) => ({ ...c, [i]: e.target.value }))}
                    className="w-28 bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1.5"
                  />
                </div>

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
            {attachedCount} of {IMPORT_CATALOG.length} listings have photos attached
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
