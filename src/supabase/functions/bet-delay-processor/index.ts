import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing bet delay queue...')

    // Get pending bets that are ready to be processed
    const { data: pendingBets, error: fetchError } = await supabaseClient
      .from('bet_delay_queue')
      .select(`
        id,
        ticket_id,
        process_at,
        bet_ticket (
          id,
          market_id,
          outcome_id,
          stake,
          status,
          user_id
        )
      `)
      .eq('status', 'PENDING')
      .lte('process_at', new Date().toISOString())
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${pendingBets?.length || 0} bets to process`)

    let processed = 0
    let cancelled = 0
    let errors = 0

    for (const queueItem of pendingBets || []) {
      try {
        // Check if ticket still exists and is valid
        if (!queueItem.bet_ticket) {
          console.log(`Ticket not found for queue item ${queueItem.id}`)
          continue
        }

        const ticket = queueItem.bet_ticket as any
        console.log(`Processing ticket ${ticket.id} with status ${ticket.status}`)

        // Only process if still in PENDING_DELAY status
        if (ticket.status !== 'PENDING_DELAY') {
          console.log(`Ticket ${ticket.id} no longer in PENDING_DELAY status: ${ticket.status}`)
          
          // Mark queue item as processed
          await supabaseClient
            .from('bet_delay_queue')
            .update({ status: 'PROCESSED' })
            .eq('id', queueItem.id)
          
          continue
        }

        // Call the confirm_bet_after_delay function
        const { error: confirmError } = await supabaseClient.rpc(
          'confirm_bet_after_delay',
          { p_ticket_id: ticket.id }
        )

        if (confirmError) {
          console.error(`Error confirming bet ${ticket.id}:`, confirmError)
          errors++
          continue
        }

        // Mark queue item as processed
        const { error: updateError } = await supabaseClient
          .from('bet_delay_queue')
          .update({ status: 'PROCESSED' })
          .eq('id', queueItem.id)

        if (updateError) {
          console.error(`Error updating queue item ${queueItem.id}:`, updateError)
          errors++
          continue
        }

        // Check final ticket status to count as processed or cancelled
        const { data: finalTicket } = await supabaseClient
          .from('bet_ticket')
          .select('status')
          .eq('id', ticket.id)
          .single()

        if (finalTicket?.status === 'ACCEPTED') {
          processed++
          console.log(`✅ Bet ${ticket.id} confirmed and accepted`)
        } else if (finalTicket?.status === 'CANCELLED') {
          cancelled++
          console.log(`❌ Bet ${ticket.id} cancelled (market suspended/closed)`)
        }

      } catch (error) {
        console.error(`Error processing queue item ${queueItem.id}:`, error)
        errors++
      }
    }

    // Cleanup old processed items (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { error: cleanupError } = await supabaseClient
      .from('bet_delay_queue')
      .delete()
      .eq('status', 'PROCESSED')
      .lt('created_at', oneHourAgo)

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError)
    } else {
      console.log('✅ Cleaned up old processed queue items')
    }

    const result = {
      success: true,
      processed,
      cancelled,
      errors,
      total: pendingBets?.length || 0,
      timestamp: new Date().toISOString()
    }

    console.log('Processing complete:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Bet delay processor error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
});