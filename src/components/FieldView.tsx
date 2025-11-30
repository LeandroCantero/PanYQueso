import React, { useState, useRef, useEffect } from 'react';
import { Player, Position, PositionLabels, PositionColors } from '../types';

interface FieldViewProps {
  teamA: Player[]; // Left/Top Team (Pan)
  teamB: Player[]; // Right/Bottom Team (Queso)
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
  const [localPlayers, setLocalPlayers] = useState<Array<Player & { team: 'A' | 'B', currentLeft?: string, currentTop?: string }>>([]);
  const [isVertical, setIsVertical] = useState(false);

  // Detect Mobile/Vertical Layout
  useEffect(() => {
    const checkLayout = () => {
      setIsVertical(window.innerWidth < 768); // md breakpoint
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  // Initialize local state when props or layout change
  useEffect(() => {
    if (!draggingId) {
      const situatedTeamA = processTeam(teamA, true, isVertical);
      const situatedTeamB = processTeam(teamB, false, isVertical);
      setLocalPlayers([
        ...situatedTeamA.map(p => ({ ...p, team: 'A' as const })),
        ...situatedTeamB.map(p => ({ ...p, team: 'B' as const }))
      ]);
    }
  }, [teamA, teamB, draggingId, isVertical]);

  // Helper to calculate position
  const getPositionStyle = (player: Player, index: number, totalInRole: number, isLeftTeam: boolean, vertical: boolean) => {
    // Default center
    let posPrimary = '50%'; // The axis of the field length (X in horiz, Y in vert)
    let posSecondary = '50%'; // The axis of distribution (Y in horiz, X in vert)

    // Distribution within the role line
    posSecondary = `${((index + 1) / (totalInRole + 1)) * 100}%`;

    if (vertical) {
      // VERTICAL: Primary is Y (Top), Secondary is X (Left)
      if (isLeftTeam) {
        // Top Team (Team A)
        switch (player.position) {
          case Position.GK: posPrimary = '8%'; break;
          case Position.DEF: posPrimary = '20%'; break;
          case Position.MID: posPrimary = '32%'; break;
          case Position.FWD: posPrimary = '42%'; break;
        }
      } else {
        // Bottom Team (Team B)
        switch (player.position) {
          case Position.FWD: posPrimary = '58%'; break;
          case Position.MID: posPrimary = '68%'; break;
          case Position.DEF: posPrimary = '80%'; break;
          case Position.GK: posPrimary = '92%'; break;
        }
      }
      return { top: posPrimary, left: posSecondary };
    } else {
      // HORIZONTAL: Primary is X (Left), Secondary is Y (Top)
      if (isLeftTeam) {
        // Left Team
        switch (player.position) {
          case Position.GK: posPrimary = '6%'; break;
          case Position.DEF: posPrimary = '18%'; break;
          case Position.MID: posPrimary = '30%'; break;
          case Position.FWD: posPrimary = '42%'; break;
        }
      } else {
        // Right Team
        switch (player.position) {
          case Position.FWD: posPrimary = '58%'; break;
          case Position.MID: posPrimary = '70%'; break;
          case Position.DEF: posPrimary = '82%'; break;
          case Position.GK: posPrimary = '94%'; break;
        }
      }
      return { top: posSecondary, left: posPrimary };
    }
  };

  const processTeam = (players: Player[], isLeftTeam: boolean, vertical: boolean) => {
    const grouped = players.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || []).concat(p);
      return acc;
    }, {} as Record<Position, Player[]>);

    return players.map(p => {
      // If player has saved coordinates, use them. 
      // NOTE: Saved coords are likely in % relative to the view they were saved in.
      // If we switch views, we might want to re-calculate or transform them.
      // For now, if we switch orientation, we force re-calculation to avoid players jumping to weird spots.
      // Ideally, we'd store "logical" positions (e.g. "GK") and calculate render coords.
      // But since we support drag-and-drop, we have explicit coords.
      // A simple heuristic: if we have explicit coords, we try to respect them, 
      // BUT if the aspect ratio flips, those % might look wrong.
      // Let's just re-calculate standard formation on orientation change for now to keep it clean.

      const roleGroup = grouped[p.position];
      const indexInRole = roleGroup.indexOf(p);
      const coords = getPositionStyle(p, indexInRole, roleGroup.length, isLeftTeam, vertical);
      return { ...p, coords };
    });
  };

  // --- Dragging Logic (Shared) ---

  const startDrag = (id: string) => {
    if (!onPlayerUpdate) return;
    setDraggingId(id);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingId || !fieldRef.current) return;

