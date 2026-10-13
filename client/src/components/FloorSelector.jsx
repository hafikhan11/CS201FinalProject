import React, { useState } from 'react';

const FLOOR_ORDER = ['B2', 'B1', '1F', '2F', '3F', '4F', '5F', '6F', 'Rooftop'];

function sortFloors(floors) {
  return [...floors].sort((a, b) => {
    const ia = FLOOR_ORDER.indexOf(a);
    const ib = FLOOR_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export default function FloorSelector({ floors, onSelect, disabled }) {
  const [selected, setSelected] = useState(null);

  const sorted = sortFloors(floors);

  const handleSelect = (floor) => {
    if (disabled) return;
    setSelected(floor);
    onSelect(floor);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 font-medium text-center">
        Which floor was this photo taken on?
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {sorted.map((floor) => (
          <button
            key={floor}
            onClick={() => handleSelect(floor)}
            disabled={disabled}
            className={`
              min-w-[64px] py-2 px-4 rounded-lg font-semibold text-sm border-2 transition-all duration-150
              ${selected === floor
                ? 'bg-dku-blue border-dku-blue text-white shadow-md scale-105'
                : 'bg-white border-gray-300 text-gray-700 hover:border-dku-blue hover:text-dku-blue'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {floor}
          </button>
        ))}
      </div>
    </div>
  );
}
