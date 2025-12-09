import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Buscar dados do paciente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .eq('id', id)
      .single();

    if (patientError) throw patientError;

    // 2. Buscar o Ledger (Extrato)
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from('financial_ledger')
      .select(`
        *,
        payment_methods (
          method,
          amount_paid,
          installments
        )
      `)
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (ledgerError) throw ledgerError;

    return NextResponse.json({ success: true, data: { patient, ledger } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}