import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("--- INÍCIO DO REGISTRO DE APLICAÇÃO ---");
    console.log("Dados Recebidos (Body):", JSON.stringify(body, null, 2));

// Adicione session_id na desestruturação
    const { patient_id, session_id: incomingSessionId, weight, applications_to_save, adhoc_applications, signature } = body;

    // 1. Gestão de Sessão
    let sessionId = incomingSessionId; // Prioriza o ID que veio do front

    if (!sessionId) {
        // Se não veio (fallback), tenta buscar ou criar como antes
        let { data: session } = await supabaseAdmin
            .from('sessions')
            .select('id')
            .eq('patient_id', patient_id)
            .in('status', ['waiting', 'in_attendance']) // Busca apenas abertas
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        sessionId = session?.id;

        if (!sessionId) {
            // Cria nova
            const { data: newSession, error: createError } = await supabaseAdmin
                .from('sessions')
                .insert({ patient_id, status: 'in_attendance', weight })
                .select()
                .single();
            if (createError) throw createError;
            sessionId = newSession.id;
        }
    }

    // 2. Assinatura (Mantida)
    let signatureUrl = null;
    if (signature) {
        const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${sessionId}_${Date.now()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage.from('signatures').upload(fileName, buffer, { contentType: 'image/png', upsert: true });
        if (!uploadError) {
            const { data: urlData } = supabaseAdmin.storage.from('signatures').getPublicUrl(fileName);
            signatureUrl = urlData.publicUrl;
        }
    }

    // 3. Atualizar Sessão
    await supabaseAdmin
        .from('sessions')
        .update({ weight, status: 'completed', signature_url: signatureUrl }) 
        .eq('id', sessionId);

    // 4. Processar PACOTES
    if (applications_to_save && applications_to_save.length > 0) {
        console.log(`Processando ${applications_to_save.length} pacotes...`);
        
        for (const app of applications_to_save) {
            console.log("Tentando inserir aplicação:", app);
            
            // Inserção na tabela applications
            const insertPayload = {
                session_id: sessionId,
                patient_package_id: app.package_id,
                amount_applied: app.amount_applied,
                // weight: weight // Removido pois peso fica na sessão, a menos que sua tabela exija
            };

            const { data: insertData, error: appError } = await supabaseAdmin
                .from('applications')
                .insert(insertPayload)
                .select();

            if (appError) {
                console.error("ERRO ao inserir na tabela applications:", appError);
                // Não vamos dar throw aqui para tentar processar os outros, mas logamos forte
            } else {
                console.log("Aplicação inserida com sucesso:", insertData);
                
                // Atualizar saldo
                const { data: pkg } = await supabaseAdmin.from('patient_packages').select('remaining_amount').eq('id', app.package_id).single();
                if (pkg) {
                    const newBalance = pkg.remaining_amount - app.amount_applied;
                    await supabaseAdmin.from('patient_packages').update({ remaining_amount: newBalance }).eq('id', app.package_id);
                    console.log(`Saldo atualizado. Pacote ${app.package_id}: ${pkg.remaining_amount} -> ${newBalance}`);
                }
            }
        }
    }

// 5. Processar Avulsas e Gerar Cobrança
    if (adhoc_applications && adhoc_applications.length > 0) {
        for (const app of adhoc_applications) {
            // A. Insere histórico clínico
            await supabaseAdmin.from('adhoc_applications').insert({
                session_id: sessionId,
                treatment_name: app.treatment_name,
                amount_applied: app.amount_applied,
                treatment_unit: app.treatment_unit
            });

            // B. Busca preço do tratamento para cobrar
            // Tentamos achar pelo nome para pegar o preço cadastrado
            const { data: treatmentData } = await supabaseAdmin
                .from('treatments')
                .select('price')
                .eq('id', app.treatment_id) // Idealmente o front deve mandar o ID
                .maybeSingle();
            
            // Se não tiver ID (legado), tenta pelo nome (fallback arriscado, mas útil)
            let price = treatmentData?.price || 0;
            
            if (price > 0) {
                // Calcula total (Preço x Quantidade)
                const totalCharge = price * Number(app.amount_applied);
                
                // C. Insere no Ledger (Dívida)
                await supabaseAdmin.from('financial_ledger').insert({
                    patient_id: patient_id,
                    type: 'charge',
                    amount: totalCharge,
                    description: `Aplicação Avulsa: ${app.treatment_name} (${app.amount_applied} ${app.treatment_unit})`
                });
                console.log(`Cobrança gerada: R$ ${totalCharge}`);
            }
        }
    }

    console.log("--- FIM DO REGISTRO ---");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro FATAL na API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}