"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // CORREÇÃO: Usando Next.js Router
import { ArrowLeft, Save, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removido 'sonner' se não estiver instalado, usando alert nativo ou console por enquanto se falhar
// Se você tiver o componente 'toast' do shadcn configurado, podemos usar.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";

// Helper para formatar nomes
const formatName = (name: string) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // Lista de preposições que não devem ser capitalizadas
      const prepositions = ["de", "da", "do", "dos", "das", "e"];
      if (prepositions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

  const validateCPF = (cpf: string) => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]+/g, "");

  if (cpf === "") return false;
  // Elimina CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  // Validação do 1º Dígito
  for (let i = 1; i <= 9; i++)
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  // Validação do 2º Dígito
  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

const formSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nome completo é obrigatório (mínimo 3 caracteres)")
    // A mágica acontece aqui: transforma o dado ANTES de validar/enviar
    .transform((val) => formatName(val)), 
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (formato: 000.000.000-00)")
    .min(1, "CPF é obrigatório")
    .refine((val) => validateCPF(val), "CPF inválido (verifique os dígitos)"),
  birthDate: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const NewPatient = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      cpf: "",
      birthDate: "",
      email: "",
      phone: "",
      clinicalNotes: "",
    },
  });

  const { isDirty } = form.formState; 

    const handleCancel = () => {
    if (isDirty) {
      const confirmExit = window.confirm("Existem dados não salvos. Tem certeza que deseja sair?");
      if (!confirmExit) return;
    }
    router.push("/patientlist");
  };

    const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const onSubmit = async (data: FormData, redirectPath: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/patients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao cadastrar paciente");
      }

      console.log("Paciente criado:", result.data);
      alert("Paciente cadastrado com sucesso!");
      
      if (redirectPath === 'treatment') {
        router.push(`/new-treatment/${result.data.id}`);
      } else {
        router.push("/patientlist");
      }

    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
<PageContainer>
      <PageContent size="large">
        
        <PageHeader 
            title="Cadastrar Novo Paciente" 
            subtitle="Preencha os dados essenciais do paciente"
            hideBackButton={true} 
        />

        <PageCard>
          
            <h2 className="text-xl font-semibold text-foreground mb-6 border-b pb-4">Dados Pessoais</h2>
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome Completo <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="Digite o nome completo" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            onChange={(e) => field.onChange(formatCPF(e.target.value))} 
                            maxLength={14} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl><Input type="email" placeholder="exemplo@email.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field} 
                            onChange={(e) => field.onChange(formatPhone(e.target.value))} 
                            maxLength={15} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clinicalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Clínicas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Histórico relevante..." className="min-h-[120px] resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  
                />
<span className="text-sm text-muted-foreground"><span className="text-destructive">*</span> Campos Obrigatórios</span>
                
                  

                <div className="pt-6 border-t mt-8">
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">

                    {/* Botão Cancelar Seguro */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="h-12 text-muted-foreground hover:text-destructive"
                    >
                      Cancelar
                    </Button>
                
                    <Button
                      type="button"
                      variant="outline"
                      onClick={form.handleSubmit((data) => onSubmit(data, 'list'))}
                      disabled={isSubmitting}
                      className="h-12"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                      Salvar e Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit((data) => onSubmit(data, 'treatment'))}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 h-12"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ArrowRight className="w-4 h-4 mr-2" />}
                      Salvar e Cadastrar Tratamento
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
        </PageCard>
      </PageContent>
    </PageContainer>
  );
};

export default NewPatient;