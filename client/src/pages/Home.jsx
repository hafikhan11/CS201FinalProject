import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your display name.'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (trimmed.length > 30) { setError('Name must be 30 characters or less.'); return; }
    sessionStorage.setItem('dku_player', trimmed);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dku-blue via-dku-blue-dark to-gray-900 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dku-green mb-4 shadow-lg">
          <span className="text-4xl">📍</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          DKU <span className="text-dku-green">GeoGuesser</span>
        </h1>
        <p className="mt-2 text-blue-200 text-lg">Do you know every corner of Duke Kunshan University?</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <form onSubmit={handleStart} className="space-y-5">
          <div>
            <label htmlFor="player-name" className="block text-sm font-semibold text-gray-700 mb-1">
              Your Display Name
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Alex Chen"
              maxLength={30}
              autoFocus
              className="w-full border-2 border-gray-200 focus:border-dku-blue rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 outline-none transition-colors text-base"
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-base">
            Start Game →
          </button>
        </form>

        {/* How it works */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">How it works</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-dku-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">You'll see a campus photo and must identify the location on an interactive map.</p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-dku-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">
                Click the correct building on the map. Earn <span className="font-bold text-dku-blue">300 pts</span> for the right building.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-dku-green text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">
                Then guess the floor! Get it right for the full <span className="font-bold text-dku-green">500 pts</span>.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">★</div>
              <p className="text-sm text-gray-600">
                10 rounds total. Max score: <span className="font-bold">5,000 points</span>. Top scores go on the leaderboard!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin link */}
      <div className="mt-6 text-center">
        <a href="/admin" className="text-blue-300 hover:text-white text-sm underline-offset-2 hover:underline transition-colors">
          Admin Panel
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-blue-300 text-xs text-center">
        Duke Kunshan University · Campus Challenge
      </div>
    </div>
  );
}
