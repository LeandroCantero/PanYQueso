import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "CONFIRMAR",
    cancelText = "CANCELAR"
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <p className="font-bold text-lg mb-8 text-black">{message}</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={onClose} variant="secondary">
                        {cancelText}
                    </Button>
                    <Button onClick={() => { onConfirm(); onClose(); }} variant="primary" className="bg-neo-red hover:bg-red-500 text-white">
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
