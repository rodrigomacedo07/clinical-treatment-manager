import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos as credenciais de administrador para operações de backend
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

    const { error } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao remover da fila:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}