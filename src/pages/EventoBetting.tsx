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
  pool: number;
  active: boolean;
}

interface SelectedBet {
  marketId: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  quote: number;
  stake: number;
}

export default function EventoBetting() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getAvailableBalance } = useWallet();
  const { 
    getPoolForOutcome, 
    getMarketState, 
    isConnected 
  } = useRealtimeBetting(eventId || '');

  const [event, setEvent] = useState<BDGEvent | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);

  // Fetch event + markets
  useEffect(() => {
    if (!eventId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
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
            id, title, description, kind, state, rake, min_stake, max_stake,
            outcome(id, label, pool, active)
          `)
          .eq('event_id', eventId)
          .order('created_at');

        if (marketsError) throw marketsError;
        setMarkets(
          (marketsData || []).map((m: any) => ({
            ...m,
            outcomes: m.outcome || [],
          }))
        );

        // Fetch user tickets
        if (user) {
          const { data: tickets } = await supabase
            .from('bet_ticket')
            .select(`
              id, stake, status, price_locked, potential_payout,
              market:market_id(title),
              outcome:outcome_id(label)
            `)
            .eq('user_id', user.id)
            .in('market_id', (marketsData || []).map((m: any) => m.id));
          
          setUserTickets(tickets || []);
        }
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, user]);

  const calculateQuote = useCallback((market: Market, outcome: Outcome) => {
    const totalPool = market.outcomes.reduce((sum, o) => {
      const currentPool = getPoolForOutcome(o.id) || o.pool;
      return sum + currentPool;
    }, 0);
    const currentPool = getPoolForOutcome(outcome.id) || outcome.pool;
    
    if (currentPool === 0 || totalPool === 0) return 2.0;
    
    const rawQuote = totalPool / currentPool;
    return rawQuote * (1 - market.rake);
  }, [getPoolForOutcome]);

  const addToBettingSlip = (market: Market, outcome: Outcome) => {
    const exists = selectedBets.find(
      bet => bet.marketId === market.id && bet.outcomeId === outcome.id
    );

    if (exists) {
      setSelectedBets(selectedBets.filter(
        bet => !(bet.marketId === market.id && bet.outcomeId === outcome.id)
      ));
      return;
    }

    // Remove other bets on same market
    const filtered = selectedBets.filter(bet => bet.marketId !== market.id);
    
    setSelectedBets([...filtered, {
      marketId: market.id,
      marketTitle: market.title,
      outcomeId: outcome.id,
      outcomeLabel: outcome.label,
      quote: calculateQuote(market, outcome),
      stake: market.min_stake,
    }]);
  };

  const updateBetStake = (marketId: string, outcomeId: string, stake: number) => {
    setSelectedBets(selectedBets.map(bet => 
      bet.marketId === marketId && bet.outcomeId === outcomeId
        ? { ...bet, stake }
        : bet
    ));
  };

  const placeBets = async () => {
    if (!user) {
      toast({
        title: 'Inicia Sesión',
        description: 'Necesitas una cuenta para apostar',
        variant: 'destructive',
      });
      return;
    }

    setBetting(true);
    try {
      for (const bet of selectedBets) {
        const { error } = await supabase.from('bet_ticket').insert({
          user_id: user.id,
          market_id: bet.marketId,
          outcome_id: bet.outcomeId,
          stake: bet.stake,
          price_locked: bet.quote,
          potential_payout: bet.stake * bet.quote,
          ip_address: '0.0.0.0',
        });

        if (error) throw error;
      }

      toast({
        title: '¡Apuestas Colocadas!',
        description: `${selectedBets.length} apuesta(s) registrada(s)`,
      });
      setSelectedBets([]);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setBetting(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'live': case 'open': return 'bg-fighter-success/20 text-fighter-success border-fighter-success/30';
      case 'suspended': return 'bg-fighter-warning/20 text-fighter-warning border-fighter-warning/30';
      case 'closed': return 'bg-fighter-info/20 text-fighter-info border-fighter-info/30';
      case 'settled': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline?.toLowerCase()) {
      case 'mma': return <Shield className="h-4 w-4" />;
      case 'boxeo': case 'boxing': return <Shield className="h-4 w-4" />;
      case 'kickboxing': return <Zap className="h-4 w-4" />;
      case 'muay-thai': case 'muay thai': return <Zap className="h-4 w-4" />;
      case 'jiu-jitsu': case 'jiujitsu': return <Shield className="h-4 w-4" />;
      case 'judo': return <Shield className="h-4 w-4" />;
      case 'karate': return <Zap className="h-4 w-4" />;
      case 'taekwondo': return <Zap className="h-4 w-4" />;
      case 'grappling': return <Shield className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-muted rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-muted rounded-lg"></div>
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link to="/predicciones" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Volver a Predicciones
        </Link>

        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {getDisciplineIcon(event.discipline)}
                <div>
                <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
                <p className="text-muted-foreground">{event.discipline} • {event.venue}</p>
              </div>
            </div>
            <Badge className={getStateColor(event.state)}>
              {event.state === 'live' && <div className="w-2 h-2 rounded-full bg-fighter-success mr-2"></div>}
              {event.state.toUpperCase()}
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-muted-foreground mb-4">{event.description}</p>
          )}
          
          <div className="flex gap-6 text-sm text-muted-foreground">
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
              <Card key={market.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-foreground">{market.title}</CardTitle>
                      {market.description && (
                        <CardDescription className="text-muted-foreground">
                          {market.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
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
                              ? 'bg-primary hover:bg-primary/90 border-primary' 
                              : 'bg-secondary border-border hover:bg-muted'
                          } ${realtimeState !== 'open' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => addToBettingSlip(market, outcome)}
                          disabled={realtimeState !== 'open' || !outcome.active}
                        >
                          <div className="text-left">
                            <div className="font-medium">{outcome.label}</div>
                            <div className="text-sm opacity-75 flex items-center gap-2">
                              Pool: ${currentPool.toFixed(2)}
                              {getPoolForOutcome(outcome.id) !== outcome.pool && (
                                <span className="text-xs bg-fighter-success px-1 rounded">LIVE</span>
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
                    <div className="mt-4 p-3 bg-fighter-warning/10 border border-fighter-warning/30 rounded-lg">
                      <div className="flex items-center gap-2 text-fighter-warning">
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
              <div className="p-3 bg-fighter-warning/10 border border-fighter-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-fighter-warning text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Conectando a actualizaciones en tiempo real...</span>
                </div>
              </div>
            )}

            <Card className="bg-card border-border sticky top-6">
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Haz click en las cuotas para añadir apuestas</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-64">
                      <div className="space-y-3">
                        {selectedBets.map((bet, index) => (
                          <div key={`${bet.marketId}-${bet.outcomeId}`} className="p-3 bg-secondary rounded border border-border">
                            <div className="text-sm font-medium text-foreground mb-1">
                              {bet.outcomeLabel}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {bet.marketTitle}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-primary">
                                {bet.quote.toFixed(2)}x
                              </span>
                              <Input
                                type="number"
                                min={markets.find(m => m.id === bet.marketId)?.min_stake || 1}
                                step="0.1"
                                value={bet.stake}
                                onChange={(e) => updateBetStake(bet.marketId, bet.outcomeId, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-xs bg-background border-border"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Payout potencial: ${(bet.stake * bet.quote).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator className="bg-border" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Stake:</span>
                        <span className="font-medium">${totalSelectedStake.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Payout Potencial:</span>
                        <span className="font-medium text-fighter-success">${totalPotentialPayout.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-destructive hover:from-primary/90 hover:to-destructive/90"
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Mis Apuestas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {userTickets.map((ticket) => (
                        <div key={ticket.id} className="p-2 bg-secondary rounded text-sm">
                          <div className="font-medium">{ticket.outcome?.label}</div>
                          <div className="text-muted-foreground text-xs">{ticket.market?.title}</div>
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
