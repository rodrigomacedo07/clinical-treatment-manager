import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Ajustamos a tipagem para refletir que params é uma Promise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CORREÇÃO CRÍTICA: Aguardamos a resolução dos parâmetros
    const { id } = await params;
    const patientId = id;

    // Validação simples
    if (!patientId) {
      return NextResponse.json({ success: false, error: "ID obrigatório" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .eq('id', patientId)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Erro API Patient:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}