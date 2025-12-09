import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, cpf, birthDate, email, phone, clinicalNotes } = body;

    // Validação básica de Backend
    if (!fullName || !cpf) {
      return NextResponse.json({ success: false, error: "Nome e CPF são obrigatórios" }, { status: 400 });
    }

    // Remove formatação do CPF para salvar apenas números (opcional, mas recomendado para padronização)
    // const cleanCpf = cpf.replace(/\D/g, ''); 
    // Decisão: Vamos manter formatado por enquanto para consistência com a busca atual

    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert({
        full_name: fullName,
        cpf: cpf,
        birth_date: birthDate || null,
        contact_info: { email, phone }, // Salvando como JSONB conforme arquitetura
        clinical_notes: clinicalNotes,
      })
      .select()
      .single();

    if (error) {
      // Tratamento de erro de duplicidade (CPF único)
      if (error.code === '23505') {
        throw new Error("Já existe um paciente cadastrado com este CPF.");
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Erro ao criar paciente:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}