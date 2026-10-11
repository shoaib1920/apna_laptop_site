import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageZoomViewerProps {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}

const MAX_SCALE = 4;
const TAP_ZOOM = 2.5;

// Full-screen image viewer: tap/click to zoom into a spot, drag to pan,
// pinch to zoom on phones, swipe or arrows to change image.
export const ImageZoomViewer: React.FC<ImageZoomViewerProps> = ({ images, startIndex, alt, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
    startScale: number;
    pinchDistance: number;
    moved: boolean;
  } | null>(null);

  const count = images.length;

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const go = (next: number) => {
    if (count < 2) return;
    setIndex((next + count) % count);
    resetZoom();
  };

  const clampOffset = (x: number, y: number, s: number) => {
    const stage = stageRef.current;
    if (!stage) return { x, y };
    const maxX = ((s - 1) * stage.clientWidth) / 2;
    const maxY = ((s - 1) * stage.clientHeight) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  // Zoom so the given screen point stays under the finger/cursor.
  const zoomAt = (clientX: number, clientY: number, nextScale: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height / 2;
    const ratio = nextScale / scale;
    const x = px - (px - offset.x) * ratio;
    const y = py - (py - offset.y) * ratio;
    setScale(nextScale);
    setOffset(nextScale === 1 ? { x: 0, y: 0 } : clampOffset(x, y, nextScale));
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  });

  const distance = () => {
    const [a, b] = Array.from(pointers.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: offset,
      startScale: scale,
      pinchDistance: pointers.current.size === 2 ? distance() : 0,
      moved: pointers.current.size > 1
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size === 2 && g.pinchDistance > 0) {
      const nextScale = Math.max(1, Math.min(MAX_SCALE, (g.startScale * distance()) / g.pinchDistance));
      setScale(nextScale);
      setOffset((o) => (nextScale === 1 ? { x: 0, y: 0 } : clampOffset(o.x, o.y, nextScale)));
      g.moved = true;
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
    if (scale > 1) setOffset(clampOffset(g.startOffset.x + dx, g.startOffset.y + dy, scale));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g || pointers.current.size > 0) return;
    gesture.current = null;

    const dx = e.clientX - g.startX;
    if (!g.moved) {
      // Tap / click toggles zoom at that spot.
      zoomAt(e.clientX, e.clientY, scale > 1 ? 1 : TAP_ZOOM);
    } else if (scale === 1 && g.startScale === 1 && Math.abs(dx) > 50) {
      go(index + (dx < 0 ? 1 : -1));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const nextScale = Math.max(1, Math.min(MAX_SCALE, scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    zoomAt(e.clientX, e.clientY, nextScale);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col text-white" role="dialog" aria-label="Image viewer">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-bold text-white/70">{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (scale > 1 ? resetZoom() : setScale(TAP_ZOOM))}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label={scale > 1 ? 'Zoom out' : 'Zoom in'}
          >
            {scale > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`relative flex-1 min-h-0 overflow-hidden touch-none select-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: gesture.current ? 'none' : 'transform 0.2s ease-out'
          }}
        />

        {count > 1 && scale === 1 && (
          <>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-white/50 py-3">
        {scale > 1 ? 'Drag to look around · tap to zoom out' : 'Tap or pinch to zoom'}
      </p>
    </div>
  );
};