    const rect = fieldRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Constrain to field
    let xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    let yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Update local visual state
    setLocalPlayers(prev => prev.map(p => {
      if (p.id === draggingId) {
        let newPos = p.position;
        const isTeamA = p.team === 'A';

        if (isVertical) {
          // VERTICAL LOGIC
          // Constrain Y to team half
          if (isTeamA) {
            yPercent = Math.max(0, Math.min(50, yPercent));
            // Zones (Top to Bottom) - Thresholds: 14, 26, 38
            if (yPercent < 14) newPos = Position.GK;
            else if (yPercent < 26) newPos = Position.DEF;
            else if (yPercent < 38) newPos = Position.MID;
            else if (yPercent < 50) newPos = Position.FWD;
          } else {
            yPercent = Math.max(50, Math.min(100, yPercent));
            // Zones (Top to Bottom) - Thresholds: 62, 74, 86
            if (yPercent > 86) newPos = Position.GK;
            else if (yPercent > 74) newPos = Position.DEF;
            else if (yPercent > 62) newPos = Position.MID;
            else if (yPercent > 50) newPos = Position.FWD;
          }

        } else {
          // HORIZONTAL LOGIC
          // Constrain X to team half
          if (isTeamA) {
            xPercent = Math.max(0, Math.min(50, xPercent));
            // Zones (Left to Right)
            if (xPercent < 12) newPos = Position.GK;
            else if (xPercent < 25) newPos = Position.DEF;
            else if (xPercent < 40) newPos = Position.MID;
            else if (xPercent < 50) newPos = Position.FWD;
          } else {
            xPercent = Math.max(50, Math.min(100, xPercent));
            // Zones (Left to Right)
            if (xPercent > 88) newPos = Position.GK;
            else if (xPercent > 75) newPos = Position.DEF;
            else if (xPercent > 60) newPos = Position.MID;
            else if (xPercent > 50) newPos = Position.FWD;
          }
        }

        return {
          ...p,
          position: newPos,
          currentLeft: `${xPercent}%`,
          currentTop: `${yPercent}%`
        };
      }
      return p;
    }));
  };

  const endDrag = () => {
    if (!draggingId) return;

    const player = localPlayers.find(p => p.id === draggingId);
    if (player && onPlayerUpdate) {
      onPlayerUpdate({
        id: player.id,
        name: player.name,
        stars: player.stars,
        position: player.position,
        x: parseFloat((player.currentLeft || player.coords?.left || '0').replace('%', '')),
        y: parseFloat((player.currentTop || player.coords?.top || '0').replace('%', ''))
      });
    }
    setDraggingId(null);
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent, player: Player) => {
    e.preventDefault();
    startDrag(player.id);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    moveDrag(e.clientX, e.clientY);
  };
  const handleMouseUp = () => {
    endDrag();
  };

  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent, player: Player) => {
    // Prevent default to stop scrolling immediately when touching a player token
    if (e.cancelable) e.preventDefault();
    startDrag(player.id);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingId) {
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }
  };
  const handleTouchEnd = () => {
    endDrag();
  };


  return (
    <div
      id="field-canvas"
      ref={fieldRef}
      className={`relative w-full bg-neo-green border-4 border-neo-black shadow-neo-lg overflow-hidden mb-4 rounded-lg select-none transition-all duration-500 ${isVertical ? 'aspect-[0.6] min-h-[600px]' : 'aspect-[1.6] min-h-[450px]'}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >

      {/* --- Field Markings --- */}
      <div className="absolute inset-4 border-4 border-white opacity-50 pointer-events-none"></div>

      {/* Center Line */}
      <div className={`absolute bg-white opacity-50 pointer-events-none ${isVertical ? 'top-1/2 left-4 right-4 h-1 -translate-y-1/2' : 'left-1/2 top-4 bottom-4 w-1 -translate-x-1/2'}`}></div>

      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"></div>

      {/* Areas (Boxes) */}
      {isVertical ? (
        <>
          {/* Top Area */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 h-32 border-4 border-t-0 border-white opacity-50 pointer-events-none"></div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/4 h-12 border-4 border-t-0 border-white opacity-50 pointer-events-none"></div>

          {/* Bottom Area */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-32 border-4 border-b-0 border-white opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/4 h-12 border-4 border-b-0 border-white opacity-50 pointer-events-none"></div>
        </>
      ) : (
        <>
          {/* Left Area */}
          <div className="absolute top-1/2 left-4 -translate-y-1/2 h-1/2 w-32 border-4 border-l-0 border-white opacity-50 pointer-events-none"></div>
          <div className="absolute top-1/2 left-4 -translate-y-1/2 h-1/4 w-12 border-4 border-l-0 border-white opacity-50 pointer-events-none"></div>

          {/* Right Area */}
          <div className="absolute top-1/2 right-4 -translate-y-1/2 h-1/2 w-32 border-4 border-r-0 border-white opacity-50 pointer-events-none"></div>
          <div className="absolute top-1/2 right-4 -translate-y-1/2 h-1/4 w-12 border-4 border-r-0 border-white opacity-50 pointer-events-none"></div>
        </>
      )}

      {/* --- Players --- */}
      {localPlayers.map((p) => {
        const top = (p.id === draggingId && p.currentTop) ? p.currentTop : (p.coords?.top || '50%');
        const left = (p.id === draggingId && p.currentLeft) ? p.currentLeft : (p.coords?.left || '50%');
        const isDragging = p.id === draggingId;

        return (
          <div
            key={p.id}
            onMouseDown={(e) => handleMouseDown(e, p)}
            onTouchStart={(e) => handleTouchStart(e, p)}
            className={`absolute flex flex-col items-center justify-center z-10 w-12 md:w-20 cursor-grab active:cursor-grabbing touch-none ${!isDragging ? 'transition-all duration-700 ease-out' : ''}`}
            style={{ top, left, transform: 'translate(-50%, -50%)', zIndex: isDragging ? 50 : 10 }}
          >
            {/* Token with Position */}
            <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full border-4 border-black flex items-center justify-center font-black text-[10px] md:text-sm ${p.team === 'A' ? teamAColor : teamBColor} ${p.team === 'A' ? teamATextColor : teamBTextColor} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-20`}>
              {PositionLabels[p.position]}
            </div>

            {/* Name Label */}
            <div className={`mt-1 border-2 border-black px-1 py-0.5 md:px-2 md:py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-[85px] md:max-w-[120px] z-10 flex items-center justify-center ${p.team === 'A' ? teamAColor : teamBColor}`}>
              <span className={`text-[10px] md:text-sm font-bold whitespace-nowrap uppercase tracking-tight ${p.team === 'A' ? teamATextColor : teamBTextColor}`}>
                {p.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};