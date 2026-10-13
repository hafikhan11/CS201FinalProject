import React, { useEffect, useState } from 'react';

const COLORS = ['#003366', '#6DAA4A', '#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FFA94D'];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Confetti({ active, count = 60 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }

    const newPieces = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: randomBetween(5, 95),
      delay: randomBetween(0, 0.8),
      duration: randomBetween(2, 3.5),
      size: randomBetween(6, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timer);
  }, [active, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.6 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
