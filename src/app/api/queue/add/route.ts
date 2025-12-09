import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      throw new Error("ID do paciente é obrigatório.");
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({ 
        patient_id: patientId,
        status: 'waiting',
        check_in_time: now,
        // created_at será preenchido por padrão pelo Postgres
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    console.error("Erro ao adicionar paciente à fila:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}