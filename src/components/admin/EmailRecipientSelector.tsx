import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, UserPlus, Mail, Loader2 } from "lucide-react";

interface Recipient {
  email: string;
  name?: string;
  avatarUrl?: string;
  isExternal?: boolean;
}

interface EmailRecipientSelectorProps {
  selectedRecipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
}

interface FighterResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  app_user: { email: string } | null;
}

export default function EmailRecipientSelector({
  selectedRecipients,
  onRecipientsChange,
}: EmailRecipientSelectorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FighterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

  // Debounced search
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fighter_profiles")
          .select(`
            id,
            first_name,
            last_name,
            nickname,
            avatar_url,
            app_user!inner(email)
          `)
          .eq("active", true)
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,nickname.ilike.%${search}%`)
          .limit(10);

        if (error) throw error;
        setResults((data as FighterResult[]) || []);
      } catch (error) {
        console.error("Error searching fighters:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const addFighter = (fighter: FighterResult) => {
    const email = fighter.app_user?.email;
    if (!email) return;

    // Check if already added
    if (selectedRecipients.some((r) => r.email === email)) return;

    const name = [fighter.first_name, fighter.last_name].filter(Boolean).join(" ");
    onRecipientsChange([
      ...selectedRecipients,
      {
        email,
        name: name || fighter.nickname || "Sin nombre",
        avatarUrl: fighter.avatar_url || undefined,
        isExternal: false,
      },
    ]);
    setSearch("");
    setResults([]);
  };

  const addManualEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualEmail)) return;

    // Check if already added
    if (selectedRecipients.some((r) => r.email === manualEmail)) {
      setManualEmail("");
      setShowManualInput(false);
      return;
    }

    onRecipientsChange([
      ...selectedRecipients,
      {
        email: manualEmail,
        isExternal: true,
      },
    ]);
    setManualEmail("");
    setShowManualInput(false);
  };

  const removeRecipient = (email: string) => {
    onRecipientsChange(selectedRecipients.filter((r) => r.email !== email));
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar peleador por nombre..."
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
          {results.map((fighter) => {
            const email = fighter.app_user?.email;
            const isSelected = email && selectedRecipients.some((r) => r.email === email);
            const name = [fighter.first_name, fighter.last_name].filter(Boolean).join(" ");

            return (
              <button
                key={fighter.id}
                onClick={() => addFighter(fighter)}
                disabled={isSelected || !email}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={fighter.avatar_url || undefined} />
                  <AvatarFallback>
                    {(fighter.first_name?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {name || fighter.nickname || "Sin nombre"}
                    {fighter.nickname && name && (
                      <span className="text-muted-foreground ml-1">"{fighter.nickname}"</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {email || "Sin email"}
                  </p>
                </div>
                {isSelected && (
                  <Badge variant="secondary" className="text-xs">
                    Agregado
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected recipients */}
      {selectedRecipients.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Destinatarios ({selectedRecipients.length}):
          </p>
          <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
            {selectedRecipients.map((recipient) => (
              <div
                key={recipient.email}
                className="flex items-center gap-3 p-2"
              >
                {recipient.isExternal ? (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={recipient.avatarUrl} />
                    <AvatarFallback>
                      {(recipient.name?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  {recipient.name ? (
                    <>
                      <p className="text-sm font-medium truncate">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {recipient.email}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{recipient.email}</p>
                      <p className="text-xs text-muted-foreground">Email externo</p>
                    </>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => removeRecipient(recipient.email)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedRecipients.length === 0 && results.length === 0 && !search && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay destinatarios seleccionados
        </p>
      )}

      {/* Manual email input */}
      {showManualInput ? (
        <div className="flex gap-2">
          <Input
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            onKeyDown={(e) => e.key === "Enter" && addManualEmail()}
          />
          <Button onClick={addManualEmail} size="sm">
            Agregar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowManualInput(false);
              setManualEmail("");
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualInput(true)}
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar email manualmente
        </Button>
      )}
    </div>
  );
}
