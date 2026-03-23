import React from 'react';
import { Player, PositionColors, PositionLabels } from '../types';
import { Trash2, Edit2, Star } from 'lucide-react';
import { calculatePlayerRating } from '../services/teamService';

interface PlayerCardProps {
  player: Player;
  onDelete: (id: string) => void;
  onEdit: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onDelete, onEdit }) => {
  const rating = calculatePlayerRating(player);

  return (
    <div className="flex items-center justify-between bg-white border-4 border-neo-black shadow-neo-sm p-3 mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 flex items-center justify-center border-2 border-neo-black font-bold text-xs ${PositionColors[player.position]} text-neo-black`}>
          {PositionLabels[player.position]}
        </div>
        <div>
          <h3 className="font-bold text-lg leading-none text-neo-black">{player.name}</h3>
          <div className="flex items-center gap-0.5 text-neo-yellow">
            {Array.from({ length: Math.floor(rating) }).map((_, i) => (
              <Star
                key={i}
                size={14}
                fill="currentColor"
                color="#000"
                className="text-neo-yellow"
              />
            ))}
            <span className="text-xs font-bold text-neo-black ml-0.5">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(player)}
          className="p-2 border-2 border-neo-black bg-neo-white text-neo-black hover:bg-gray-200 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-neo-blue"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              const nextButton = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextButton) nextButton.focus();
            }
          }}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(player.id)}
          className="p-2 border-2 border-neo-black bg-neo-red text-neo-black hover:bg-red-400 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-neo-blue"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const prevButton = e.currentTarget.previousElementSibling as HTMLElement;
              if (prevButton) prevButton.focus();
            }
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};