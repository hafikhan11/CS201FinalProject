import React, { useState, useRef } from 'react';

export default function PhotoViewer({ src, alt, hint, roundNumber, totalRounds }) {
  const [scale, setScale] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [imgError, setImgError] = useState(false);
  const lastPinchDist = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      panStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current != null) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / lastPinchDist.current;
      setScale((s) => Math.min(Math.max(s * ratio, 1), 4));
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPan({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastPinchDist.current = null;
    if (scale <= 1) setPan({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    setScale((s) => {
      const next = Math.min(Math.max(s * delta, 1), 4);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div className="relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-lg">
      {/* Image container */}
      <div
        className="relative overflow-hidden"
        style={{ height: '380px', touchAction: 'none', cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 text-sm">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <div>Image not found</div>
              <div className="text-xs mt-1 opacity-60">{src}</div>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={alt || 'Campus location'}
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              userSelect: 'none',
              WebkitUserDrag: 'none',
            }}
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}

        {/* Zoom indicator */}
        {scale > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
            {Math.round(scale * 100)}% · double-tap to reset
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-dku-blue px-4 py-2 flex items-center justify-between">
        <div className="text-white text-sm font-medium">
          Where was this photo taken?
        </div>
        <div className="flex items-center gap-2">
          {hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs bg-dku-green hover:bg-dku-green-light text-white px-3 py-1 rounded-full transition-colors"
            >
              {showHint ? 'Hide hint' : '💡 Hint'}
            </button>
          )}
          <div className="text-xs text-blue-200">Pinch/scroll to zoom</div>
        </div>
      </div>

      {/* Hint panel */}
      {showHint && hint && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-sm text-amber-800">
          <span className="font-semibold">Hint:</span> {hint}
        </div>
      )}
    </div>
  );
}
