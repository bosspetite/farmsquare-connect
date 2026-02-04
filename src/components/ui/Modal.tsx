import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent modal from closing on swipe gestures
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
        onTouchStart={handleTouchStart}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-6 animate-slide-in-right sm:animate-fade-up',
          'max-h-[90vh] overflow-y-auto flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-[0.95] min-h-[44px] sm:min-h-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
