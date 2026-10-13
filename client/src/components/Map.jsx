import React, { useState, useRef, useCallback, useEffect } from 'react';

// The campus map is defined in Java (server/map/CampusMap.java) and served by GET /api/map.
let mapDataPromise = null;
function loadMapData() {
  if (!mapDataPromise) {
    mapDataPromise = fetch('/api/map')
      .then((r) => r.json())
      .catch((err) => { mapDataPromise = null; throw err; });
  }
  return mapDataPromise;
}

export default function Map({ onSelect, selectedBuilding, correctBuilding, wrongBuilding, disabled }) {
  const [mapData, setMapData] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const svgRef = useRef(null);

  // Touch pinch-zoom state
  const lastPinchDist = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadMapData()
      .then((data) => { if (!cancelled) setMapData(data); })
      .catch(() => { if (!cancelled) setMapError(true); });
    return () => { cancelled = true; };
  }, []);

  const getBuildingFill = useCallback(
    (building) => {
      if (correctBuilding && building.name === correctBuilding) return '#16a34a';
      if (wrongBuilding && building.name === wrongBuilding) return '#dc2626';
      if (selectedBuilding && building.name === selectedBuilding) return '#003366';
      return null;
    },
    [selectedBuilding, correctBuilding, wrongBuilding]
  );

  const handleBuildingClick = (building) => {
    if (disabled) return;
    onSelect(building.name);
  };

  // Mouse pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.5), 4));
  };

  // Touch zoom
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastPinchDist.current != null) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / lastPinchDist.current;
      setScale((s) => Math.min(Math.max(s * ratio, 0.5), 4));
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && isPanning && panStart.current) {
      setPan({ x: e.touches[0].clientX - panStart.current.x, y: e.touches[0].clientY - panStart.current.y });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    lastPinchDist.current = null;
    panStart.current = null;
  };

  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border-2 border-dku-blue bg-white shadow-inner select-none">
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.25, 4))}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow text-lg font-bold hover:bg-gray-50 flex items-center justify-center"
          title="Zoom in"
        >+</button>
        <button
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.5))}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow text-lg font-bold hover:bg-gray-50 flex items-center justify-center"
          title="Zoom out"
        >−</button>
        <button
          onClick={handleReset}
          className="w-8 h-8 bg-white border border-gray-300 rounded shadow text-xs font-bold hover:bg-gray-50 flex items-center justify-center"
          title="Reset view"
        >⌂</button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-dku-blue text-white text-sm px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 220 }}
        >
          <div className="font-semibold">{tooltip.name}</div>
          {tooltip.short && <div className="text-xs text-blue-200">{tooltip.short}</div>}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-10 bg-white bg-opacity-90 rounded-lg px-2 py-1.5 text-xs space-y-0.5 shadow border border-gray-200">
        {correctBuilding && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
            <span>Correct location</span>
          </div>
        )}
        {wrongBuilding && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
            <span>Your guess</span>
          </div>
        )}
        {!correctBuilding && !wrongBuilding && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-dku-blue inline-block" />
            <span>Selected</span>
          </div>
        )}
        {mapData && mapData.legend.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block border border-gray-300" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <div
        className="overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none', height: 400 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!mapData ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            {mapError ? 'Could not load the campus map.' : 'Loading map…'}
          </div>
        ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${mapData.width} ${mapData.height}`}
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease',
          }}
        >
          {/* Map shapes: terrain, roads, water, buildings (drawn in Java's order) */}
          {mapData.marks.map((m, i) => (
            <path
              key={i}
              d={m.d}
              fill={m.fill || 'none'}
              fillRule={m.fillRule}
              stroke={m.stroke || 'none'}
              strokeWidth={m.stroke ? 1.5 : 0}
            />
          ))}

          {/* Building zones (clickable footprints from CampusMap.buildings) */}
          {mapData.buildings.map((building) => {
            const isSelected = selectedBuilding === building.name;
            const isCorrect = correctBuilding === building.name;
            const isWrong = wrongBuilding === building.name;
            const fill = getBuildingFill(building);

            return (
              <g
                key={building.name}
                className="map-zone"
                onClick={(e) => { e.stopPropagation(); handleBuildingClick(building); }}
                onMouseEnter={(e) => {
                  if (disabled) return;
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ name: building.name, short: building.description, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
              >
                <path
                  d={building.d}
                  fillRule={building.fillRule}
                  fill={fill || '#ffffff'}
                  fillOpacity={fill ? 0.55 : tooltip?.name === building.name ? 0.3 : 0}
                  stroke={isSelected || isCorrect || isWrong ? '#fff' : 'none'}
                  strokeWidth={isSelected || isCorrect || isWrong ? 4 : 0}
                />
              </g>
            );
          })}

          {/* Labels (pointer-events off so clicks reach the buildings) */}
          {mapData.labels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={l.y - ((l.lines.length - 1) / 2) * l.size * 1.15}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={l.size}
              fontWeight="bold"
              fill={mapData.ink}
              fontFamily="Arial, sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {l.lines.map((line, j) => (
                <tspan key={j} x={l.x} dy={j === 0 ? 0 : l.size * 1.15}>{line}</tspan>
              ))}
            </text>
          ))}

          {/* Checkmark on correct, X on wrong */}
          {mapData.buildings.map((building) => (
            (building.name === correctBuilding || building.name === wrongBuilding) && (
              <text
                key={`mark-${building.name}`}
                x={building.centerX}
                y={building.centerY - 30}
                textAnchor="middle"
                fontSize="36"
                fontWeight="bold"
                fill="white"
                stroke={building.name === correctBuilding ? '#16a34a' : '#dc2626'}
                strokeWidth="2"
                style={{ pointerEvents: 'none' }}
              >
                {building.name === correctBuilding ? '✓' : '✗'}
              </text>
            )
          ))}
        </svg>
        )}
      </div>

      {/* Scroll hint */}
      <div className="text-center text-xs text-gray-400 py-1 bg-gray-50 border-t border-gray-100">
        Scroll or pinch to zoom · Drag to pan · Click a building to guess
      </div>
    </div>
  );
}
