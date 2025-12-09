'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2, CalendarDays, AlertCircle, TriangleAlert, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import UserHeader from "@/components/UserHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";

const RegisterApplicationPage = () => {
  // ... (Toda a lógica de estado e useEffects permanece IDÊNTICA, sem alterações funcionais) ...
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const isCreatingSession = useRef(false); // Trava de segurança
  
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [lastWeightText, setLastWeightText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());

  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const [adhocApplications, setAdhocApplications] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdhocTreatment, setSelectedAdhocTreatment] = useState<string | undefined>(undefined);
  const [adhocDose, setAdhocDose] = useState("");
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [appliedDoses, setAppliedDoses] = useState<{ [key: string]: string }>({});
  const [medicationsConfirmed, setMedicationsConfirmed] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const currentDate = new Date().toLocaleDateString("pt-BR");

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    setAdhocDose("");
  }, [selectedAdhocTreatment]);

  useEffect(() => {
    // Só tenta recuperar se os pacotes já tiverem sido carregados
    if (!loading && !draftLoaded) {
      const savedDraft = localStorage.getItem('pendingApplication');
      let hasRestoredDraft = false;

      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          
          // Verifica se o rascunho pertence a este paciente
          if (parsed.patientId === patientId) {
            console.log("Recuperando rascunho...", parsed);
            hasRestoredDraft = true;
            
            // CORREÇÃO 1: Peso deve usar PONTO para input type="number"
            if (parsed.weight) setWeight(parsed.weight.toString()); 

            // 2. Recuperar Doses de Pacotes
             if (availablePackages.length > 0) {
                const restoredDoses: { [key: string]: string } = {};
                const restoredSelection = new Set<string>();

                parsed.applications.forEach((app: any) => {
                  if (app.type === 'package') {
                    restoredDoses[app.packageId] = app.amount.toString();
                    restoredSelection.add(app.packageId);
                  }
                });

                setAppliedDoses(restoredDoses);
                setSelectedPackageIds(restoredSelection);
            } // <--- AQUI: Usa estritamente o rascunho

            // 3. Recuperar Avulsas
            const restoredAdhoc = parsed.applications
              .filter((app: any) => app.type === 'adhoc')
              .map((app: any) => ({
                treatment_name: app.medicationName,
                amount_applied: app.amount,
                treatment_unit: app.unit
              }));
            
            if (restoredAdhoc.length > 0) {
              setAdhocApplications(restoredAdhoc);
            }

            toast({ title: "Rascunho recuperado", description: "Continuando atendimento anterior." });
          }
        } catch (e) {
          console.error("Erro ao recuperar rascunho:", e);
        }
      }

      // --- CENÁRIO: SEM RASCUNHO (Happy Path Padrão) ---
      // Se não recuperou nada, aí sim aplicamos as sugestões automáticas (Tizerpatida, Ferro, etc)
       if (!hasRestoredDraft && availablePackages.length > 0) {
        const defaultSuggestions = availablePackages
            .filter(p => p.isSuggested)
            .map(p => p.id);
        setSelectedPackageIds(new Set(defaultSuggestions));
      }

      setDraftLoaded(true);
    }
  }, [loading, availablePackages, patientId, draftLoaded, toast]); // Removemos a dependência estrita de ter pacotes

  const getAdhocStep = () => {
    if (!selectedAdhocTreatment) return "0.1";
    const treatment = allTreatments.find(t => t.id === selectedAdhocTreatment);
    if (!treatment) return "0.1";
    const isApp = treatment.unit.toLowerCase().includes('aplicação') || treatment.unit.toLowerCase().includes('aplicacao');
    return isApp ? "1" : "0.1";
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    date.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  };

  useEffect(() => {
    async function fetchData() {
      if (!patientId) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select(`*, patient_packages(*, treatments(*, medications(name)))`)
          .eq('id', patientId)
          .single();

        if (patientError) throw patientError;

// --- BUSCA OU CRIA SESSÃO (Garante 'Em Atendimento') ---
        let activeSessionId = null;

        // 1. Tenta achar existente
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('id, status')
          .eq('patient_id', patientId)
          .in('status', ['scheduled', 'waiting', 'in_attendance'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSession) {
            activeSessionId = existingSession.id;
            console.log("Sessão existente:", activeSessionId);
            // Se estava 'waiting', move para 'in_attendance'
            if (['waiting', 'scheduled'].includes(existingSession.status)) {
                await supabase.from('sessions').update({ status: 'in_attendance' }).eq('id', activeSessionId);
            }
} else {
            // 2. Se não tem, CRIA NOVA (Com proteção contra Race Condition)
            if (!isCreatingSession.current) {
                isCreatingSession.current = true; // TRAVA AQUI
                console.log("Criando sessão automática...");
                
                const { data: newSession, error: createError } = await supabase
                    .from('sessions')
                    .insert({
                        patient_id: patientId,
                        status: 'in_attendance',
                        check_in_time: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (!createError) {
                    activeSessionId = newSession.id;
                }
                
                isCreatingSession.current = false; // DESTRAVA (opcional, pois o componente vai remontar ou usar o ID)
            }
        }        
        if (activeSessionId) {
            patientData.activeSessionId = activeSessionId;
        }
        // -----------------------------------------------------

        const { data: treatmentsData } = await supabase
          .from('treatments')
          .select(`id, unit, medications(name)`);
        
        if (treatmentsData) {
            const formattedTreatments = treatmentsData.map((t: any) => ({ id: t.id, name: t.medications?.name, unit: t.unit }));
            setAllTreatments(formattedTreatments);
        }

        if (patientData) {
          setPatient(patientData);
          const activePackages = patientData.patient_packages?.filter((p: any) => p.remaining_amount > 0) || [];
          
          const { data: fullHistory } = await supabase
            .from('sessions')
            .select('weight, created_at')
            .eq('patient_id', patientId)
            .not('weight', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          if (fullHistory && fullHistory.length > 0) {
            const lastSession = fullHistory[0];
            setLastWeight(lastSession.weight);
            setLastWeightText(getRelativeDate(lastSession.created_at));
          }

          const packageIds = activePackages.map((p: any) => p.id);
          let appHistory: any[] = [];

          if (packageIds.length > 0) {
              const { data, error } = await supabase
                .from('applications')
                .select('patient_package_id, amount_applied, created_at')
                .in('patient_package_id', packageIds)
                .order('created_at', { ascending: false }); 

              if (!error) appHistory = data || [];
          }

          const packagesWithInfo = activePackages.map((pkg: any) => {
            const lastApp = appHistory.find((app: any) => app.patient_package_id === pkg.id);
            
            let isSuggested = !lastApp;
            if (lastApp && pkg.frequency_in_days > 0) {
              const lastAppDate = new Date(lastApp.created_at);
              const today = new Date();
              const diffDays = Math.ceil((today.getTime() - lastAppDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= pkg.frequency_in_days) isSuggested = true;
              else isSuggested = false;
            }
            
            return { 
                ...pkg, 
                isSuggested,
                lastAppDate: lastApp ? getRelativeDate(lastApp.created_at) : null,
                lastAppAmount: lastApp ? lastApp.amount_applied : null
            };
          });
          
          setAvailablePackages(packagesWithInfo);
          // --- REMOVA ESTAS DUAS LINHAS ABAIXO ---
          //const suggestedIds = packagesWithInfo.filter((p: any) => p.isSuggested).map((p: any) => p.id);
          //setSelectedPackageIds(new Set(suggestedIds));
          // ---------------------------------------
        }
      } catch (error: any) {
        toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [patientId, toast]);

const handleBackSafe = () => {
    // Apenas salva o que tem no rascunho (se tiver dados)
    // Nota: Como não estamos clicando em submit, pegamos o estado atual dos inputs
    
    // Opcional: Perguntar se quer salvar rascunho? 
    // Ou salvar silenciosamente?
    // Pela nossa discussão anterior: "A enfermeira sai, volta e não perde nada".
    // Então salvamos silenciosamente.
    
    const draftData = {
        patientId,
        sessionId: patient?.activeSessionId,
        weight: parseFloat(weight.replace(',', '.')) || 0,
        applications: [
            ...availablePackages.filter(pkg => selectedPackageIds.has(pkg.id)).map(pkg => ({
                type: 'package',
                packageId: pkg.id,
                amount: parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0")
            })),
            ...adhocApplications.map(app => ({
                type: 'adhoc',
                medicationName: app.treatment_name,
                amount: app.amount_applied,
                treatment_unit: app.treatment_unit
            }))
        ]
    };
    
    // Salva apenas se tiver algo útil (peso ou aplicações)
    if (draftData.weight > 0 || draftData.applications.length > 0) {
        localStorage.setItem('pendingApplication', JSON.stringify(draftData));
        toast({ title: "Rascunho salvo", description: "Você pode retomar este atendimento depois." });
    }

    router.push('/patientlist');
  };

  const handleCancel = async () => {
    const sessionId = patient?.activeSessionId;

    if (!window.confirm("Deseja cancelar e excluir esta sessão?")) return;

    // Limpeza Total
    localStorage.removeItem('pendingApplication');

    if (sessionId) {
        const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);
        
        if (count === 0) {
            await supabase.from('sessions').delete().eq('id', sessionId);
        }
    }
    router.push('/patientlist');
  };

  const handleDoseChange = (packageId: string, value: string) => {
        if (value && parseFloat(value) < 0) {
      return; // Ignora a mudança, mantendo o valor anterior
    }
    setAppliedDoses(prev => ({ ...prev, [packageId]: value }));
  };

  const handleAddAdhocApplication = () => {
    const cleanDose = adhocDose.replace(',', '.');
    if (!selectedAdhocTreatment || !cleanDose || parseFloat(cleanDose) <= 0) {
      toast({ title: "Dados inválidos", description: "Informe uma medicação e dose válida.", variant: "destructive" });
      return;
    }
    const treatmentDetails = allTreatments.find(t => t.id === selectedAdhocTreatment);
    if (!treatmentDetails) return;

    setAdhocApplications(prev => [...prev, {
      treatment_id: treatmentDetails.id,
      treatment_name: treatmentDetails.name,
      treatment_unit: treatmentDetails.unit,
      amount_applied: parseFloat(cleanDose)
    }]);
    setSelectedAdhocTreatment(undefined);
    setAdhocDose("");
    setIsModalOpen(false);
  };

  const handlePackageSelectionChange = (packageId: string) => {
    setSelectedPackageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) newSet.delete(packageId);
      else newSet.add(packageId);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPackages = availablePackages.filter(pkg => selectedPackageIds.has(pkg.id));
    
    const applicationData = {
        patientId,
        sessionId: patient?.activeSessionId,
        weight: parseFloat(weight.replace(',', '.')),
        applications: [
            ...selectedPackages.map(pkg => ({
                type: 'package',
                packageId: pkg.id,
                medicationName: pkg.treatments?.medications?.name,
                amount: parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0"),
                unit: pkg.treatments?.unit,
                previousBalance: pkg.remaining_amount 
            })),
            ...adhocApplications.map(app => ({
                type: 'adhoc',
                treatmentId: app.treatment_id, // <--- SALVA O ID NO RASCUNHO
                medicationName: app.treatment_name,
                amount: app.amount_applied,
                unit: app.treatment_unit,
                previousBalance: 0 
            }))
        ]
    };

    localStorage.setItem('pendingApplication', JSON.stringify(applicationData));
    toast({ title: "Confirmado", description: "Redirecionando para assinatura..." });
    router.push('/patient-signature/${id}');
  };

  const selectedPackages = availablePackages.filter(pkg => selectedPackageIds.has(pkg.id));
  const globalExceedsBalance = selectedPackages.some(pkg => {
      const dose = parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0");
      return dose > pkg.remaining_amount;
  });
  const hasZeroDose = selectedPackages.some(pkg => {
      const dose = parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0");
      return dose <= 0;
  });
  
// Validação Reforçada: Sem negativos
  const weightNumber = parseFloat(weight.replace(',', '.')) || 0;
  const isWeightValid = weight.trim() !== "" && weightNumber > 0;

  const hasNegativeDose = selectedPackages.some(pkg => {
      const dose = parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0");
      return dose < 0; // Bloqueia negativos
  });

  const hasZeroOrNegativeDose = selectedPackages.some(pkg => {
      const dose = parseFloat(appliedDoses[pkg.id]?.replace(',', '.') || "0");
      return dose <= 0; // Bloqueia zero ou negativo
  });
  
  const isFormValid = isWeightValid && medicationsConfirmed && !globalExceedsBalance && !hasZeroOrNegativeDose && (selectedPackages.length > 0 || adhocApplications.length > 0);
  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!patient) return <div className="p-8 text-center text-destructive">Paciente não encontrado.</div>;

  return (
    <PageContainer>
      <UserHeader />
      
      <PageContent size="large"> {/* Max-width: 2xl */}
        
        <PageHeader 
          title="Validar Aplicação" 
          subtitle={patient.full_name}
          onBack={handleBackSafe} // Usando a nova função de voltar com verificação
        />

        {globalExceedsBalance && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Saldo insuficiente</AlertTitle>
                <AlertDescription>Uma ou mais doses excedem o saldo disponível no pacote do paciente.</AlertDescription>
            </Alert>
        )}

        <PageCard>
          <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mb-8">
             <p className="text-sm text-foreground/80">
               <strong>Instruções:</strong> Verifique as informações, registre o peso e confirme as doses.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* GRID RESPONSIVO: 1 coluna no mobile, 2 colunas no tablet/desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Data da Aplicação</Label>
                    <Input value={currentDate} disabled className="bg-muted/50" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="weight">Peso Atual <span className="text-destructive">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="weight" 
                            type="number" 
                            step="0.1" 
                            placeholder="00,0" 
                            value={weight} 
                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && parseFloat(val) < 0) return; // Bloqueia negativo
                                                setWeight(val);
                                            }} 
                            required 
                            className="pr-12 bg-white" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">kg</span>
                    </div>
                    {lastWeight !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Última pesagem: {formatNumber(lastWeight)}kg ({lastWeightText})
                        </p>
                    )}
                </div>
            </div>

            {/* Seção 2: Medicações */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold text-lg">Medicações</Label>
                
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPackageIds(new Set(availablePackages.filter((p: any) => p.isSuggested).map((p: any) => p.id)))}>
                    <CalendarDays className="w-4 h-4 mr-2" /> Sugeridas
                  </Button>

                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Avulsa</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Aplicação Avulsa</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Medicação</Label>
                          <Select onValueChange={setSelectedAdhocTreatment} value={selectedAdhocTreatment}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {allTreatments.map(t => (<SelectItem key={t.id} value={t.id}>{t.name} ({t.unit})</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Dose</Label>
                          <Input type="number" value={adhocDose} onChange={(e) => {
                              const val = e.target.value;
                              if (val && parseFloat(val) < 0) return; // Bloqueia negativo
                              setAdhocDose(val);
                          }} placeholder="0" step={getAdhocStep()} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="button" onClick={handleAddAdhocApplication} disabled={!selectedAdhocTreatment || !adhocDose || parseFloat(adhocDose.replace(',', '.')) <= 0}>Adicionar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-3">
                {availablePackages.map((pkg: any) => {
                  const medName = pkg.treatments?.medications?.name || "Desconhecido";
                  const unit = pkg.treatments?.unit || "";
                  const isUnitApps = unit.toLowerCase().includes('aplicação') || unit.toLowerCase().includes('aplicacao');
                  
                  const doseValue = appliedDoses[pkg.id] || ''; 
                  const doseNumber = parseFloat(doseValue.replace(',', '.')) || 0;
                  const exceedsBalance = doseNumber > pkg.remaining_amount;
                  const remainingAfter = pkg.remaining_amount - doseNumber;
                  
                  let unitLabel = unit;
                  if (isUnitApps) {
                      unitLabel = doseNumber >= 2 ? 'Aplicações' : 'Aplicação';
                  }

                  return (
                    <div key={pkg.id} className={`p-4 border rounded-lg transition-all ${selectedPackageIds.has(pkg.id) ? 'bg-primary/5 border-primary/30 shadow-sm' : 'border-border/60'}`}>
                      <div className="flex items-start gap-4">
                        <Checkbox id={`pkg-${pkg.id}`} checked={selectedPackageIds.has(pkg.id)} onCheckedChange={() => handlePackageSelectionChange(pkg.id)} className="mt-1"/>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                              <label htmlFor={`pkg-${pkg.id}`} className="font-semibold cursor-pointer text-foreground text-base">{medName}</label>
                              {pkg.lastAppDate && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                      <Clock className="w-3 h-3" /> Última: {formatNumber(pkg.lastAppAmount)} {isUnitApps ? (pkg.lastAppAmount >= 2 ? 'Aplicações' : 'Aplicação') : unit} ({pkg.lastAppDate})
                                  </span>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                              Saldo atual: <strong>{formatNumber(pkg.remaining_amount)} {isUnitApps ? (pkg.remaining_amount >= 2 ? 'Aplicações' : 'Aplicação') : unit}</strong>
                          </p>
                          
                          {selectedPackageIds.has(pkg.id) && (
                            <div className="pt-3 space-y-2">
                              <Label className="text-xs font-medium">Dose aplicada <span className="text-destructive">*</span></Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step={isUnitApps ? "1" : "0.1"}
                                  placeholder="0"
                                  value={doseValue}
                                  onChange={(e) => handleDoseChange(pkg.id, e.target.value)}
                                  className={`bg-white pr-24 text-lg ${exceedsBalance ? 'border-destructive ring-destructive/20' : ''}`}
                                />
                                <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground pointer-events-none font-medium">{unitLabel}</span>
                              </div>
                              {exceedsBalance ? (
                                  <div className="flex items-center gap-2 text-xs text-destructive font-medium mt-1.5"><TriangleAlert className="h-3.5 w-3.5" /> Dose excede o saldo</div>
                              ) : doseValue !== '' && doseNumber > 0 ? (
                                  <p className="text-xs text-muted-foreground mt-1.5 pl-1">✓ Saldo final: <strong>{formatNumber(remainingAfter)} {unitLabel}</strong></p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {adhocApplications.map((app, idx) => {
                    const isAppUnit = (app.treatment_unit || "").toLowerCase().includes('aplicação');
                    const unitLabel = isAppUnit ? (app.amount_applied >= 2 ? 'Aplicações' : 'Aplicação') : app.treatment_unit;
                    
                    return (
                        <div key={idx} className="p-4 border rounded-lg bg-secondary/10 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{app.treatment_name} <span className="text-xs bg-secondary/30 px-2 py-0.5 rounded">Avulsa</span></p>
                                <p className="text-sm mt-1">Dose: {formatNumber(app.amount_applied)} {unitLabel}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setAdhocApplications(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                        </div>
                    )
                })}
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-6 border-t mt-8">
              <Checkbox id="confirm" checked={medicationsConfirmed} onCheckedChange={(c) => setMedicationsConfirmed(c as boolean)} className="mt-1" />
              <label htmlFor="confirm" className="text-sm font-medium cursor-pointer leading-snug text-muted-foreground">
                Confirmo que verifiquei todas as medicações acima e que as dosagens informadas estão corretas para esta aplicação.
              </label>
            </div>

<div className="pt-6 mt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                
                {/* Botão Cancelar */}
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleCancel}
                    className="h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    Cancelar
                </Button>

                {/* Botão Confirmar */}
                <Button 
                    type="submit" 
                    size="lg" 
                    disabled={!isFormValid || isSubmitting} 
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 h-12 min-w-[200px]"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Check className="w-5 h-5 mr-2" />} 
                    Confirmar e Assinar
                </Button>
              </div>
            </div>
          </form>

        </PageCard>
      </PageContent>
    </PageContainer>
  );
};

export default RegisterApplicationPage;