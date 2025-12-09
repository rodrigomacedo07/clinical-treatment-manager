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
        status: 'in_attendance',
      })
      .eq('id', sessionId)
      .select()
      .single(); // Usamos single() para garantir que estamos atualizando um único registro

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    console.error("Erro ao iniciar atendimento:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}