import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }
    
    // Vytvoření Supabase klienta
    const supabase = createRouteHandlerClient({ cookies });
    
    // Získání informací o session
    const { data: session, error: sessionError } = await supabase
      .from('verification_sessions')
      .select(`
        id,
        status,
        verification_result,
        created_at,
        expires_at,
        verification_method,
        verification_details
      `)
      .eq('id', session_id)
      .single();
    
    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Kontrola expirace
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({
        status: 'error',
        message: 'Session expired'
      });
    }
    
    // Vrácení stavu podle statusu session
    if (session.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        verified: session.verification_result === 'approved',
        method: session.verification_method,
        details: session.verification_details
      });
    } else if (session.status === 'in_progress') {
      // Výpočet přibližného postupu na základě času
      const startTime = new Date(session.created_at).getTime();
      const expiryTime = new Date(session.expires_at).getTime();
      const currentTime = Date.now();
      const totalDuration = expiryTime - startTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 90); // Max 90% pro in_progress
      
      return NextResponse.json({
        status: 'in_progress',
        progress
      });
    } else if (session.status === 'error') {
      return NextResponse.json({
        status: 'error',
        message: session.verification_details?.error || 'Verification failed'
      });
    } else {
      // Pending status
      return NextResponse.json({
        status: 'pending',
        progress: 0
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 