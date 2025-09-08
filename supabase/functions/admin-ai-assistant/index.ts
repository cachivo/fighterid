import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Language detection
function detectLanguage(text: string): 'es' | 'en' {
  const spanishKeywords = [
    'crear', 'buscar', 'actualizar', 'eliminar', 'torneo', 'peleador', 'licencia',
    'evento', 'pelea', 'resultado', 'ranking', 'estadística', 'ayuda', 'cómo',
    'dónde', 'cuándo', 'qué', 'por qué', 'sí', 'no', 'gracias'
  ];
  
  const lowerText = text.toLowerCase();
  const spanishCount = spanishKeywords.filter(word => lowerText.includes(word)).length;
  
  return spanishCount > 0 ? 'es' : 'en';
}

// System prompts for different languages
function getSystemPrompt(language: 'es' | 'en'): string {
  if (language === 'es') {
    return `Eres un asistente AI especializado en administración de eventos de combate y gestión de Fighter IDs para la plataforma Batalla Digital Gym.

CAPACIDADES PRINCIPALES:
- Gestión de Torneos: Crear, programar, actualizar eventos de combate
- Administración Fighter ID: Búsqueda, validación, actualización de peleadores
- Gestión de Licencias: Revisar, aprobar, suspender licencias
- Reportes y Estadísticas: Generar análisis y métricas del sistema
- Soporte Técnico: Resolver problemas administrativos

FUNCIONES DISPONIBLES:
- search_fighters: Buscar peleadores por criterios específicos
- get_fighter_details: Obtener información detallada de un peleador
- update_fighter_profile: Actualizar perfil de peleador
- validate_license: Validar estado de licencias
- create_tournament: Crear nuevo torneo
- get_system_stats: Obtener estadísticas del sistema
- generate_report: Generar reportes personalizados

INSTRUCCIONES:
1. Siempre responde en español cuando detectes que el usuario escribe en español
2. Usa terminología específica del combate (MMA, Boxeo, etc.)
3. Sé preciso y profesional en las respuestas administrativas
4. Ofrece opciones claras cuando sea posible
5. Solicita confirmación para acciones importantes

Responde de manera profesional y útil, enfocándote en las necesidades administrativas del usuario.`;
  } else {
    return `You are an AI assistant specialized in combat event administration and Fighter ID management for the Batalla Digital Gym platform.

MAIN CAPABILITIES:
- Tournament Management: Create, schedule, update combat events
- Fighter ID Administration: Search, validate, update fighters
- License Management: Review, approve, suspend licenses
- Reports and Statistics: Generate analysis and system metrics
- Technical Support: Resolve administrative issues

AVAILABLE FUNCTIONS:
- search_fighters: Search fighters by specific criteria
- get_fighter_details: Get detailed fighter information
- update_fighter_profile: Update fighter profile
- validate_license: Validate license status
- create_tournament: Create new tournament
- get_system_stats: Get system statistics
- generate_report: Generate custom reports

INSTRUCTIONS:
1. Always respond in English when you detect English input
2. Use specific combat terminology (MMA, Boxing, etc.)
3. Be precise and professional in administrative responses
4. Offer clear options when possible
5. Request confirmation for important actions

Respond professionally and helpfully, focusing on the user's administrative needs.`;
  }
}

// Specialized functions for fighter and tournament management
async function searchFighters(criteria: any) {
  // Implementation would connect to Supabase to search fighters
  return {
    success: true,
    data: [],
    message: "Fighter search functionality available"
  };
}

async function getFighterDetails(fighterId: string) {
  // Implementation would get detailed fighter info
  return {
    success: true,
    data: {},
    message: `Fighter details for ID: ${fighterId}`
  };
}

async function updateFighterProfile(fighterId: string, updates: any) {
  // Implementation would update fighter profile
  return {
    success: true,
    message: "Fighter profile updated successfully"
  };
}

async function validateLicense(licenseId: string) {
  // Implementation would validate license
  return {
    success: true,
    status: "valid",
    message: "License validation completed"
  };
}

async function createTournament(tournamentData: any) {
  // Implementation would create tournament
  return {
    success: true,
    tournamentId: "new-tournament-id",
    message: "Tournament created successfully"
  };
}

async function getSystemStats() {
  // Implementation would get system statistics
  return {
    success: true,
    data: {
      totalFighters: 150,
      activeLicenses: 120,
      upcomingEvents: 5,
      pendingLicenses: 8
    },
    message: "System statistics retrieved"
  };
}

