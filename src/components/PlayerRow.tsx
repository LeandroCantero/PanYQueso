import React from 'react';
import { Player, PositionColors, PositionLabels } from '../types';
import { Star, Pencil } from 'lucide-react';
import { calculatePlayerRating } from '../services/teamService';

interface PlayerRowProps {
    player: Player;
    onEdit: (player: Player) => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ player, onEdit }) => {
    const rating = calculatePlayerRating(player);

    return (
        <li className="flex items-center justify-between border-b-2 border-gray-200 pb-1 group hover:bg-gray-50 transition-colors">
            <span className="font-bold flex items-center gap-2 text-black">
                <span className={`w-8 h-6 flex items-center justify-center text-[10px] border border-black ${PositionColors[player.position]} text-black`}>
                    {PositionLabels[player.position]}
                </span>
                {player.name}
            </span>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.floor(rating) }).map((_, i) => (
                        <Star
                            key={i}
                            size={12}
                            fill="currentColor"
                            color="#000"
                            className="text-neo-yellow"
                        />
                    ))}
                    <span className="text-[10px] font-bold text-neo-black ml-0.5">{rating.toFixed(1)}</span>
                </div>
                <button
                    onClick={() => onEdit(player)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                    title="Editar"
                >
                    <Pencil size={14} className="text-black" />
                </button>
            </div>
        </li>
    );
};
