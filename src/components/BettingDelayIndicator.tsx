import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DelayIndicatorProps {
  ticketId?: string;
  delaySeconds?: number;
  onComplete?: (status: 'accepted' | 'cancelled') => void;
}

export default function BettingDelayIndicator({ 
  ticketId, 
  delaySeconds = 5,
  onComplete 
}: DelayIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(delaySeconds);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'cancelled'>('pending');
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!ticketId || status !== 'pending') return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, delaySeconds - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setStatus('accepted'); // Assume accepted unless we get cancellation
        onComplete?.('accepted');
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [ticketId, delaySeconds, startTime, status, onComplete]);

  const progress = ((delaySeconds - timeRemaining) / delaySeconds) * 100;

  if (!ticketId) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-400" />
            <span className="font-medium text-blue-200">Processing Bet</span>
          </div>
          <Badge variant="outline" className="border-blue-500 text-blue-300">
            {timeRemaining > 0 ? `${timeRemaining.toFixed(1)}s` : 'Complete'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="h-4 w-4" />
              <span>Anti-sniping delay ({delaySeconds}s)</span>
            </div>
            
            {status === 'accepted' && (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>Accepted</span>
              </div>
            )}
            
            {status === 'cancelled' && (
              <div className="flex items-center gap-1 text-red-400">
                <XCircle className="h-4 w-4" />
                <span>Cancelled</span>
              </div>
            )}
          </div>
          
          {timeRemaining > 0 && (
            <p className="text-xs text-gray-400">
              Your bet is being processed. If the market closes during this period, your bet will be automatically refunded.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}