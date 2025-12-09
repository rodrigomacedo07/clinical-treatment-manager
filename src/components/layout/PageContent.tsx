import { cn } from "@/lib/utils";

type ContentSize = "small" | "medium" | "large" | "full";

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: ContentSize;
}

const sizeClasses = {
  small: "max-w-lg",      // Login, Mensagens simples
  medium: "max-w-2xl",    // Formulários de cadastro
  large: "max-w-4xl",     // Dashboards médios, Detalhes
  full: "max-w-6xl",      // Listas grandes, Tabelas
};

export function PageContent({ children, size = "medium", className, ...props }: PageContentProps) {
  return (
    <main 
      className={cn(
        "mx-auto w-full p-4 md:p-6 lg:p-8 animate-in fade-in duration-500",
        sizeClasses[size],
        className
      )} 
      {...props}
    >
      {children}
    </main>
  );
}