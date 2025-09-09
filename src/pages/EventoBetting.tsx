import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useRealtimeBetting } from '@/hooks/useRealtimeBetting';
import { 
  TrendingUp, Clock, DollarSign, Users, AlertTriangle, 
  Trophy, MapPin, Calendar, Zap, Timer, Target, ArrowLeft,
  Shield, Mic, Gamepad
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WalletDisplay from '@/components/WalletDisplay';
import { Link } from 'react-router-dom';

interface BDGEvent {
  id: string;
  name: string;
  discipline: string;
  description?: string;
  venue?: string;
  state: string;
  start_time?: string;
  end_time?: string;
}

interface Market {
  id: string;
  title: string;
  description?: string;
  kind: string;
  state: string;
  rake: number;
  min_stake: number;
  max_stake?: number;
  outcomes: Outcome[];
}

interface Outcome {
  id: string;
  label: string;
  description?: string;
  pool: number;
  active: boolean;
  sort_order: number;
}

interface BetTicket {
  id: string;
  market_id: string;
  outcome_id: string;
  stake: number;
  status: string;
  potential_payout?: number;
  created_at: string;
  outcome?: { label: string };
  market?: { title: string };
}

export default function EventoBetting() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { placeBet, getAvailableBalance } = useWallet();
  const { getPoolForOutcome, getMarketState, isConnected } = useRealtimeBetting(eventId);
  
  const [event, setEvent] = useState<BDGEvent | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userTickets, setUserTickets] = useState<BetTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);
  
  // Betting slip state
  const [selectedBets, setSelectedBets] = useState<{
    marketId: string;
    outcomeId: string;
    outcomeLabel: string;
    marketTitle: string;
    stake: number;
    quote: number;
  }[]>([]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      if (user) {
        fetchUserTickets();
      }
    }
  }, [eventId, user]);

  // Real-time updates for markets
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel('market-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'outcome',
        filter: `market_id=in.(${markets.map(m => m.id).join(',')})`
      }, (payload) => {
        // Update market pools in real-time
        setMarkets(prev => prev.map(market => ({
          ...market,
          outcomes: market.outcomes.map(outcome => 
            outcome.id === payload.new.id 
              ? { ...outcome, pool: payload.new.pool }
              : outcome
          )
        })));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [markets, eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('bdg_event')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch markets with outcomes
      const { data: marketsData, error: marketsError } = await supabase
        .from('market')
        .select(`
          *,
          outcome (*)
        `)
        .eq('event_id', eventId)
        .order('created_at');

      if (marketsError) throw marketsError;
      
      const processedMarkets = marketsData?.map(market => ({
        ...market,
        outcomes: (market.outcome as any[])?.sort((a, b) => a.sort_order - b.sort_order) || []
      })) || [];

      setMarkets(processedMarkets);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bet_ticket')
        .select(`
          *,
          outcome (label),
          market (title)
        `)
        .eq('user_id', user.id)
        .in('market_id', markets.map(m => m.id));

      if (error) throw error;
      setUserTickets(data || []);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
    }
  };

  const calculateQuote = useCallback((market: Market, outcome: Outcome) => {
    // Use real-time pool data if available
    const realtimePool = getPoolForOutcome(outcome.id);
    const currentPool = realtimePool > 0 ? realtimePool : outcome.pool;
    
    const totalPool = market.outcomes.reduce((sum, o) => {
      const oPool = getPoolForOutcome(o.id);
      return sum + (oPool > 0 ? oPool : o.pool);
    }, 0);
    
    const epsilon = 1; // Liquidity seed
    const effectivePool = currentPool + epsilon;
    const netPool = totalPool * (1 - market.rake);
    
    if (effectivePool === 0) return 1.00;
    return Math.max(1.00, netPool / effectivePool);
  }, [getPoolForOutcome]);

  const addToBettingSlip = (market: Market, outcome: Outcome) => {
    if (!user) {
      toast({
        title: 'Inicia Sesión',
        description: 'Debes iniciar sesión para apostar',
        variant: 'destructive',
      });
      return;
    }

    // Check available balance
    const availableBalance = getAvailableBalance('BDG');
    if (availableBalance < market.min_stake) {
      toast({
        title: 'Saldo Insuficiente',
        description: `Necesitas al menos $${market.min_stake} para apostar`,
        variant: 'destructive',
      });
      return;
    }

    const existingBet = selectedBets.find(bet => 
      bet.marketId === market.id && bet.outcomeId === outcome.id
    );

    if (existingBet) {
      // Remove from slip
      setSelectedBets(prev => prev.filter(bet => 
        !(bet.marketId === market.id && bet.outcomeId === outcome.id)
      ));
    } else {
      // Add to slip
      const quote = calculateQuote(market, outcome);
      setSelectedBets(prev => [...prev, {
        marketId: market.id,
        outcomeId: outcome.id,
        outcomeLabel: outcome.label,
        marketTitle: market.title,
        stake: market.min_stake,
        quote
      }]);
    }
  };

  const updateBetStake = (marketId: string, outcomeId: string, stake: number) => {
    setSelectedBets(prev => prev.map(bet => 
      bet.marketId === marketId && bet.outcomeId === outcomeId 
        ? { ...bet, stake }
        : bet
    ));
  };

  const placeBets = async () => {
    if (!user || selectedBets.length === 0) return;

    try {
      setBetting(true);
      
      for (const bet of selectedBets) {
        const ticketId = await placeBet(bet.marketId, bet.outcomeId, bet.stake);
        
        if (!ticketId) {
          // Error already shown by placeBet hook
          continue;
        }
      }

      setSelectedBets([]);
      fetchUserTickets();
      fetchEventData(); // Refresh pools
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron colocar las apuestas',
        variant: 'destructive',
      });
    } finally {
      setBetting(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'live': case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'settled': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline?.toLowerCase()) {
      case 'boxing': return <Shield className="h-4 w-4" />;
      case 'rap': return <Mic className="h-4 w-4" />;
      case 'chess': return <Zap className="h-4 w-4" />;
      case 'esports': return <Gamepad className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-64"></div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/predicciones" replace />;
  }

  const totalSelectedStake = selectedBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalPotentialPayout = selectedBets.reduce((sum, bet) => sum + (bet.stake * bet.quote), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link to="/predicciones" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          Volver a Predicciones
        </Link>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {getDisciplineIcon(event.discipline)}
                <div>
                <h1 className="text-3xl font-bold text-white">{event.name}</h1>
                <p className="text-gray-400">{event.discipline} • {event.venue}</p>
              </div>
            </div>
            <Badge className={getStateColor(event.state)}>
              {event.state === 'live' && <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>}
              {event.state.toUpperCase()}
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-gray-300 mb-4">{event.description}</p>
          )}
          
          <div className="flex gap-6 text-sm text-gray-400">
            {event.start_time && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(event.start_time).toLocaleDateString('es', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.venue}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Markets */}
          <div className="lg:col-span-2 space-y-6">
            {markets.map((market) => (
              <Card key={market.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-white">{market.title}</CardTitle>
                      {market.description && (
                        <CardDescription className="text-gray-400">
                          {market.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Badge className={getStateColor(market.state)}>
                          {market.state}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        {market.kind} • Rake: {(market.rake * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-3">
                    {market.outcomes.map((outcome) => {
                      const quote = calculateQuote(market, outcome);
                      // Use real-time pool if available
                      const currentPool = getPoolForOutcome(outcome.id) || outcome.pool;
                      const realtimeState = getMarketState(market.id) || market.state;
                      
                      const isSelected = selectedBets.some(bet => 
                        bet.marketId === market.id && bet.outcomeId === outcome.id
                      );
                      
                      return (
                        <Button
                          key={outcome.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`justify-between h-auto p-4 ${
                            isSelected 
                              ? 'bg-orange-600 hover:bg-orange-700 border-orange-500' 
                              : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                          } ${realtimeState !== 'open' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => addToBettingSlip(market, outcome)}
                          disabled={realtimeState !== 'open' || !outcome.active}
                        >
                          <div className="text-left">
                            <div className="font-medium">{outcome.label}</div>
                            <div className="text-sm opacity-75 flex items-center gap-2">
                              Pool: ${currentPool.toFixed(2)}
                              {getPoolForOutcome(outcome.id) !== outcome.pool && (
                                <span className="text-xs bg-green-600 px-1 rounded">LIVE</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{quote.toFixed(2)}x</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  
                  {(getMarketState(market.id) || market.state) === 'suspended' && (
                    <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Mercado suspendido temporalmente</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Betting Slip & Wallet */}
          <div className="space-y-6">
            {/* Wallet Display */}
            <WalletDisplay compact />
            
            {/* Real-time Connection Status */}
            {!isConnected && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Conectando a actualizaciones en tiempo real...</span>
                </div>
              </div>
            )}

            <Card className="bg-gray-900 border-gray-800 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Betting Slip
                </CardTitle>
                <CardDescription>
                  {selectedBets.length === 0 
                    ? 'Selecciona outcomes para apostar'
                    : `${selectedBets.length} apuesta(s) seleccionada(s)`
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {selectedBets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Haz click en las cuotas para añadir apuestas</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3">
                        {selectedBets.map((bet, index) => (
                          <div key={`${bet.marketId}-${bet.outcomeId}`} className="p-3 bg-gray-800 rounded border border-gray-700">
                            <div className="text-sm font-medium text-white mb-1">
                              {bet.outcomeLabel}
                            </div>
                            <div className="text-xs text-gray-400 mb-2">
                              {bet.marketTitle}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-orange-400">
                                {bet.quote.toFixed(2)}x
                              </span>
                              <Input
                                type="number"
                                min={markets.find(m => m.id === bet.marketId)?.min_stake || 1}
                                step="0.1"
                                value={bet.stake}
                                onChange={(e) => updateBetStake(bet.marketId, bet.outcomeId, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-xs bg-black border-gray-600"
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Payout potencial: ${(bet.stake * bet.quote).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Stake:</span>
                        <span className="font-medium">${totalSelectedStake.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Payout Potencial:</span>
                        <span className="font-medium text-green-400">${totalPotentialPayout.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      onClick={placeBets}
                      disabled={betting || !user || getAvailableBalance('BDG') < totalSelectedStake}
                    >
                      {betting ? 'Colocando...' : 
                       !user ? 'Inicia Sesión para Apostar' :
                       getAvailableBalance('BDG') < totalSelectedStake ? 'Saldo Insuficiente' :
                       `Apostar $${totalSelectedStake.toFixed(2)}`}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Tickets */}
            {user && userTickets.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Mis Apuestas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {userTickets.map((ticket) => (
                        <div key={ticket.id} className="p-2 bg-gray-800 rounded text-sm">
                          <div className="font-medium">{ticket.outcome?.label}</div>
                          <div className="text-gray-400 text-xs">{ticket.market?.title}</div>
                          <div className="flex justify-between mt-1">
                            <span>${ticket.stake}</span>
                            <Badge variant="outline" className="text-xs">
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}