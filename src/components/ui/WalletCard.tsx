import { formatNaira } from '@/lib/store';
import { Wallet } from 'lucide-react';

interface WalletCardProps {
  available: number;
  pending: number;
  onWithdraw: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ available, pending, onWithdraw }) => {
  return (
    <div className="wallet-gradient rounded-lg p-5 border border-border bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Wallet Balance</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatNaira(available)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <p className="text-lg font-semibold text-farm-warning">
              {formatNaira(pending)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pending · Clears after delivery
            </p>
          </div>
          
          <button
            onClick={onWithdraw}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};
