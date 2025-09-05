import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: 'es' | 'en';
  function_called?: string;
}

interface AIResponse {
  response: string;
  language: 'es' | 'en';
  function_called?: string;
  conversation_id?: string;
}

export const useAIAssistant = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse | null> => {
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const history = conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('admin-ai-assistant', {
        body: {
          message,
          conversation_history: history,
          conversation_id: conversationId
        }
      });

      if (error) {
        console.error('AI Assistant Error:', error);
        throw new Error(error.message || 'Error connecting to AI assistant');
      }

      if (!data) {
        throw new Error('No response from AI assistant');
      }

      // Update conversation ID if provided
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      return {
        response: data.response || 'Lo siento, encontré un error procesando tu solicitud.',
        language: data.language || 'es',
        function_called: data.function_called,
        conversation_id: data.conversation_id
      };

    } catch (error) {
      console.error('Error in AI Assistant:', error);
      
      toast({
        title: "Error de AI",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, toast]);

  const resetConversation = useCallback(() => {
    setConversationId(null);
  }, []);

  // Quick action functions for common administrative tasks
  const quickActions = {
    searchFighters: (criteria?: string) => 
      sendMessage(`Buscar peleadores${criteria ? ` con criterio: ${criteria}` : ''}`),
    
    getSystemStats: () => 
      sendMessage('Mostrar estadísticas actuales del sistema'),
    
    checkPendingLicenses: () => 
      sendMessage('Revisar licencias pendientes de aprobación'),
    
    createTournament: (details?: string) => 
      sendMessage(`Crear un nuevo torneo${details ? ` con: ${details}` : ''}`),
    
    generateReport: (type?: string) => 
      sendMessage(`Generar reporte${type ? ` de ${type}` : ' del sistema'}`),
  };

  return {
    sendMessage,
    resetConversation,
    quickActions,
    isLoading,
    conversationId
  };
};