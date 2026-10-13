import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHeader from '../components/GameHeader.jsx';
import PhotoViewer from '../components/PhotoViewer.jsx';
import Map from '../components/Map.jsx';
import FloorSelector from '../components/FloorSelector.jsx';
import Confetti from '../components/Confetti.jsx';

const TOTAL_ROUNDS = 10;

// Game phases
const PHASE = {
  LOADING: 'loading',
  GUESSING_BUILDING: 'guessing_building',
  RESULT_WRONG: 'result_wrong',
  GUESSING_FLOOR: 'guessing_floor',
  RESULT_FLOOR: 'result_floor',
  SUBMITTING: 'submitting',
  ERROR: 'error',
};

export default function Game() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [rounds, setRounds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [guessResult, setGuessResult] = useState(null);   // { correct, correctBuilding, points, floors }
  const [floorResult, setFloorResult] = useState(null);   // { correct, correctFloor, points }
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);             // per-round results accumulated
  const [showConfetti, setShowConfetti] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const startTimeRef = useRef(Date.now());
  const roundStartRef = useRef(Date.now());

  // ── Init ───────────────────────────────────────────────────────────
  useEffect(() => {
    const name = sessionStorage.getItem('dku_player');
    if (!name) { navigate('/'); return; }
    setPlayerName(name);

    fetch('/api/game/start')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setErrorMsg(data.error); setPhase(PHASE.ERROR); return; }
        setRounds(data.rounds);
        setPhase(PHASE.GUESSING_BUILDING);
        roundStartRef.current = Date.now();
      })
      .catch(() => { setErrorMsg('Failed to connect to server.'); setPhase(PHASE.ERROR); });
  }, [navigate]);

  const currentRound = rounds[currentIndex];

  // ── Guess building ─────────────────────────────────────────────────
  const handleConfirmGuess = useCallback(async () => {
    if (!selectedBuilding || !currentRound) return;
    setPhase(PHASE.SUBMITTING);

    try {
      const res = await fetch('/api/game/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: currentRound.id, buildingGuess: selectedBuilding }),
      });
      const data = await res.json();
      setGuessResult(data);

      if (data.correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        setPhase(PHASE.GUESSING_FLOOR);
      } else {
        setPhase(PHASE.RESULT_WRONG);
        setResults((prev) => [...prev, {
          roundId: currentRound.id,
          correctBuilding: data.correctBuilding,
          yourBuilding: selectedBuilding,
          correctFloor: null,
          yourFloor: null,
          points: 0,
        }]);
        setScore((s) => s + 0);
      }
    } catch {
      setPhase(PHASE.GUESSING_BUILDING);
    }
  }, [selectedBuilding, currentRound]);

  // ── Guess floor ────────────────────────────────────────────────────
  const handleFloorSelect = useCallback(async (floor) => {
    if (!currentRound) return;
    setPhase(PHASE.SUBMITTING);

    try {
      const res = await fetch('/api/game/guess-floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: currentRound.id, floorGuess: floor }),
      });
      const data = await res.json();
      setFloorResult(data);

      if (data.correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4500);
      }

      setResults((prev) => [...prev, {
        roundId: currentRound.id,
        correctBuilding: guessResult.correctBuilding,
        yourBuilding: selectedBuilding,
        correctFloor: data.correctFloor,
        yourFloor: floor,
        points: data.points,
      }]);
      setScore((s) => s + data.points);
      setPhase(PHASE.RESULT_FLOOR);
    } catch {
      setPhase(PHASE.GUESSING_FLOOR);
    }
  }, [currentRound, guessResult, selectedBuilding]);

  // ── Next round / finish ────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= rounds.length || nextIndex >= TOTAL_ROUNDS) {
      // Game over — save score
      const finalResults = [...results];
      const finalScore = finalResults.reduce((s, r) => s + r.points, 0);

      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName, totalScore: finalScore, roundDetails: finalResults }),
        });
      } catch {
        console.warn('Could not save score to leaderboard');
      }

      navigate('/results', {
        state: { playerName, totalScore: finalScore, results: finalResults },
      });
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedBuilding(null);
    setGuessResult(null);
    setFloorResult(null);
    setPhase(PHASE.GUESSING_BUILDING);
    roundStartRef.current = Date.now();
  }, [currentIndex, rounds.length, results, playerName, navigate]);

  // ── Render ─────────────────────────────────────────────────────────
  if (phase === PHASE.LOADING) {
    return (
      <div className="min-h-screen bg-dku-blue flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-5xl mb-4 animate-bounce">📍</div>
          <div className="text-xl font-semibold">Loading game…</div>
        </div>
      </div>
    );
  }

  if (phase === PHASE.ERROR) {
    return (
      <div className="min-h-screen bg-dku-blue flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Could not start game</h2>
          <p className="text-gray-600 text-sm mb-5">{errorMsg}</p>
          <p className="text-gray-500 text-xs mb-5">
            Make sure the server is running and you've added rounds in the <a href="/admin" className="underline">Admin Panel</a>.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    );
  }

  const isLastRound = currentIndex === Math.min(rounds.length, TOTAL_ROUNDS) - 1;
  const roundNum = currentIndex + 1;

  const mapDisabled = phase !== PHASE.GUESSING_BUILDING;
  const correctBldg = guessResult ? guessResult.correctBuilding : null;
  const wrongBldg =
    (phase === PHASE.RESULT_WRONG || phase === PHASE.RESULT_FLOOR || phase === PHASE.GUESSING_FLOOR) &&
    !guessResult?.correct
      ? selectedBuilding
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Confetti active={showConfetti} count={80} />

      <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
        {/* Header */}
        <GameHeader
          round={roundNum}
          totalRounds={Math.min(rounds.length, TOTAL_ROUNDS)}
          score={score}
          maxScore={roundNum * 500}
          playerName={playerName}
          startTime={startTimeRef.current}
        />

        {/* Photo */}
        {currentRound && (
          <PhotoViewer
            src={currentRound.image_path}
            alt={`Round ${roundNum} location`}
            hint={currentRound.hint}
            roundNumber={roundNum}
            totalRounds={TOTAL_ROUNDS}
          />
        )}

        {/* Phase-specific UI */}
        {phase === PHASE.GUESSING_BUILDING && (
          <div className="card space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-dku-blue">Click the building on the map</h2>
              <p className="text-sm text-gray-500">Where was this photo taken?</p>
            </div>
            <Map
              onSelect={setSelectedBuilding}
              selectedBuilding={selectedBuilding}
              disabled={false}
            />
            <button
              className="btn-primary w-full py-3 text-base"
              disabled={!selectedBuilding}
              onClick={handleConfirmGuess}
            >
              {selectedBuilding ? `Confirm: ${selectedBuilding}` : 'Select a building first'}
            </button>
          </div>
        )}

        {phase === PHASE.SUBMITTING && (
          <div className="card text-center py-6">
            <div className="text-2xl animate-spin inline-block mb-2">⚙️</div>
            <div className="text-gray-500">Checking answer…</div>
          </div>
        )}

        {phase === PHASE.RESULT_WRONG && guessResult && (
          <div className="card space-y-4">
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="text-3xl mb-2">❌</div>
              <h2 className="text-lg font-bold text-red-700">Wrong building!</h2>
              <p className="text-sm text-gray-600 mt-1">
                The photo was taken at <strong>{guessResult.correctBuilding}</strong>.
              </p>
              <div className="mt-3 text-2xl font-extrabold text-red-600">0 / 500 pts</div>
            </div>
            <Map
              onSelect={() => {}}
              selectedBuilding={null}
              correctBuilding={correctBldg}
              wrongBuilding={selectedBuilding}
              disabled={true}
            />
            <button className="btn-primary w-full py-3" onClick={handleNext}>
              {isLastRound ? 'See Final Results →' : 'Next Round →'}
            </button>
          </div>
        )}

        {phase === PHASE.GUESSING_FLOOR && guessResult && (
          <div className="card space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl mb-2">✅</div>
              <h2 className="text-lg font-bold text-green-700">Correct building! +300 pts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Now guess which floor the photo was taken on.
              </p>
            </div>
            <Map
              onSelect={() => {}}
              selectedBuilding={selectedBuilding}
              disabled={true}
            />
            <FloorSelector
              floors={guessResult.floors}
              onSelect={handleFloorSelect}
              disabled={false}
            />
          </div>
        )}

        {phase === PHASE.RESULT_FLOOR && floorResult && (
          <div className="card space-y-4">
            {floorResult.correct ? (
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200 pulse-correct">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-xl font-extrabold text-green-700">Perfect!</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Correct building <em>and</em> floor — full marks!
                </p>
                <div className="mt-3 text-3xl font-extrabold text-green-600">500 / 500 pts</div>
              </div>
            ) : (
              <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-3xl mb-2">😅</div>
                <h2 className="text-lg font-bold text-amber-700">Close! Wrong floor.</h2>
                <p className="text-sm text-gray-600 mt-1">
                  The correct floor was <strong>{floorResult.correctFloor}</strong>.
                </p>
                <div className="mt-3 text-2xl font-extrabold text-amber-600">300 / 500 pts</div>
              </div>
            )}
            <Map
              onSelect={() => {}}
              selectedBuilding={selectedBuilding}
              disabled={true}
            />
            <button className="btn-primary w-full py-3 text-base" onClick={handleNext}>
              {isLastRound ? 'See Final Results →' : 'Next Round →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
