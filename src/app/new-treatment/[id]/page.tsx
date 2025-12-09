"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, CalendarDays, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import UserHeader from "@/components/UserHeader"; 
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";

const daysOfWeek = [
  { short: "SEG", full: "Segunda-feira", value: 1 },
  { short: "TER", full: "Terça-feira", value: 2 },
  { short: "QUA", full: "Quarta-feira", value: 3 },
  { short: "QUI", full: "Quinta-feira", value: 4 },
  { short: "SEX", full: "Sexta-feira", value: 5 },
];

interface DbMedication { id: string; name: string; unit: string; }
interface TreatmentItem {
  id: string; medicationId: string; substanceName: string; quantity: number;
  unit: string; frequencyDays: number; dayOfWeek: number;
}

const NewTreatment = () => {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  
  const [patientName, setPatientName] = useState("Carregando...");
  const [availableSubstances, setAvailableSubstances] = useState<DbMedication[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Novo estado de loading

  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Estado do formulário
  const initialFormState = {
    medicationId: "", 
    substanceName: "", 
    quantity: "", 
    unit: "",
    frequencyDays: "", // Começa vazio para obrigar escolha
    dayOfWeek: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Estado de Erros de Validação (Inline UX)
  const [formErrors, setFormErrors] = useState({
    medicationId: false,
    quantity: false,
    frequencyDays: false,
    dayOfWeek: false
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientRes = await fetch(`/api/patients/${patientId}`);
        if (!patientRes.ok) throw new Error("Falha ao buscar paciente");
        const patientData = await patientRes.json();
        setPatientName(patientData.data.full_name);

        const medsRes = await fetch('/api/medications/list');
        if (!medsRes.ok) throw new Error("Falha ao buscar medicações");
        const medsData = await medsRes.json();
        setAvailableSubstances(medsData.data);
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Erro ao carregar dados.");
      } finally { setLoadingData(false); }
    };
    if (patientId) loadData();
  }, [patientId]);

   const handleSubstanceChange = (medicationId: string) => {
    const selected = availableSubstances.find(s => s.id === medicationId);
    if (selected) {
      setFormData(prev => ({ 
        ...prev, 
        medicationId: selected.id, 
        substanceName: selected.name, 
        unit: selected.unit 
      }));
      // Limpa erro se existir
      if(formErrors.medicationId) setFormErrors(prev => ({...prev, medicationId: false}));
    }
  };

  // Função Genérica para validar inputs ao digitar/selecionar
  const handleInputChange = (field: keyof typeof formErrors, value: string) => {
    if (field === 'quantity') setFormData({...formData, quantity: value});
    if (field === 'frequencyDays') setFormData({...formData, frequencyDays: value});
    if (field === 'dayOfWeek') setFormData({...formData, dayOfWeek: value});

    // Se usuário preencheu, remove o erro visual
    if (value && formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: false}));
    }
  };

  const validateForm = () => {
    const errors = {
      medicationId: !formData.medicationId,
      quantity: !formData.quantity || Number(formData.quantity) <= 0,
      frequencyDays: !formData.frequencyDays,
      dayOfWeek: !formData.dayOfWeek
    };
    setFormErrors(errors);
    // Retorna true se não houver nenhum erro true
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmitItem = () => {
    if (!validateForm()) return; // Validação Visual Inline

    const newItem: TreatmentItem = {
      id: editingItemId || Date.now().toString(),
      medicationId: formData.medicationId,
      substanceName: formData.substanceName,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      frequencyDays: Number(formData.frequencyDays),
      dayOfWeek: Number(formData.dayOfWeek),
    };

    if (editingItemId) {
      setTreatmentItems(treatmentItems.map(item => item.id === editingItemId ? newItem : item));
      toast.success("Item atualizado.");
    } else {
      setTreatmentItems([...treatmentItems, newItem]);
    }
    
    // Reset
    setFormData(initialFormState);
    setEditingItemId(null);
    setShowForm(false);
    setFormErrors({ medicationId: false, quantity: false, frequencyDays: false, dayOfWeek: false });
  };

  const handleEdit = (item: TreatmentItem) => {
    setFormData({
      medicationId: item.medicationId,
      substanceName: item.substanceName,
      quantity: item.quantity.toString(),
      unit: item.unit,
      frequencyDays: item.frequencyDays.toString(),
      dayOfWeek: item.dayOfWeek.toString()
    });
    setEditingItemId(item.id);
    setShowForm(true);
    setFormErrors({ medicationId: false, quantity: false, frequencyDays: false, dayOfWeek: false });
  };

  const handleRemove = (id: string) => {
    if (confirm("Remover este item do tratamento?")) {
      setTreatmentItems(treatmentItems.filter(item => item.id !== id));
      // Se estava editando o item removido, cancela a edição
      if (editingItemId === id) {
        setShowForm(false);
        setEditingItemId(null);
        setFormData(initialFormState);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItemId(null);
    setFormData(initialFormState);
    setFormErrors({ medicationId: false, quantity: false, frequencyDays: false, dayOfWeek: false });
  };

  // Botão Cancelar Geral (Sair da Tela)
  const handleCancelPage = () => {
    if (treatmentItems.length > 0) {
      const confirmExit = window.confirm("Existem itens não salvos. Deseja realmente sair?");
      if (!confirmExit) return;
    }
    router.push("/patientlist");
  };

  const handleSaveAll = async () => {
    if (treatmentItems.length === 0) {
      toast.error("Adicione pelo menos um item ao tratamento.");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, items: treatmentItems }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Falha ao salvar tratamentos");

      toast.success("Tratamento cadastrado com sucesso!");
      router.push('/patientlist'); 
      
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
  
  return (
    <PageContainer>
      <UserHeader />
      <PageContent size="large">
        
        <PageHeader 
            title="Cadastrar Novo Tratamento" 
            subtitle={`Paciente: ${patientName}`}
            hideBackButton={true} 
        />

        <PageCard>
          <div className="text-xl font-semibold text-foreground mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold text-foreground">Itens do Tratamento</h2>
            {treatmentItems.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {treatmentItems.length} {treatmentItems.length === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          
          {/* Lista de Itens */}
          {treatmentItems.length > 0 && (
            <div className="space-y-3 mb-6">
              {treatmentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border shadow-sm">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                        {item.substanceName}
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {item.quantity} {item.quantity > 1 && item.unit === "Aplicação" ? "Aplicações" : item.unit}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1.5">
                        <span className="font-medium">Sugerido: {daysOfWeek.find(d => d.value === item.dayOfWeek)?.full}</span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/> A cada {item.frequencyDays} dias</span>

                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulário (Card Interno) */}
          {showForm ? (
            <div className="p-6 rounded-xl bg-accent/5 border border-primary/10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-primary/10 pb-2">
                 <h3 className="font-medium text-primary">{editingItemId ? "Editar Item" : "Novo Item"}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                <div className="md:col-span-5 space-y-1.5">
                  <Label className={cn(formErrors.medicationId && "text-destructive")}>Substância *</Label>
                  <Select value={formData.medicationId} onValueChange={handleSubstanceChange}>
                    <SelectTrigger className={cn("bg-background", formErrors.medicationId && "border-destructive ring-destructive/30")}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {availableSubstances.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.medicationId && <span className="text-xs text-destructive">Selecione uma medicação.</span>}
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className={cn(formErrors.quantity && "text-destructive")}>Qtd ({formData.unit || '-'}) *</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} className={cn("bg-background", formErrors.quantity && "border-destructive focus-visible:ring-destructive")} placeholder="0" />
                  {formErrors.quantity && <span className="text-xs text-destructive">Qtd inválida.</span>}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className={cn(formErrors.frequencyDays && "text-destructive")}>Frequência *</Label>
                  <Select value={formData.frequencyDays} onValueChange={(v) => handleInputChange('frequencyDays', v)}>
                    <SelectTrigger className={cn("bg-background", formErrors.frequencyDays && "border-destructive ring-destructive/30")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Semanal</SelectItem>
                      <SelectItem value="14">Quinzenal</SelectItem>
                      <SelectItem value="30">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.frequencyDays && <span className="text-xs text-destructive">Obrigatório.</span>}
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className={cn(formErrors.dayOfWeek && "text-destructive")}>Dia *</Label>
                  <Select value={formData.dayOfWeek} onValueChange={(v) => handleInputChange('dayOfWeek', v)}>
                    <SelectTrigger className={cn("bg-background", formErrors.dayOfWeek && "border-destructive ring-destructive/30")}><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((d) => <SelectItem key={d.value} value={d.value.toString()}>{d.short}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.dayOfWeek && <span className="text-xs text-destructive">Obrigatório.</span>}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={handleCancelForm}>Cancelar Item</Button>
                <Button onClick={handleSubmitItem}>
                    {editingItemId ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                    {editingItemId ? "Atualizar Item" : "Adicionar Item"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowForm(true)} className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-primary hover:border-primary/50">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Medicação ao Tratamento
            </Button>
          )}

            {/* RODAPÉ PADRONIZADO (Idêntico ao TC01/NewPatient) */}
            <div className="pt-6 border-t mt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                
                {/* Botão Cancelar */}
                <Button
                  variant="ghost"
                  onClick={handleCancelPage}
                  disabled={isSaving}
                  className="h-12 text-muted-foreground hover:text-destructive"
                >
                  Cancelar
                </Button>
            
                {/* Botão Salvar Principal */}
                <Button
                  onClick={handleSaveAll}
                  disabled={treatmentItems.length === 0 || isSaving || showForm}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 h-12"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Tratamento
                </Button>
              </div>
            </div>

        </PageCard>
      </PageContent>
    </PageContainer>
  );
};

export default NewTreatment;