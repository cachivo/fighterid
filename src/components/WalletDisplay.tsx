import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWallet } from '@/hooks/useWallet';
import { 
  Wallet, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface WalletDisplayProps {
  compact?: boolean;
  showTransactions?: boolean;
}

export default function WalletDisplay({ compact = false, showTransactions = true }: WalletDisplayProps) {
  const { 
    wallets, 
    transactions, 
    loading, 
    getBDGWallet, 
    getAvailableBalance,
    fetchWallets,
    fetchTransactions
  } = useWallet();
  
  const [showBalance, setShowBalance] = React.useState(true);
  const [showTxHistory, setShowTxHistory] = React.useState(false);

  const bdgWallet = getBDGWallet();
  const availableBalance = getAvailableBalance('BDG');

  const handleRefresh = () => {
    fetchWallets();
    if (showTransactions) {
      fetchTransactions();
    }
  };

  const formatAmount = (amount: number, showSign = false) => {
    const sign = showSign && amount > 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const getTxIcon = (kind: string) => {
    switch (kind) {
      case 'BET_STAKE':
        return <TrendingDown className="h-4 w-4 text-fighter-danger" />;
      case 'BET_PAYOUT':
        return <TrendingUp className="h-4 w-4 text-fighter-success" />;
      case 'BET_REFUND':
        return <RefreshCw className="h-4 w-4 text-fighter-info" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTxLabel = (kind: string) => {
    switch (kind) {
      case 'BET_STAKE': return 'Bet Placed';
      case 'BET_PAYOUT': return 'Bet Payout';
      case 'BET_REFUND': return 'Bet Refunded';
      default: return kind.replace('_', ' ');
    }
  };

  if (loading && !bdgWallet) {
    return (
      <Card className={`bg-card border-border ${compact ? 'p-4' : ''}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bdgWallet) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No BDG wallet found</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {showBalance ? formatAmount(availableBalance) : '••••••'}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bdgWallet.hold > 0 && (
            <div className="text-xs text-fighter-warning">
              ${bdgWallet.hold.toFixed(2)} on hold
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              BDG Wallet
            </CardTitle>
            <CardDescription>Your betting credits</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-bold text-foreground">
              {showBalance ? formatAmount(availableBalance) : '••••••'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">On Hold</div>
            <div className="text-xl font-medium text-fighter-warning">
              {showBalance ? formatAmount(bdgWallet.hold) : '••••••'}
            </div>
          </div>
        </div>

        {bdgWallet.hold > 0 && (
          <div className="p-3 bg-fighter-warning/10 border border-fighter-warning/30 rounded-lg">
            <div className="flex items-center gap-2 text-fighter-warning text-sm">
              <Clock className="h-4 w-4" />
              <span>You have pending bets worth ${bdgWallet.hold.toFixed(2)}</span>
            </div>
          </div>
        )}

        {showTransactions && (
          <>
            <Separator className="bg-border" />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Recent Transactions</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTxHistory(!showTxHistory)}
                >
                  {showTxHistory ? 'Hide' : 'Show'}
                </Button>
              </div>
              
              {showTxHistory && (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {transactions.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No transactions yet
                      </div>
                    ) : (
                      transactions.slice(0, 10).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 bg-secondary rounded">
                          <div className="flex items-center gap-3">
                            {getTxIcon(tx.kind)}
                            <div>
                              <div className="text-sm font-medium">{getTxLabel(tx.kind)}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${
                            tx.amount > 0 ? 'text-fighter-success' : 'text-fighter-danger'
                          }`}>
                            {formatAmount(tx.amount, true)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
