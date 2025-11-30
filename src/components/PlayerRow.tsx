import React, { useState } from 'react';
import { Player, PositionColors, PositionLabels } from '../types';
import { Star, Check, X, Pencil } from 'lucide-react';

interface PlayerRowProps {
    player: Player;
    onUpdate: (p: Player) => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ player, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(player.name);
    const [stars, setStars] = useState(player.stars);

    const handleSave = () => {
        if (name.trim()) {
            onUpdate({ ...player, name, stars });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setName(player.name);
        setStars(player.stars);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <li className="flex items-center justify-between border-b-2 border-gray-200 pb-1 bg-yellow-50 -mx-2 px-2 py-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-8 h-6 flex items-center justify-center text-[10px] border border-black ${PositionColors[player.position]} text-black flex-shrink-0`}>
                        {PositionLabels[player.position]}
                    </span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-b-2 border-black bg-transparent font-bold text-black focus:outline-none w-full min-w-0"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <div className="flex flex-shrink-0">
                        {[1, 2, 3, 4, 5].map(val => (
                            <Star
                                key={val}
                                size={12}
                                fill={val <= stars ? "currentColor" : "none"}
                                color="#000"
                                className={`cursor-pointer ${val <= stars ? 'text-neo-yellow' : 'text-gray-300'}`}
                                onClick={() => setStars(val)}
                            />
                        ))}
                    </div>
                    <button onClick={handleSave} className="p-1 hover:bg-green-200 rounded text-green-700 flex-shrink-0"><Check size={14} /></button>
                    <button onClick={handleCancel} className="p-1 hover:bg-red-200 rounded text-red-700 flex-shrink-0"><X size={14} /></button>
                </div>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between border-b-2 border-gray-200 pb-1 group hover:bg-gray-50 transition-colors">
            <span className="font-bold flex items-center gap-2 text-black">
                <span className={`w-8 h-6 flex items-center justify-center text-[10px] border border-black ${PositionColors[player.position]} text-black`}>
                    {PositionLabels[player.position]}
                </span>
                {player.name}
            </span>
            <div className="flex items-center gap-2">
                <div className="flex">
                    {Array.from({ length: player.stars }).map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" color="#000" className="text-neo-yellow" />
                    ))}
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                    title="Editar"
                >
                    <Pencil size={14} className="text-black" />
                </button>
            </div>
        </li>
    );
};
