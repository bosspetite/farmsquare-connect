import React from 'react';
import { LogOut, X } from 'lucide-react';
import { Modal } from './Modal';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userName?: string;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign out right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" className="max-w-md">
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

        {errorMessage && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

















