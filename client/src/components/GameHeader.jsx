import React, { useEffect, useState } from 'react';

export default function GameHeader({ round, totalRounds, score, maxScore, playerName, startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const progressColor = pct >= 60 ? 'bg-dku-green' : pct >= 30 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="bg-dku-blue text-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Player + round */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-8 h-8 rounded-full bg-dku-green items-center justify-center font-bold text-sm flex-shrink-0">
            {playerName ? playerName[0].toUpperCase() : '?'}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-blue-200 truncate">{playerName || 'Player'}</div>
            <div className="text-sm font-bold">
              Round <span className="text-dku-green">{round}</span> / {totalRounds}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-center flex-shrink-0">
          <div className="text-xs text-blue-200">Score</div>
          <div className="text-xl font-extrabold tabular-nums">
            {score}
            <span className="text-sm font-normal text-blue-300"> / {maxScore}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-blue-200">Time</div>
          <div className="text-lg font-bold tabular-nums">{formatTime(elapsed)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-dku-blue-dark">
        <div
          className={`h-full ${progressColor} transition-all duration-500`}
          style={{ width: `${(round / totalRounds) * 100}%` }}
        />
      </div>

      {/* Round dots */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 justify-center flex-wrap">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < round - 1
                ? 'bg-dku-green'
                : i === round - 1
                ? 'bg-white scale-125'
                : 'bg-dku-blue-light opacity-60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
