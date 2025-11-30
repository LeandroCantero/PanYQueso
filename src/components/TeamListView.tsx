import React from 'react';
import { Team, Player } from '../types';
import { PlayerRow } from './PlayerRow';

interface TeamListViewProps {
    team: Team;
    onUpdate: (p: Player) => void;
}

export const TeamListView: React.FC<TeamListViewProps> = ({ team, onUpdate }) => (
    <div className={`flex-1 border-4 border-neo-black shadow-neo p-4 bg-white min-h-[400px]`}>
        <ul className="space-y-2">
            {team.players.map(p => (
                <PlayerRow key={p.id} player={p} onUpdate={onUpdate} />
            ))}
        </ul>
    </div>
);
