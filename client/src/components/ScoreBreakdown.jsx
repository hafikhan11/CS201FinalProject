import React from 'react';

export default function ScoreBreakdown({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-dku-blue mb-4">Round Breakdown</h3>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
              r.points === 500
                ? 'bg-green-50 border border-green-200'
                : r.points === 300
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {/* Round number */}
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 text-white
              ${r.points === 500 ? 'bg-green-500' : r.points === 300 ? 'bg-amber-500' : 'bg-red-500'}
            `}>
              {i + 1}
            </div>

            {/* Building & floor */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 truncate">{r.correctBuilding}</div>
              <div className="text-xs text-gray-500">
                Floor: {r.correctFloor}
                {r.yourBuilding && r.yourBuilding !== r.correctBuilding && (
                  <span className="ml-2 text-red-500">You guessed: {r.yourBuilding}</span>
                )}
              </div>
            </div>

            {/* Points badge */}
            <div className={`
              flex-shrink-0 font-bold text-sm px-2 py-0.5 rounded-full
              ${r.points === 500 ? 'bg-green-500 text-white' : r.points === 300 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}
            `}>
              {r.points === 500 ? '⭐ 500' : r.points === 300 ? '✓ 300' : '✗ 0'}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-green-600 font-semibold">
            ⭐ {results.filter((r) => r.points === 500).length} perfect
          </span>
          <span className="text-amber-600 font-semibold">
            ✓ {results.filter((r) => r.points === 300).length} building
          </span>
          <span className="text-red-500 font-semibold">
            ✗ {results.filter((r) => r.points === 0).length} miss
          </span>
        </div>
        <div className="font-bold text-dku-blue">
          {results.reduce((s, r) => s + r.points, 0)} / {results.length * 500}
        </div>
      </div>
    </div>
  );
}
