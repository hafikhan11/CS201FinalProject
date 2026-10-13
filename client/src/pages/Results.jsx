import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ScoreBreakdown from '../components/ScoreBreakdown.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import Confetti from '../components/Confetti.jsx';

function getGrade(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 90) return { letter: 'S', label: 'Campus Legend', color: 'text-yellow-500', bg: 'bg-yellow-50' };
  if (pct >= 70) return { letter: 'A', label: 'Local Expert', color: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 50) return { letter: 'B', label: 'Getting Around', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 30) return { letter: 'C', label: 'Still Learning', color: 'text-amber-600', bg: 'bg-amber-50' };
  return { letter: 'D', label: 'Lost on Campus', color: 'text-red-600', bg: 'bg-red-50' };
}

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  if (!state) return null;

  const { playerName, totalScore, results } = state;
  const maxScore = (results?.length || 10) * 500;
  const grade = getGrade(totalScore, maxScore);
  const perfect = results?.filter((r) => r.points === 500).length || 0;
  const celebrate = totalScore >= maxScore * 0.7;

  const handlePlayAgain = () => {
    sessionStorage.removeItem('dku_player');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Confetti active={celebrate} count={100} />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-dku-blue to-dku-blue-dark text-white py-10 px-4 text-center">
        <div className="text-5xl mb-3">{celebrate ? '🎉' : '📍'}</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">{playerName}'s Results</h1>

        <div className={`inline-flex items-center gap-3 mt-4 px-6 py-3 rounded-2xl ${grade.bg}`}>
          <span className={`text-5xl font-black ${grade.color}`}>{grade.letter}</span>
          <div className="text-left">
            <div className={`font-bold text-lg ${grade.color}`}>{grade.label}</div>
            <div className="text-gray-600 text-sm">{totalScore.toLocaleString()} / {maxScore.toLocaleString()} pts</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mt-6 text-sm">
          <div>
            <div className="text-2xl font-extrabold text-dku-green">{perfect}</div>
            <div className="text-blue-200">Perfect rounds</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {Math.round((totalScore / maxScore) * 100)}%
            </div>
            <div className="text-blue-200">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-300">
              {results?.filter((r) => r.points === 300).length || 0}
            </div>
            <div className="text-blue-200">Building only</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Score breakdown */}
        <ScoreBreakdown results={results} />

        {/* Leaderboard */}
        <Leaderboard highlightName={playerName} highlightScore={totalScore} />

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-primary flex-1 py-3 text-base" onClick={handlePlayAgain}>
            Play Again
          </button>
          <a href="/admin" className="btn-secondary flex-1 py-3 text-base text-center">
            Admin Panel
          </a>
        </div>

        <div className="text-center text-gray-400 text-xs pb-4">
          Duke Kunshan University · Campus GeoGuesser
        </div>
      </div>
    </div>
  );
}
