// ========================================================================
// ARQUIVO DE API PARA NEXT.JS: src/app/api/applications/route.ts
// ========================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criamos o cliente Supabase Admin para operações seguras no servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// No App Router, exportamos funções com o nome do método HTTP (POST, GET, etc.)
export async function POST(request: Request) {
  try {
    // Pegamos os dados que o formulário nos enviou
    const body = await request.json();
    const { patient_id, nurse_id, weight, applications_to_save } = body;

    // **A LÓGICA DA TRANSAÇÃO**
    // A chamada para a função no banco de dados continua exatamente a mesma
    const { data, error } = await supabaseAdmin.rpc('create_application_and_update_balance', {
      p_patient_id: patient_id,
      p_nurse_id: nurse_id,
      p_weight: weight,
      p_applications: applications_to_save
    });
    
    if (error) {
      console.error('Erro na função RPC do Supabase:', error);
      // Retorna um erro com uma mensagem clara
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Se tudo deu certo, retornamos uma resposta de sucesso
    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    console.error('Erro inesperado na API:', error);
    // Se qualquer outro erro acontecer, retornamos um erro genérico
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}