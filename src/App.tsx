import React, { useState, useEffect, useRef } from 'react';
import { Player, Position, MatchResult, PositionColors, Team, PositionLabels } from './types';
import { Button } from './components/Button';
import { PlayerCard } from './components/PlayerCard';
import { generateBalancedTeams } from './services/teamService';
import { Star, Share2, Users, Layout, Activity, RotateCcw, Download, Copy, Trash2, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { FieldView } from './components/FieldView';
import { Modal } from './components/Modal';
import html2canvas from 'html2canvas';

const App = () => {
  // --- State ---
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>(Position.MID);
  const [stars, setStars] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'field'>('field');

  // Modals
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Local state for editable team names to persist between views
  const [teamAName, setTeamAName] = useState("Equipo Pan");
  const [teamBName, setTeamBName] = useState("Equipo Queso");

  // Reset names when new result comes in
  useEffect(() => {
    if (result) {
      setTeamAName(result.teamA.name);
      setTeamBName(result.teamB.name);
    }
  }, [result]);

  // Refs for keyboard navigation
  const nameInputRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // --- Handlers ---

  const handleAddOrUpdatePlayer = () => {
    if (!name.trim()) return;

    if (editingId) {
      setPlayers(prev => prev.map(p => p.id === editingId ? { ...p, name, position, stars } : p));
      setEditingId(null);
    } else {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        position,
        stars
      };
      setPlayers(prev => [...prev, newPlayer]);
    }

    // Reset form
    setName('');
    setPosition(Position.MID);
    setStars(3);

    // Focus back on name input for rapid entry
    nameInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddOrUpdatePlayer();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      positionRef.current?.focus();
    }
  };

  const handleEdit = (player: Player) => {
    setName(player.name);
    setPosition(player.position);
    setStars(player.stars);
    setEditingId(player.id);
  };

  const handleDelete = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerate = async () => {
    if (players.length < 2) {
      alert("¡Necesitás al menos 2 jugadores para armar partido!");
      return;
    }
    setLoading(true);
    try {
      // Add a small artificial delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = await generateBalancedTeams(players);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Error al armar los equipos.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Estás seguro que querés borrar todo y empezar de cero?")) {
      setPlayers([]);
      setResult(null);
      setTeamAName("Equipo Pan");
      setTeamBName("Equipo Queso");
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    if (!result) return;

    // Update in main list
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));

    // Update in result teams
    setResult(prev => {
      if (!prev) return null;
      const updateTeam = (team: Team) => ({
        ...team,
        players: team.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
      });
      return {
        ...prev,
        teamA: updateTeam(prev.teamA),
        teamB: updateTeam(prev.teamB)
      };
    });
  };

  // Calculate waiting list (players in main list but not in current result teams)
  const waitingPlayers = result ? players.filter(p =>
    !result.teamA.players.find(tp => tp.id === p.id) &&
    !result.teamB.players.find(tp => tp.id === p.id)
  ) : [];

  // --- Capture & Share Logic ---

  const captureField = async (): Promise<HTMLCanvasElement | null> => {
    const element = document.getElementById('field-canvas');
    if (!element) {
      alert("Cambiá a la vista de 'CANCHAS' para poder capturar la imagen.");
      return null;
    }
    try {
      // Use html2canvas to screenshot the div
      const canvas = await html2canvas(element, {
        scale: 3, // Increased scale for better quality
        useCORS: true,
        backgroundColor: null // Transparent background if possible, or keep default
      });
      return canvas;
    } catch (err) {
      console.error(err);
      alert("No se pudo generar la imagen. Asegurate de que la librería cargó correctamente.");
      return null;
    }
  };

  // Helper to allow async awaiting of clipboard write
  const copyCanvasToClipboard = (canvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject("No se pudo generar el archivo de imagen.");
          return;
        }
        try {
          if (!navigator.clipboard || !navigator.clipboard.write) {
            reject("Tu navegador no soporta copiar imágenes al portapapeles.");
            return;
          }
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  const handleDownloadImage = async () => {
    const canvas = await captureField();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `pan-y-queso-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    setShowDownloadModal(false);
  };

  const handleCopyToClipboard = async () => {
    const canvas = await captureField();
    if (!canvas) return;

    try {
      await copyCanvasToClipboard(canvas);
      alert("¡Cancha copiada al portapapeles!");
      setShowDownloadModal(false);
    } catch (err) {
      console.error(err);
      alert("Error al copiar: " + err);
    }
  };

  const getShareText = () => {
    if (!result) return '';
    return `*${teamAName}*\n${result.teamA.players.map(p => p.name).join('\n')}\n\n*${teamBName}*\n${result.teamB.players.map(p => p.name).join('\n')}`;
  };

  const handleShareWhatsAppText = () => {
    const text = getShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowShareModal(false);
  };

  const handleShareWhatsAppImage = async () => {
    // 1. Capture
    const canvas = await captureField();
    if (!canvas) {
      setShowShareModal(false);
      return;
    }

    try {
      // 2. Copy (Wait for it to finish!)
      await copyCanvasToClipboard(canvas);

      // 3. Prepare URL
      const text = getShareText();
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

      // 4. Alert user and open
      alert("¡IMAGEN COPIADA!\n\nSe abrirá WhatsApp.\n\n1. Seleccioná el chat.\n2. Pegá la imagen (Ctrl+V) en el cuadro de texto.");
      window.open(url, '_blank');
      setShowShareModal(false);

    } catch (err) {
      console.error(err);
      alert("No se pudo copiar la imagen al portapapeles automáticamente.\n\nPrueba 'DESCARGAR' la imagen primero y enviarla manualmente.");
    }
  };


  // --- Render Helpers ---

  const renderStarsSelector = () => (
    <div className="flex gap-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map(val => (
        <Star
          key={val}
          size={32}
          fill={val <= stars ? "currentColor" : "none"}
          color="#000"
          className={`${val <= stars ? 'text-neo-yellow' : 'text-gray-400'} transition-transform hover:scale-110`}
          onClick={() => setStars(val)}
        />
      ))}
    </div>
  );

  const CompactTeamHeader = ({
    name,
    setName,
    color,
    avg
  }: { name: string, setName: (s: string) => void, color: string, avg: number }) => (
    <div className={`border-4 border-neo-black shadow-neo-sm p-3 ${color} mb-4 relative`}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-transparent font-black text-xl uppercase outline-none placeholder-neo-black text-black text-center"
      />
      <div className="text-sm font-bold opacity-80 text-black text-center mt-1 border-t-2 border-black/20 pt-1">
        Promedio: {avg} ⭐
      </div>
    </div>
  );

  const TeamListView = ({ team, onEdit }: { team: Team, onEdit: (p: Player) => void }) => (
    <div className={`flex-1 border-4 border-neo-black shadow-neo p-4 bg-white min-h-[400px]`}>
      <ul className="space-y-2">
        {team.players.map(p => (
          <li key={p.id} className="flex items-center justify-between border-b-2 border-gray-200 pb-1 group">
            <span className="font-bold flex items-center gap-2 text-black">
              <span className={`w-8 h-6 flex items-center justify-center text-[10px] border border-black ${PositionColors[p.position]} text-black`}>
                {PositionLabels[p.position]}
              </span>
              {p.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: p.stars }).map((_, i) => <Star key={i} size={12} fill="black" color="black" />)}
              </div>
              <button
                onClick={() => onEdit(p)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                title="Editar"
              >
                <Users size={14} className="text-black" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-7xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter drop-shadow-[4px_4px_0_#000] text-black">
          Pan y Queso
        </h1>
        <p className="font-bold text-xl mt-2 bg-neo-yellow inline-block px-2 border-2 border-black shadow-[4px_4px_0_#000] text-black">
          Armador de Equipos
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Player Management & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Form */}
          <div className="bg-white border-4 border-neo-black shadow-neo p-6 relative">
            <h2 className="text-2xl font-black mb-4 uppercase bg-neo-magenta inline-block px-2 border-2 border-black transform -rotate-1 text-black">
              Cargar Jugador
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1 text-black">Nombre</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full border-4 border-neo-black bg-neo-black p-3 font-bold focus:outline-none focus:ring-4 ring-neo-yellow transition-all text-white placeholder-gray-500"
                  placeholder="Ej. Messi"
                />
              </div>

              <div>
                <label className="block font-bold mb-2 text-black">Posición</label>
                <div
                  ref={positionRef}
                  className="grid grid-cols-4 gap-2 outline-none focus:ring-4 focus:ring-neo-blue rounded-lg p-1 transition-all"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddOrUpdatePlayer();
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      starsRef.current?.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      nameInputRef.current?.focus();
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const positions = Object.values(Position);
                      const currentIndex = positions.indexOf(position);
                      const nextIndex = (currentIndex + 1) % positions.length;
                      setPosition(positions[nextIndex]);
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const positions = Object.values(Position);
                      const currentIndex = positions.indexOf(position);
                      const prevIndex = (currentIndex - 1 + positions.length) % positions.length;
                      setPosition(positions[prevIndex]);
                    }
                  }}
                >
                  {Object.values(Position).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      tabIndex={-1} // Remove from tab order, let container handle it
                      className={`
                        border-2 border-neo-black py-2 font-bold text-sm transition-all text-black
                        ${position === pos ? PositionColors[pos] + ' shadow-[2px_2px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-gray-100 opacity-50'}
                      `}
                    >
                      {PositionLabels[pos]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-black">Habilidad</label>
                <div
                  ref={starsRef}
                  className="outline-none inline-block focus:ring-4 focus:ring-neo-blue rounded-lg p-1 transition-all"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddOrUpdatePlayer();
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      addButtonRef.current?.focus();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      positionRef.current?.focus();
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      setStars(Math.min(5, stars + 1));
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setStars(Math.max(1, stars - 1));
                    }
                  }}
                >
                  {renderStarsSelector()}
                </div>
              </div>

              <div className="absolute top-4 right-4 text-[10px] text-gray-500 font-bold text-right leading-tight">
                <span className="block">⬆️ ⬇️ <span className="underline">FLECHAS</span> mover.</span>
                <span className="block">⬅️ ➡️ <span className="underline">FLECHAS</span> elegir.</span>
                <span className="block">↩️ <span className="underline">ENTER</span> agregar.</span>
              </div>

              <Button
                ref={addButtonRef}
                onClick={handleAddOrUpdatePlayer}
                variant="primary"
                fullWidth
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    starsRef.current?.focus();
                  }
                }}
              >
                {editingId ? 'ACTUALIZAR' : 'AGREGAR JUGADOR'}
              </Button>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleGenerate}
            variant="action"
            fullWidth
            disabled={loading}
            className="text-2xl py-6 flex items-center justify-center gap-4 relative overflow-hidden"
          >
            {loading ? (
              <span className="animate-pulse">PENSANDO...</span>
            ) : (
              <>
                {result ? <RotateCcw size={32} /> : <Activity size={32} />}
                {result ? "ARMAR DE NUEVO" : "ARMAR EQUIPOS"}
              </>
            )}
          </Button>

          {/* Team Headers (Compact View) */}
          {result && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <CompactTeamHeader
                name={teamAName}
                setName={setTeamAName}
                color="bg-neo-yellow"
                avg={result.teamA.averageSkill}
              />
              <CompactTeamHeader
                name={teamBName}
                setName={setTeamBName}
                color="bg-neo-blue"
                avg={result.teamB.averageSkill}
              />
            </div>
          )}

        </div>

        {/* Right Column: Roster OR Results */}
        <div className="lg:col-span-8">

          {!result ? (
            /* Roster Display (The Empty Box Container) */
            <div className="h-full min-h-[500px] border-4 border-neo-black bg-neo-white p-6 shadow-neo relative flex flex-col">
              <div className="absolute top-0 left-0 bg-neo-black text-white px-4 py-1 font-bold text-sm">
                PLANTEL ({players.length})
              </div>

              <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar">
                {players.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-4 border-dashed border-gray-300 rounded-lg">
                    <Users size={48} className="mb-2 opacity-50" />
                    <p className="font-bold text-xl uppercase text-black">Plantel Vacío</p>
                    <p className="text-black">Agregá jugadores a la izquierda para llenar el plantel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {players.map(p => (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Controls Toolbar */}
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('field')}
                    className={`p-2 border-2 border-neo-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${viewMode === 'field' ? 'bg-neo-black text-white' : 'bg-white text-black'}`}
                  >
                    <Layout size={20} /> CANCHAS
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-2 border-neo-black font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${viewMode === 'list' ? 'bg-neo-black text-white' : 'bg-white text-black'}`}
                  >
                    <Users size={20} /> LISTA
                  </button>

                  {/* NEW: Download Button */}
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="p-2 border-2 border-neo-black bg-neo-white text-black font-bold flex items-center gap-2 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    title="Descargar o Copiar"
                  >
                    <Download size={20} />
                  </button>

                  {/* NEW: Reset Button */}
                  <button
                    onClick={handleReset}
                    className="p-2 border-2 border-neo-black bg-neo-red text-black font-bold flex items-center gap-2 hover:bg-red-400 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    title="Reiniciar Todo"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <Button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 text-sm bg-[#25D366] text-black hover:bg-[#128C7E]">
                  <Share2 size={16} /> Compartir WhatsApp
                </Button>
              </div>

              {/* Horizontal Field View & Waiting List Container */}
              <div className="relative">

                {/* Main Content (Field/List + Tips) */}
                <div className="w-full">
                  <div className={viewMode === 'field' ? 'block' : 'hidden'}>
                    <FieldView
                      teamA={result.teamA.players}
                      teamB={result.teamB.players}
                      onPlayerUpdate={handlePlayerUpdate}
                    />
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                      <TeamListView team={result.teamA} onEdit={handleEdit} />
                      <div className="flex items-center justify-center font-black text-4xl text-black self-center">VS</div>
                      <TeamListView team={result.teamB} onEdit={handleEdit} />
                    </div>
                  )}

                  {/* Analysis Sticky Note */}
                  <div className="relative bg-[#fff740] p-6 shadow-lg rotate-1 max-w-2xl mx-auto border border-black mt-6">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-red-500 border-2 border-black shadow-sm z-10"></div>
                    <h3 className="font-hand text-2xl mb-2 font-bold underline decoration-wavy text-black">Tips:</h3>
                    <p className="font-hand text-lg leading-relaxed text-black">
                      ¡Equipos listos! Si no te convencen, podés tocar "ARMAR DE NUEVO" para probar otra combinación.
                    </p>
                  </div>
                </div>

                {/* Waiting List Sidebar - Absolute Positioned */}
                {waitingPlayers.length > 0 && (
                  <div className="hidden xl:block absolute top-0 left-[102%] w-64">
                    <div className="border-4 border-dashed border-gray-400 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-black text-xl text-gray-500 mb-4 uppercase text-left">En Espera ({waitingPlayers.length})</h3>
                      <div className="flex flex-col gap-2">
                        {waitingPlayers.map(p => (
                          <div key={p.id} className="bg-white border-2 border-gray-300 px-3 py-2 rounded-lg flex items-center justify-between shadow-sm w-full">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className={`text-[10px] font-bold px-1 border border-gray-400 rounded ${PositionColors[p.position]} text-black flex-shrink-0`}>{PositionLabels[p.position]}</span>
                              <span className="font-bold text-gray-700 truncate text-sm">{p.name}</span>
                            </div>
                            <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 flex-shrink-0"><Users size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-4 text-center">
                        Tocá "ARMAR DE NUEVO" para incluirlos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mobile/Tablet Waiting List (Below content) */}
                {waitingPlayers.length > 0 && (
                  <div className="block xl:hidden mt-8 border-4 border-dashed border-gray-400 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-black text-xl text-gray-500 mb-2 uppercase">En Espera ({waitingPlayers.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {waitingPlayers.map(p => (
                        <div key={p.id} className="bg-white border-2 border-gray-300 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                          <span className={`text-[10px] font-bold px-1 border border-gray-400 rounded ${PositionColors[p.position]} text-black`}>{PositionLabels[p.position]}</span>
                          <span className="font-bold text-gray-700">{p.name}</span>
                          <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700"><Users size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}

      {/* Download Modal */}
      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Guardar Cancha"
      >
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCopyToClipboard}
            className="flex flex-col items-center justify-center gap-2 p-6 border-4 border-neo-black bg-white hover:bg-gray-100 transition-colors shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Copy size={40} className="text-neo-blue" />
            <span className="font-bold text-center text-black">COPIAR</span>
            <span className="text-xs text-center text-black">Al portapapeles</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="flex flex-col items-center justify-center gap-2 p-6 border-4 border-neo-black bg-white hover:bg-gray-100 transition-colors shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <ImageIcon size={40} className="text-neo-green" />
            <span className="font-bold text-center text-black">DESCARGAR</span>
            <span className="text-xs text-center text-black">Guardar PNG</span>
          </button>
        </div>
        <p className="mt-4 text-xs text-center text-black font-bold">* Asegurate de estar en la vista de "CANCHAS"</p>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartir en WhatsApp"
      >
        <div className="flex flex-col gap-4">
          <button
            onClick={handleShareWhatsAppText}
            className="flex items-center gap-4 p-4 border-4 border-neo-black bg-white hover:bg-gray-100 transition-colors shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <MessageCircle size={32} className="text-[#25D366]" />
            <div className="text-left">
              <span className="font-bold block text-lg text-black">SOLO TEXTO</span>
              <span className="text-xs text-black">Envía la lista de jugadores.</span>
            </div>
          </button>

          <button
            onClick={handleShareWhatsAppImage}
            className="flex items-center gap-4 p-4 border-4 border-neo-black bg-white hover:bg-gray-100 transition-colors shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <ImageIcon size={32} className="text-neo-magenta" />
            <div className="text-left">
              <span className="font-bold block text-lg text-black">IMAGEN + TEXTO</span>
              <span className="text-xs text-black">Copia la imagen y abre WhatsApp para pegar.</span>
            </div>
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default App;