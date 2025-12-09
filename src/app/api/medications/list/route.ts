import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const revalidate = 0;

export async function GET() {
  try {
    console.log("Buscando tratamentos disponíveis...");
    
    // CORREÇÃO: Buscamos na tabela 'treatments'
    // e trazemos o nome da medicação relacionada
    const { data: treatmentsData, error } = await supabaseAdmin
      .from('treatments')
      .select(`
        id,
        unit,
        medications (
          name
        )
      `);

    if (error) {
      console.error("Erro Supabase:", error);
      throw error;
    }

    // Transformação de dados:
    // O frontend espera um array de objetos com { id, name, unit }
    // O Supabase retorna { id, unit, medications: { name: '...' } }
    // Vamos mapear para facilitar a vida do frontend.
    
    const formattedData = treatmentsData.map((item: any) => ({
      id: item.id, // Este é o ID do tratamento (que será salvo no pacote)
      name: item.medications?.name || "Nome Desconhecido",
      unit: item.unit
    }));

    // Opcional: Ordenar alfabeticamente
    formattedData.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error: any) {
    console.error("Erro Geral API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}