import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, Palette } from 'lucide-react';

interface CompactTeamHeaderProps {
    name: string;
    setName: (s: string) => void;
    backgroundColor: string;
    textColor: string;
    avg: number;
    onColorChange: (color: string) => void;
    onTextColorChange: (color: string) => void;
}

export const CompactTeamHeader: React.FC<CompactTeamHeaderProps> = ({
    name,
    setName,
    backgroundColor,
    textColor,
    avg,
    onColorChange,
    onTextColorChange
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    const bgColors = [
        'bg-neo-yellow', 'bg-neo-blue', 'bg-neo-red',
        'bg-neo-magenta', 'bg-neo-black', 'bg-white'
    ];

    const textColors = ['text-black', 'text-white'];

    return (
        <div className={`border-4 border-neo-black shadow-neo-sm p-3 ${backgroundColor} mb-4 relative group transition-colors duration-300`}>

            {/* Palette Toggle */}
            <button
                onClick={() => setShowPalette(!showPalette)}
                className={`absolute left-2 top-2 p-2 z-20 rounded hover:bg-black/10 ${textColor} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}
                title="Cambiar colores"
            >
                <Palette size={16} />
            </button>

            {/* Palette Popover */}
            {showPalette && (
                <div className="absolute top-8 left-0 z-50 bg-white border-4 border-neo-black shadow-neo p-2 flex flex-col gap-2 min-w-[150px]">
                    <div>
                        <span className="text-xs font-bold block mb-1">Fondo</span>
                        <div className="flex flex-wrap gap-1">
                            {bgColors.map(c => (
                                <button
                                    key={c}
                                    className={`w-6 h-6 border-2 border-black ${c}`}
                                    onClick={() => onColorChange(c)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs font-bold block mb-1">Texto</span>
                        <div className="flex gap-1">
                            {textColors.map(c => (
                                <button
                                    key={c}
                                    className={`w-6 h-6 border-2 border-black ${c === 'text-black' ? 'bg-black' : 'bg-white'}`}
                                    onClick={() => onTextColorChange(c)}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPalette(false)}
                        className="text-xs font-bold text-red-500 hover:underline mt-1 text-center"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            <div className="flex items-center justify-center relative min-h-[32px]">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-transparent font-black text-xl uppercase outline-none placeholder-neo-black ${textColor} text-center`}
                    />
                ) : (
                    <h3
                        className={`font-black text-xl uppercase ${textColor} text-center truncate px-6 cursor-pointer select-none`}
                        onClick={() => setIsEditing(true)}
                    >
                        {name}
                    </h3>
                )}

                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded ${textColor} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}
                    title={isEditing ? "Guardar" : "Editar nombre"}
                >
                    {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                </button>
            </div>

            <div className={`text-sm font-bold opacity-80 ${textColor} text-center mt-1 border-t-2 border-black/20 pt-1`}>
                Promedio: {avg} ⭐
            </div>
        </div>
    );
};
