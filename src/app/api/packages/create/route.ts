import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, items } = body;

    if (!patientId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const packagesToInsert = [];
    const ledgerEntries = []; // Array para guardar as cobranças individuais

    for (const item of items) {
        const { data: treatment } = await supabaseAdmin
            .from('treatments')
            .select('price, medications(name)')
            .eq('id', item.medicationId)
            .single();
        
if (treatment) {
            const price = Number(treatment.price);
            
            // Prepara o pacote
            packagesToInsert.push({
              patient_id: patientId,
              treatment_id: item.medicationId,
              total_amount: item.quantity,
              remaining_amount: item.quantity,
              purchase_date: now,
              frequency_in_days: item.frequencyDays,
              suggested_day_of_week: item.dayOfWeek
            });

            // NOVO: Prepara a cobrança individual se tiver preço
            if (!isNaN(price) && price > 0) {
                // CORREÇÃO DE TIPO AQUI
                const meds = treatment.medications;
                // Se for array, pega o primeiro. Se for objeto, usa direto.
                const medObj = Array.isArray(meds) ? meds[0] : meds;
                const medName = medObj?.name || "Tratamento";

                ledgerEntries.push({
                    patient_id: patientId,
                    type: 'charge',
                    amount: price,
                    description: `Tratamento: ${medName}`,
                    created_at: now
                });
            }
        }
    }

    // 1. Inserir Pacotes
    const { error: pkgError } = await supabaseAdmin
      .from('patient_packages')
      .insert(packagesToInsert);

    if (pkgError) throw pkgError;

    // 2. Inserir Cobranças Individuais no Ledger
    if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabaseAdmin
            .from('financial_ledger')
            .insert(ledgerEntries);
            
        if (ledgerError) console.error("Erro ao salvar no ledger:", ledgerError);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao criar pacotes:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}