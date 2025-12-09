import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
  request: NextRequest, // Use NextRequest em vez de Request
  { params }: { params: Promise<{ id: string }> } // Params agora é uma Promise
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID não fornecido" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}