// Function calling handler
async function handleFunctionCall(functionName: string, args: any) {
  console.log(`Calling function: ${functionName}`, args);
  
  try {
    switch (functionName) {
      case 'search_fighters':
        return await searchFighters(args.criteria || {});
      case 'get_fighter_details':
        return await getFighterDetails(args.fighter_id);
      case 'update_fighter_profile':
        return await updateFighterProfile(args.fighter_id, args.updates);
      case 'validate_license':
        return await validateLicense(args.license_id);
      case 'create_tournament':
        return await createTournament(args.tournament_data);
      case 'get_system_stats':
        return await getSystemStats();
      default:
        return {
          success: false,
          error: `Unknown function: ${functionName}`
        };
    }
  } catch (error) {
    console.error(`Error in function ${functionName}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Detect language and get appropriate system prompt
    const language = detectLanguage(message);
    const systemPrompt = getSystemPrompt(language);

    console.log(`Detected language: ${language}`);
    console.log(`Processing message: ${message}`);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Define available functions
    const functions = [
      {
        name: 'search_fighters',
        description: language === 'es' 
          ? 'Buscar peleadores en la base de datos por criterios específicos'
          : 'Search fighters in the database by specific criteria',
        parameters: {
          type: 'object',
          properties: {
            criteria: {
              type: 'object',
              properties: {
                name: { type: 'string', description: language === 'es' ? 'Nombre del peleador' : 'Fighter name' },
                country: { type: 'string', description: language === 'es' ? 'País del peleador' : 'Fighter country' },
                weight_class: { type: 'string', description: language === 'es' ? 'Categoría de peso' : 'Weight class' },
                status: { type: 'string', description: language === 'es' ? 'Estado activo/inactivo' : 'Active/inactive status' }
              }
            }
          }
        }
      },
      {
        name: 'get_fighter_details',
        description: language === 'es'
          ? 'Obtener información detallada de un peleador específico'
          : 'Get detailed information about a specific fighter',
        parameters: {
          type: 'object',
          properties: {
            fighter_id: { 
              type: 'string', 
              description: language === 'es' ? 'ID único del peleador' : 'Unique fighter ID'
            }
          },
          required: ['fighter_id']
        }
      },
      {
        name: 'get_system_stats',
        description: language === 'es'
          ? 'Obtener estadísticas actuales del sistema'
          : 'Get current system statistics',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'validate_license',
        description: language === 'es'
          ? 'Validar el estado de una licencia específica'
          : 'Validate the status of a specific license',
        parameters: {
          type: 'object',
          properties: {
            license_id: {
              type: 'string',
              description: language === 'es' ? 'ID de la licencia a validar' : 'License ID to validate'
            }
          },
          required: ['license_id']
        }
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        functions: functions,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      
      if (errorData.error?.code === 'insufficient_quota') {
        throw new Error('La cuota de OpenAI se ha agotado. Por favor, actualiza tu plan de OpenAI o verifica tu cuenta.');
      }
      
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', data);

    let finalResponse = data.choices[0].message;

    // Handle function calls
    if (finalResponse.function_call) {
      const functionName = finalResponse.function_call.name;
      const functionArgs = JSON.parse(finalResponse.function_call.arguments || '{}');
      
      console.log(`Function call detected: ${functionName}`, functionArgs);
      
      const functionResult = await handleFunctionCall(functionName, functionArgs);
      
      // Make a second call to OpenAI with the function result
      const followUpMessages = [
        ...messages,
        finalResponse,
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResult)
        }
      ];

      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 1500
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        finalResponse = followUpData.choices[0].message;
      }
    }

    return new Response(JSON.stringify({
      response: finalResponse.content,
      language: language,
      function_called: finalResponse.function_call?.name || null,
      conversation_id: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-ai-assistant:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message.includes('cuota de OpenAI') || error.message.includes('insufficient_quota')) {
      errorMessage = 'La cuota de OpenAI se ha agotado. Por favor, actualiza la API key.';
    } else if (error.message.includes('language')) {
      errorMessage = error.message.includes('es') ? 'Error procesando solicitud' : 'Error processing request';
    } else if (error.message.includes('OpenAI')) {
      errorMessage = 'Error de conexión con OpenAI. Verifica la configuración de la API key.';
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});