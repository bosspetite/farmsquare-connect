import React from 'react';
import { LogOut, X } from 'lucide-react';
import { Modal } from './Modal';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-md">
      <div className="text-center space-y-6 py-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-8 h-8 text-destructive" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-display font-semibold text-foreground">
            Sign Out
          </h3>
          <p className="text-sm text-muted-foreground">
            {userName 
              ? `Are you sure you want to sign out, ${userName.split(' ')[0]}?`
              : 'Are you sure you want to sign out?'
            }
          </p>
          <p className="text-xs text-muted-foreground">
            You'll need to sign in again to access your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </Modal>
  );
};

