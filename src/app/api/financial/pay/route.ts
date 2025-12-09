import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, total_paid, payments } = body;

    // Montar descrição rica baseada nos métodos usados
    // Ex: "Pagamento: Pix (R$ 100), Dinheiro (R$ 50)"
    const paymentDetails = payments.map((p: any) => {
        const methodMap: any = { pix: 'Pix', credit: 'Crédito', debit: 'Débito', cash: 'Dinheiro' };
        const label = methodMap[p.method] || p.method;
        const install = p.installments > 1 ? ` (${p.installments}x)` : '';
        return `${label}${install}`;
    }).join(', ');

    const description = `Pagamento Recebido: ${paymentDetails}`;

    // 1. Criar entrada MESTRE no Ledger (Crédito)
    const { data: ledgerEntry, error: ledgerError } = await supabaseAdmin
      .from('financial_ledger')
      .insert({
        patient_id,
        type: 'payment',
        amount: -Math.abs(total_paid),
        description: description, // Descrição rica
      })
      .select()
      .single();

    if (ledgerError) throw ledgerError;

    // 2. Salvar detalhes dos métodos
    const methodInserts = payments.map((p: any) => ({
      ledger_id: ledgerEntry.id,
      method: p.method,
      amount_paid: p.amount,
      installments: p.installments || 1
    }));

    const { error: methodsError } = await supabaseAdmin
      .from('payment_methods')
      .insert(methodInserts);

    if (methodsError) throw methodsError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro no pagamento:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}