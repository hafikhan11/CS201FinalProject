import React, { useEffect, useState } from 'react';

export default function Leaderboard({ highlightName, highlightScore }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load leaderboard.');
        setLoading(false);
      });
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8 text-gray-400">Loading leaderboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-4 text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-dku-blue mb-4 flex items-center gap-2">
        🏆 All-Time Leaderboard
        <span className="text-sm font-normal text-gray-400">Top 20</span>
      </h3>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No scores yet — be the first to play!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 text-gray-500 font-medium w-8">#</th>
                <th className="text-left py-2 pr-3 text-gray-500 font-medium">Player</th>
                <th className="text-right py-2 pr-3 text-gray-500 font-medium">Score</th>
                <th className="text-right py-2 text-gray-500 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const rank = i + 1;
                const isHighlighted =
                  highlightName &&
                  entry.player_name === highlightName &&
                  entry.total_score === highlightScore;

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-gray-100 transition-colors ${
                      isHighlighted ? 'bg-dku-green bg-opacity-10 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2 pr-3 text-center">
                      {typeof getMedal(rank) === 'string' ? (
                        <span className="text-base">{getMedal(rank)}</span>
                      ) : (
                        <span className="text-gray-400">{rank}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={isHighlighted ? 'text-dku-blue' : 'text-gray-700'}>
                        {entry.player_name}
                      </span>
                      {isHighlighted && (
                        <span className="ml-2 text-xs bg-dku-green text-white px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className={`font-bold tabular-nums ${rank <= 3 ? 'text-dku-blue' : 'text-gray-700'}`}>
                        {entry.total_score.toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-xs"> / 5000</span>
                    </td>
                    <td className="py-2 text-right text-gray-400 hidden sm:table-cell">
                      {formatDate(entry.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
