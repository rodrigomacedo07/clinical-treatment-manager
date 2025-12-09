import { Badge } from "@/components/ui/badge";

export const VersionBadge = () => {
  const version = "v3.1"; // Atualizar conforme necessário
  const lastUpdate = "16/10/2025";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="outline" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <div className="flex flex-col text-xs">
          <span className="font-semibold">{version}</span>
          <span className="text-muted-foreground text-[10px]">{lastUpdate}</span>
        </div>
      </Badge>
    </div>
  );
};
