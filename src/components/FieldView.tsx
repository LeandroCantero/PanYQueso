import React, { useState, useRef, useEffect } from 'react';
import { Player, Position, PositionLabels, PositionColors } from '../types';

interface FieldViewProps {
  teamA: Player[]; // Left Team (Pan)
  teamB: Player[]; // Right Team (Queso)
  teamAColor?: string;
  teamATextColor?: string;
  teamBColor?: string;
  teamBTextColor?: string;
  onPlayerUpdate?: (player: Player) => void;
}

export const FieldView: React.FC<FieldViewProps> = ({
  teamA,
  teamB,
  teamAColor = 'bg-neo-red',
  teamATextColor = 'text-black',
  teamBColor = 'bg-neo-blue',
  teamBTextColor = 'text-white',
  onPlayerUpdate
}) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localPlayers, setLocalPlayers] = useState<Array<Player & { team: 'A' | 'B', currentLeft?: string, currentTop?: string }>>([]);

  // Initialize local state when props change, but only if not dragging
  useEffect(() => {
    if (!draggingId) {
      const situatedTeamA = processTeam(teamA, true);
      const situatedTeamB = processTeam(teamB, false);
      setLocalPlayers([
        ...situatedTeamA.map(p => ({ ...p, team: 'A' as const })),
        ...situatedTeamB.map(p => ({ ...p, team: 'B' as const }))
      ]);
    }
  }, [teamA, teamB, draggingId]);

  // Helper to calculate position on a HORIZONTAL pitch
  const getPositionStyle = (player: Player, index: number, totalInRole: number, isLeftTeam: boolean) => {
    let top = '50%';
    let left = '50%';

    // Vertical distribution (Top to Bottom) within the role column
    top = `${((index + 1) / (totalInRole + 1)) * 100}%`;

    if (isLeftTeam) {
      // Left Half (0% to 50% width)
      switch (player.position) {
        case Position.GK: left = '6%'; break;
        case Position.DEF: left = '18%'; break;
        case Position.MID: left = '32%'; break;
        case Position.FWD: left = '45%'; break;
      }
    } else {
      // Right Half (50% to 100% width)
      switch (player.position) {
        case Position.FWD: left = '55%'; break;
        case Position.MID: left = '68%'; break;
        case Position.DEF: left = '82%'; break;
        case Position.GK: left = '94%'; break;
      }
    }

    return { top, left };
  };

  const processTeam = (players: Player[], isLeftTeam: boolean) => {
    const grouped = players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || []).concat(p);
      return acc;
    }, {} as Record<Position, Player[]>);

    return players.map(p => {
      // If player has saved coordinates, use them. Otherwise calculate formation.
      if (p.x !== undefined && p.y !== undefined) {
        return { ...p, coords: { left: `${p.x}%`, top: `${p.y}%` } };
      }

      const roleGroup = grouped[p.position];
      const indexInRole = roleGroup.indexOf(p);
      const coords = getPositionStyle(p, indexInRole, roleGroup.length, isLeftTeam);
      return { ...p, coords };
    });
  };

  const handleMouseDown = (e: React.MouseEvent, player: Player) => {
    if (!onPlayerUpdate) return;
    e.preventDefault();
    setDraggingId(player.id);

    // Calculate offset to keep cursor relative to token center
    // For simplicity, we'll center the token on the cursor for now or just track delta
    // But since we are mapping to zones, exact pixel offset matters less than the zone drop
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain to field
    let xPercent = (x / rect.width) * 100;
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Update local visual state
    setLocalPlayers(prev => prev.map(p => {
      if (p.id === draggingId) {
        // Determine new position based on X zone
        let newPos = p.position;
        const isTeamA = p.team === 'A';

        // Constrain X to team half
        if (isTeamA) {
          xPercent = Math.max(0, Math.min(50, xPercent));
        } else {
          xPercent = Math.max(50, Math.min(100, xPercent));
        }

        // Zone thresholds
        if (isTeamA) {
          if (xPercent < 12) newPos = Position.GK;
          else if (xPercent < 25) newPos = Position.DEF;
          else if (xPercent < 40) newPos = Position.MID;
          else if (xPercent < 50) newPos = Position.FWD;
          // Don't allow crossing to other team's side for now (or maybe just clamp)
        } else {
          if (xPercent > 88) newPos = Position.GK;
          else if (xPercent > 75) newPos = Position.DEF;
          else if (xPercent > 60) newPos = Position.MID;
          else if (xPercent > 50) newPos = Position.FWD;
        }

        return {
          ...p,
          position: newPos, // Update position label live
          currentLeft: `${xPercent}%`,
          currentTop: `${yPercent}%`
        };
      }
      return p;
    }));
  };

  const handleMouseUp = () => {
    if (!draggingId) return;

    const player = localPlayers.find(p => p.id === draggingId);
    if (player && onPlayerUpdate) {
      onPlayerUpdate({
        id: player.id,
        name: player.name,
        stars: player.stars,
        position: player.position, // This is the new position calculated in MouseMove
        x: parseFloat((player.currentLeft || player.coords?.left || '0').replace('%', '')),
        y: parseFloat((player.currentTop || player.coords?.top || '0').replace('%', ''))
      });
    }
    setDraggingId(null);
  };

  return (
    <div
      id="field-canvas"
      ref={fieldRef}
      className="relative w-full aspect-[1.6] min-h-[450px] bg-neo-green border-4 border-neo-black shadow-neo-lg overflow-hidden mb-4 rounded-lg select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >

      {/* --- Horizontal Field Markings --- */}
      <div className="absolute inset-4 border-4 border-white opacity-50 pointer-events-none"></div>
      <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-white opacity-50 -translate-x-1/2 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-4 -translate-y-1/2 h-1/2 w-32 border-4 border-l-0 border-white opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-4 -translate-y-1/2 h-1/4 w-12 border-4 border-l-0 border-white opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 h-1/2 w-32 border-4 border-r-0 border-white opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 h-1/4 w-12 border-4 border-r-0 border-white opacity-50 pointer-events-none"></div>

      {/* --- Players --- */}
      {localPlayers.map((p) => {
        // If dragging, use currentLeft/Top, else use calculated coords
        const top = (p.id === draggingId && p.currentTop) ? p.currentTop : (p.coords?.top || '50%');
        const left = (p.id === draggingId && p.currentLeft) ? p.currentLeft : (p.coords?.left || '50%');
        const isDragging = p.id === draggingId;

        return (
          <div
            key={p.id}
            onMouseDown={(e) => handleMouseDown(e, p)}
            className={`absolute flex flex-col items-center justify-center z-10 w-20 cursor-grab active:cursor-grabbing ${!isDragging ? 'transition-all duration-700 ease-out' : ''}`}
            style={{ top, left, transform: 'translate(-50%, -50%)', zIndex: isDragging ? 50 : 10 }}
          >
            {/* Token with Position */}
            <div className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center font-black text-xs ${p.team === 'A' ? teamAColor : teamBColor} ${p.team === 'A' ? teamATextColor : teamBTextColor} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-20`}>
              {PositionLabels[p.position]}
            </div>

            {/* Name Label */}
            <div className={`mt-1 border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-[120px] z-10 flex items-center justify-center ${p.team === 'A' ? teamAColor : teamBColor}`}>
              <span className={`text-xs font-bold whitespace-nowrap uppercase tracking-tight ${p.team === 'A' ? teamATextColor : teamBTextColor}`}>
                {p.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};