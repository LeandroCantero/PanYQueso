import React, { useState, useEffect, useRef } from 'react';
import { Player, Position, MatchResult, PositionColors, Team, PositionLabels } from './types';
import { Button } from './components/Button';
import { PlayerCard } from './components/PlayerCard';
import { generateBalancedTeams } from './services/teamService';
import { Star, Share2, Users, Layout, Activity, RotateCcw, Download, Copy, Trash2, ImageIcon, MessageCircle, Pencil, Pin } from 'lucide-react';
import { TeamListView } from './components/TeamListView';
import { CompactTeamHeader } from './components/CompactTeamHeader';
import { FieldView } from './components/FieldView';
import { Modal } from './components/Modal';
import { toCanvas } from 'html-to-image';
import toast, { Toaster } from 'react-hot-toast';
import { ConfirmModal } from './components/ConfirmModal';

// ... (existing imports)

// ... inside App component ...








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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Local state for editable team names to persist between views
  const [teamAName, setTeamAName] = useState("Equipo Pan");
  const [teamBName, setTeamBName] = useState("Equipo Queso");

  // Team Colors State
  const [teamAColor, setTeamAColor] = useState("bg-neo-red");
  const [teamATextColor, setTeamATextColor] = useState("text-black");
  const [teamBColor, setTeamBColor] = useState("bg-neo-blue");
  const [teamBTextColor, setTeamBTextColor] = useState("text-white");

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
      toast.error("¡Necesitás al menos 2 jugadores para armar partido!", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
      return;
    }
    setLoading(true);
    try {
      // Add a small artificial delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Clean players coordinates to reset positions on field
      const cleanPlayers = players.map(({ x, y, ...p }) => p);
      const data = await generateBalancedTeams(cleanPlayers);
      setResult(data);
      toast.success("¡Equipos armados!", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold', background: '#88cc00', color: '#000' }
      });
    } catch (e) {
      console.error(e);
      toast.error("Error al armar los equipos.", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setPlayers([]);
    setResult(null);
    setTeamAName("Equipo Pan");
    setTeamBName("Equipo Queso");
    toast.success("Todo reseteado.", {
      style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
    });
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
      toast("Cambiá a la vista de 'CANCHAS' para poder capturar la imagen.", {
        icon: 'ℹ️',
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
      return null;
    }
    try {
      // Use html-to-image to generate canvas
      const canvas = await toCanvas(element, {
        pixelRatio: 3, // High quality
        backgroundColor: '#88cc00', // Match neo-green field color
        cacheBust: true,
      });
      return canvas;
    } catch (err) {
      console.error(err);
      toast.error("No se pudo generar la imagen.", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
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
      toast.success("¡Cancha copiada al portapapeles!", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold', background: '#54a0ff', color: '#000' }
      });
      setShowDownloadModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al copiar: " + err, {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
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
      toast("¡IMAGEN COPIADA!\n\nSe abrirá WhatsApp.\n\n1. Seleccioná el chat.\n2. Pegá la imagen (Ctrl+V).", {
        duration: 6000,
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold', background: '#ffde59', color: '#000' }
      });

      setTimeout(() => {
        window.open(url, '_blank');
        setShowShareModal(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error("No se pudo copiar la imagen automáticamente.", {
        style: { border: '2px solid #000', boxShadow: '4px 4px 0px #000', fontWeight: 'bold' }
      });
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







  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-7xl mx-auto relative">
      <Toaster position="top-right" reverseOrder={false} />
      <img
        src="/Logo2.png"
        alt="Logo Pan y Queso"
        className="block mx-auto mb-4 md:absolute md:top-4 md:left-8 md:mb-0 w-20 md:w-32 h-auto object-contain z-10"
      />
      <header className="mb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-hand uppercase tracking-tighter drop-shadow-[4px_4px_0_#000] text-white">
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
                  className="w-full border-4 border-neo-black bg-gray-100 p-3 font-bold focus:outline-none focus:ring-4 ring-neo-yellow transition-all text-black placeholder-gray-500"
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
                  className="outline-none inline-block focus-visible:bg-gray-100 rounded-lg p-1 transition-all"
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

          {/* Waiting List - Before Action Button */}
          {waitingPlayers.length > 0 && (
            <div className="border-4 border-dashed border-gray-400 p-4 bg-gray-50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-black text-lg text-gray-500 mb-3 uppercase">En Espera ({waitingPlayers.length})</h3>
              <div className="flex flex-col gap-2">
                {waitingPlayers.map(p => (
                  <div key={p.id} className="bg-white border-2 border-gray-300 px-3 py-2 rounded-lg flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`text-[10px] font-bold px-1 border border-gray-400 rounded ${PositionColors[p.position]} text-black flex-shrink-0`}>{PositionLabels[p.position]}</span>
                      <span className="font-bold text-gray-700 truncate text-sm">{p.name}</span>
                    </div>
                    <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 flex-shrink-0"><Pencil size={14} /></button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Tocá "ARMAR DE NUEVO" para incluirlos.
              </p>
            </div>
          )}

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
                backgroundColor={teamAColor}
                textColor={teamATextColor}
                avg={result.teamA.averageSkill}
                onColorChange={setTeamAColor}
                onTextColorChange={setTeamATextColor}
              />
              <CompactTeamHeader
                name={teamBName}
                setName={setTeamBName}
                backgroundColor={teamBColor}
                textColor={teamBTextColor}
                avg={result.teamB.averageSkill}
                onColorChange={setTeamBColor}
                onTextColorChange={setTeamBTextColor}
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
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-4 border-dashed border-gray-300 rounded-lg text-center">
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
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> Compartir WhatsApp
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
                      teamAColor={teamAColor}
                      teamATextColor={teamATextColor}
                      teamBColor={teamBColor}
                      teamBTextColor={teamBTextColor}
                      onPlayerUpdate={handlePlayerUpdate}
                    />
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                      <TeamListView team={result.teamA} onUpdate={handlePlayerUpdate} />
                      <div className="flex items-center justify-center font-black text-4xl text-black self-center">VS</div>
                      <TeamListView team={result.teamB} onUpdate={handlePlayerUpdate} />
                    </div>
                  )}

                  {/* Analysis Sticky Note */}
                  <div className="relative bg-[#fff740] p-6 shadow-lg rotate-1 max-w-2xl mx-auto border border-black mt-6">
                    <Pin className="absolute -top-3 left-1/2 text-black fill-red-500 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" size={40} style={{ transform: 'translate(-50%, 0) rotate(-30deg)' }} />
                    <h3 className="font-hand text-2xl mb-2 font-bold underline decoration-wavy text-black">Análisis táctico:</h3>
                    <p className="font-hand text-lg leading-relaxed text-black">
                      Los equipos están balanceados perfectamente, el "{teamAName}" con {result.teamA.averageSkill} estrellas y el "{teamBName}" con {result.teamB.averageSkill} estrellas.
                    </p>
                  </div>
                </div>

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

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="¿RESET TOTAL?"
        message="¿Estás seguro que querés borrar todo y empezar de cero? No hay vuelta atrás."
        confirmText="SÍ, BORRAR TODO"
      />

    </div>
  );
};

export default App;