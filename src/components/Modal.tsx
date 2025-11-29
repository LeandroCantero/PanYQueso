import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full max-w-md relative animate-in zoom-in-95 duration-200 text-black">
        <header className="bg-neo-yellow border-b-4 border-neo-black p-4 flex justify-between items-center">
          <h2 className="font-black text-xl text-black uppercase">{title}</h2>
          <button 
            onClick={onClose}
            className="bg-neo-red border-2 border-neo-black p-1 hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_#000]"
          >
            <X size={20} className="text-black" />
          </button>
        </header>
        <div className="p-6 text-black">
          {children}
        </div>
      </div>
    </div>
  );
};