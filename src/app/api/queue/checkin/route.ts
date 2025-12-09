import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      throw new Error("ID da sessão é obrigatório.");
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update({ 
        status: 'waiting', 
        check_in_time: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}