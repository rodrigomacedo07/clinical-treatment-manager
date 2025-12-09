import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface PageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageCard({ children, className, ...props }: PageCardProps) {
  return (
    <Card 
      className={cn(
        "p-4 md:p-6 lg:p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-sm",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  );
}