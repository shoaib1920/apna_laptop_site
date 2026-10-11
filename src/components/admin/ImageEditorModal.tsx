import React, { useEffect, useState } from 'react';
import Cropper, { Area, MediaSize, Point } from 'react-easy-crop';
import {
  Check,
  Contrast,
  Crop,
  Droplet,
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sun,
  Undo2,
  X
} from 'lucide-react';

interface ImageEditorModalProps {
  file: File;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
  // How many images are still waiting after this one (multi-upload).
  remaining?: number;
}

type Tool = 'crop' | 'rotate' | 'adjust';
type Adjustments = { brightness: number; contrast: number; saturation: number };

const ASPECTS: { label: string; value: number | 'original' }[] = [
  { label: 'Original', value: 'original' },
  { label: '4:5', value: 4 / 5 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 }
];

const DEFAULT_ADJUSTMENTS: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

// Longest side of the working canvas. Keeps big phone photos well under
// mobile browser canvas limits and produces a sensible upload size.
const MAX_OUTPUT_SIDE = 2000;

// Cloudinary's free plan rejects images over 10 MB.
const MAX_UPLOAD_BYTES = 9.5 * 1024 * 1024;

const filterCss = ({ brightness, contrast, saturation }: Adjustments) =>
  `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Renders the rotated/flipped/filtered image, then cuts out the crop area
// (react-easy-crop reports it relative to the rotated bounding box).
const renderEditedImage = async (
  src: string,
  area: Area,
  rotation: number,
  flip: { x: boolean; y: boolean },
  adjustments: Adjustments
): Promise<Blob | null> => {
  const image = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const boxWidth = Math.abs(Math.cos(rad)) * image.width + Math.abs(Math.sin(rad)) * image.height;
  const boxHeight = Math.abs(Math.sin(rad)) * image.width + Math.abs(Math.cos(rad)) * image.height;
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(area.width, area.height));

  const rotated = document.createElement('canvas');
  rotated.width = Math.round(boxWidth * scale);
  rotated.height = Math.round(boxHeight * scale);
  const rctx = rotated.getContext('2d');
  if (!rctx) return null;
  rctx.filter = filterCss(adjustments);
  rctx.translate(rotated.width / 2, rotated.height / 2);
  rctx.rotate(rad);
  rctx.scale((flip.x ? -1 : 1) * scale, (flip.y ? -1 : 1) * scale);
  rctx.translate(-image.width / 2, -image.height / 2);
  rctx.drawImage(image, 0, 0);

  const output = document.createElement('canvas');
  output.width = Math.round(area.width * scale);
  output.height = Math.round(area.height * scale);
  const octx = output.getContext('2d');
  if (!octx) return null;
  // Fill any empty corners left by straightening so the JPEG isn't black there.
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, output.width, output.height);
  octx.drawImage(
    rotated,
    Math.round(area.x * scale),
    Math.round(area.y * scale),
    output.width,
    output.height,
    0,
    0,
    output.width,
    output.height
  );

  return new Promise((resolve) => output.toBlob(resolve, 'image/jpeg', 0.92));
};

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ file, onCancel, onApply, remaining = 0 }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [tool, setTool] = useState<Tool>('crop');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectChoice, setAspectChoice] = useState<number | 'original'>('original');
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [straighten, setStraighten] = useState(0);
  const [flip, setFlip] = useState({ x: false, y: false });
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  const resetAll = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectChoice('original');
    setQuarterTurns(0);
    setStraighten(0);
    setFlip({ x: false, y: false });
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setMediaSize(null);
    setCroppedArea(null);
    setError('');
    resetAll();
    // react-easy-crop shows nothing for files the browser can't decode
    // (e.g. HEIC from some phones), so probe the file ourselves.
    const probe = new Image();
    probe.onerror = () =>
      setError("This file can't be opened. Please use a JPG, PNG or WEBP image (iPhone HEIC photos aren't supported here).");
    probe.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const rotation = quarterTurns * 90 + straighten;
  const isSideways = quarterTurns % 2 !== 0;
  const aspect =
    aspectChoice === 'original'
      ? mediaSize
        ? isSideways
          ? mediaSize.naturalHeight / mediaSize.naturalWidth
          : mediaSize.naturalWidth / mediaSize.naturalHeight
        : 4 / 5
      : aspectChoice;

  const isEdited =
    zoom !== 1 ||
    crop.x !== 0 ||
    crop.y !== 0 ||
    aspectChoice !== 'original' ||
    rotation !== 0 ||
    flip.x ||
    flip.y ||
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100;

  const handleDone = async () => {
    if (!croppedArea || !imageUrl) return;
    setIsApplying(true);
    setError('');
    try {
      const blob = await renderEditedImage(imageUrl, croppedArea, rotation, flip, adjustments);
      if (!blob) throw new Error('Could not process this image. Try a smaller photo.');
      await onApply(new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.jpg', { type: 'image/jpeg' }));
    } catch (err: any) {
      setError(err?.message || 'Could not process this image.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleUseOriginal = async () => {
    setIsApplying(true);
    setError('');
    try {
      if (file.size <= MAX_UPLOAD_BYTES || !mediaSize) {
        await onApply(file);
        return;
      }
      // Too big to upload as-is: re-encode the untouched full image.
      const fullArea = { x: 0, y: 0, width: mediaSize.naturalWidth, height: mediaSize.naturalHeight };
      const blob = await renderEditedImage(imageUrl, fullArea, 0, { x: false, y: false }, DEFAULT_ADJUSTMENTS);
      if (!blob) throw new Error('Could not process this image. Try a smaller photo.');
      await onApply(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setIsApplying(false);
    }
  };

  const toolButton = (id: Tool, label: string, Icon: React.FC<{ className?: string }>) => (
    <button
      type="button"
      onClick={() => setTool(id)}
      className={`flex flex-col items-center gap-1 px-4 py-1.5 text-[11px] font-semibold transition-colors ${
        tool === id ? 'text-[#c17a3d]' : 'text-white/60 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const adjustmentSlider = (key: keyof Adjustments, label: string, Icon: React.FC<{ className?: string }>) => (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-white/70 shrink-0" />
      <span className="w-20 text-[11px] text-white/80">{label}</span>
      <input
        type="range"
        min="50"
        max="150"
        step="1"
        value={adjustments[key]}
        onChange={(e) => setAdjustments((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        onDoubleClick={() => setAdjustments((prev) => ({ ...prev, [key]: 100 }))}
        aria-label={label}
        className="flex-1 accent-[#c17a3d]"
      />
      <span className="w-9 text-right text-[11px] tabular-nums text-white/80">
        {adjustments[key] - 100 > 0 ? '+' : ''}
        {adjustments[key] - 100}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center sm:p-4">
      <div className="w-full h-full sm:h-[90vh] sm:max-w-2xl bg-[#111] sm:rounded-2xl overflow-hidden flex flex-col text-white shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-40"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center min-w-0">
            <p className="text-sm font-bold truncate">Edit image</p>
            {remaining > 0 && <p className="text-[10px] text-white/50">{remaining} more after this</p>}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetAll}
              disabled={!isEdited || isApplying}
              className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30"
              title="Reset all edits"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={!croppedArea || isApplying}
              className="flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full bg-[#c17a3d] text-white text-xs font-bold disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 min-h-0 bg-black">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.3}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={(r) => setStraighten(Math.max(-45, Math.min(45, r - quarterTurns * 90)))}
              onCropComplete={(_, pixels) => setCroppedArea(pixels)}
              onMediaLoaded={setMediaSize}
              transform={`translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom * (flip.x ? -1 : 1)}, ${zoom * (flip.y ? -1 : 1)})`}
              style={{
                mediaStyle: { filter: filterCss(adjustments) },
                cropAreaStyle: { border: '2px solid rgba(255,255,255,0.9)' }
              }}
            />
          )}
        </div>

        {error && (
          <div className="px-4 py-2.5 bg-red-600/90 text-white text-xs font-semibold">{error}</div>
        )}

        {/* Tool controls */}
        <div className="px-4 pt-3 pb-2 border-t border-white/10 min-h-[112px] flex flex-col justify-center gap-3">
          {tool === 'crop' && (
            <>
              <div className="flex gap-2 overflow-x-auto scrollbar-none justify-start sm:justify-center">
                {ASPECTS.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => setAspectChoice(a.value)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      aspectChoice === a.value
                        ? 'bg-white text-black border-white'
                        : 'border-white/25 text-white/80 hover:border-white/60'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="w-12 text-[11px] text-white/70">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="flex-1 accent-[#c17a3d]"
                />
                <span className="w-9 text-right text-[11px] tabular-nums text-white/80">{zoom.toFixed(1)}x</span>
              </div>
            </>
          )}

          {tool === 'rotate' && (
            <>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuarterTurns((t) => (t + 3) % 4)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20"
                  title="Rotate left 90°"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setQuarterTurns((t) => (t + 1) % 4)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20"
                  title="Rotate right 90°"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFlip((f) => ({ ...f, x: !f.x }))}
                  className={`p-2.5 rounded-full ${flip.x ? 'bg-[#c17a3d] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Flip horizontal"
                >
                  <FlipHorizontal2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFlip((f) => ({ ...f, y: !f.y }))}
                  className={`p-2.5 rounded-full ${flip.y ? 'bg-[#c17a3d] text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Flip vertical"
                >
                  <FlipVertical2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-[11px] text-white/70">Straighten</span>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="0.5"
                  value={straighten}
                  onChange={(e) => setStraighten(Number(e.target.value))}
                  onDoubleClick={() => setStraighten(0)}
                  aria-label="Straighten"
                  className="flex-1 accent-[#c17a3d]"
                />
                <span className="w-9 text-right text-[11px] tabular-nums text-white/80">{straighten}°</span>
              </div>
            </>
          )}

          {tool === 'adjust' && (
            <div className="space-y-2">
              {adjustmentSlider('brightness', 'Brightness', Sun)}
              {adjustmentSlider('contrast', 'Contrast', Contrast)}
              {adjustmentSlider('saturation', 'Saturation', Droplet)}
            </div>
          )}
        </div>

        {/* Tool tabs */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleUseOriginal}
            disabled={isApplying}
            className="text-[11px] font-semibold text-white/60 hover:text-white disabled:opacity-40 px-1"
            title="Upload the photo exactly as it is"
          >
            Skip editing
          </button>
          <div className="flex items-center">
            {toolButton('crop', 'Crop', Crop)}
            {toolButton('rotate', 'Rotate', RotateCw)}
            {toolButton('adjust', 'Adjust', SlidersHorizontal)}
          </div>
          <span className="w-[72px]" />
        </div>
      </div>
    </div>
  );
};
