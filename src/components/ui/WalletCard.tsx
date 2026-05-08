import { formatNaira } from '@/lib/store';
import { Wallet } from 'lucide-react';

interface WalletCardProps {
  available: number;
  pending: number;
  onWithdraw: () => void;
  onOpenWallet?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ available, pending, onWithdraw, onOpenWallet }) => {
  const formatNairaForDisplay = (amount: number) => {
    const formatted = formatNaira(amount);
    // Split by space to break into two lines on mobile
    const parts = formatted.split(' ');
    return parts;
  };

  const availableParts = formatNairaForDisplay(available);
  const pendingParts = formatNairaForDisplay(pending);

  return (
    <div className="wallet-gradient rounded-lg p-4 sm:p-5 border border-border bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenWallet}
            disabled={!onOpenWallet}
            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center disabled:cursor-default transition-colors hover:bg-muted/80"
            title={onOpenWallet ? 'Open wallet page' : undefined}
            aria-label={onOpenWallet ? 'Open wallet page' : 'Wallet icon'}
          >
            <Wallet className="w-5 h-5 text-primary" />
          </button>
          <span className="text-sm text-muted-foreground">Wallet Balance</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Available Balance - Break into two lines on mobile */}
        <div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight">
            <span className="block sm:inline">{availableParts[0]}</span>
            {availableParts.length > 1 && (
              <span className="block sm:inline sm:ml-1">{availableParts.slice(1).join(' ')}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
        </div>
        
        {/* Escrow/Pending - Centered on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-border/50 gap-3">
          <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
            <p className="text-xl sm:text-lg font-semibold text-farm-warning leading-tight">
              <span className="block sm:inline">{pendingParts[0]}</span>
              {pendingParts.length > 1 && (
                <span className="block sm:inline sm:ml-1">{pendingParts.slice(1).join(' ')}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pending · Clears after delivery
            </p>
          </div>
          
          <button
            onClick={onWithdraw}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};
