"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string; // Se fornecido, mostra o botão voltar para essa URL
  onBack?: () => void; // Alternativa: função customizada de voltar
  hideBackButton?: boolean;
  className?: string;
  children?: React.ReactNode; // Para botões de ação extra no header
}

export function PageHeader({ title, subtitle, backUrl, onBack, hideBackButton, className, children }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backUrl) router.push(backUrl);
    else router.back();
  };

    const shouldShowDefault = !!backUrl || !!onBack || (!backUrl && !onBack);
  const showBackButton = !hideBackButton && shouldShowDefault;  

  return (
    <div className={cn("mb-6 md:mb-8 flex flex-col gap-4", className)}>
      {showBackButton && (
        <div className="-ml-2">
          <Button variant="ghost" onClick={handleBack} className="hover:bg-accent/50 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}