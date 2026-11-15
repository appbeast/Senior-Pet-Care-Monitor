import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { PetRecord } from '../types';

interface DeletePetConfirmModalProps {
  pet: PetRecord;
  onConfirmDelete: (petId: string) => Promise<void>;
  onClose: () => void;
}

export const DeletePetConfirmModal: React.FC<DeletePetConfirmModalProps> = ({
  pet,
  onConfirmDelete,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(pet.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete {pet.name}?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will permanently remove <strong>{pet.name}</strong> and all of their daily check-ins, observation logs, medications, cognitive screens, and quality-of-life history from this device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel delete"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#D5D0C4] bg-white hover:bg-[#F5F2EB] font-semibold text-xs text-slate-800 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs min-h-[44px] inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : `Delete ${pet.name}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
