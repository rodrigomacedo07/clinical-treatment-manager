"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { debounce } from "lodash";
import { Popover, PopoverTrigger, PopoverContent,} from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,} from "@/components/ui/command";
import { Button } from "./ui/button";
import { PlusCircle, Loader2, Search, X, CheckCircle, User } from "lucide-react";
import { PatientCardProps } from "./PatientCard";

interface PatientSearchResult {
  id: string;
  full_name: string | null;
  cpf: string | null;
}

interface PatientSearchBarProps {
  queuePatients: PatientCardProps[];
  onPatientAdded: () => void;
}


export function PatientSearchBar({ queuePatients, onPatientAdded }: PatientSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

    // Lógica de abertura: Se tem texto, o popover deve estar aberto (mostrando loading ou resultados)
  useEffect(() => {
    setIsOpen(query.trim().length > 0);
  }, [query]);

  // ----------------------------
  // 🔎 BUSCA NO SUPABASE
  // ----------------------------
  const searchPatients = async (currentQuery: string) => {
    if (!currentQuery || currentQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const cleaned = currentQuery.replace(/[.-]/g, "");

      const { data, error } = await supabase
        .from("patients")
        .select(`id, full_name, cpf`)
        .or(
          `full_name.ilike.%${currentQuery}%,cpf.ilike.%${cleaned}%`
        )
        .limit(5);

      if (error) throw error;

      setResults(data || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Erro na busca de pacientes:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchPatients, 300), []);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // ----------------------------
  // ➕ ADICIONAR À FILA
  // ----------------------------
  const handleAddToQueue = async (patientId: string) => {
    // Fecha imediatamente para dar feedback rápido
    setIsOpen(false);
    setQuery("");

    try {
      await fetch("/api/queue/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      onPatientAdded();
    } catch (error) {
      console.error("Erro ao adicionar à fila:", error);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Input = gatilho */}
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            placeholder="Buscar paciente por nome ou CPF..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-card/50 backdrop-blur-sm border rounded-lg pl-10 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {query && (
            <X 
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }} 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" 
            />
          )}
          {loading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>

      {/* Dropdown */}
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="start"
      >
        <Command>
          <CommandList>
            {loading && results.length === 0 ? (
               <div className="py-6 text-center text-sm text-muted-foreground">
                 Buscando...
               </div>
            ) : results.length === 0 ? (
              <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((patient) => {
                  // Busca se o paciente está na lista para verificar o status
                  const patientRecord = queuePatients.find(p => p.id === patient.id);
                  
                  // Só considera "Na Fila" (Bloqueado) se o status NÃO for concluído nem cancelado
                  const isInQueue = patientRecord && !['completed', 'canceled'].includes(patientRecord.applicationStatus);

                  return (
                    <CommandItem
                      key={patient.id}
                      className="flex justify-between items-center py-3"
                      // Selecionar o item inteiro leva aos detalhes (Sua ideia de UX)
                      onSelect={() => {
                        setIsOpen(false);
                        router.push(`/patientdetails/${patient.id}`);
                      }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{patient.full_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{patient.cpf}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isInQueue ? (
                          <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                             <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                             Já na fila
                          </div>
                        ) : (
                          <>
                            {/* Botão Secundário: Ver Detalhes (Opcional, já que o clique no item faz isso, mas bom para clareza) */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              title="Ver Detalhes"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/patientdetails/${patient.id}`);
                              }}
                            >
                              <User className="h-4 w-4" />
                            </Button>

                            {/* Botão Primário: Adicionar */}
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToQueue(patient.id);
                              }}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              Adicionar
                            </Button>
                          </>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
