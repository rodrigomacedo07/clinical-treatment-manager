import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div 
      className={cn(
        "min-h-screen bg-gradient-to-br from-background via-accent/10 to-background font-sans text-foreground antialiased",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}