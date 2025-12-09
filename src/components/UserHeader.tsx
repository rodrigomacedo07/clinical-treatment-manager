"use client"

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const UserHeader = () => {
  const { user, logout } = useAuth();
const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    router.push('/login');
  };

  if (!user) return null;

  const roleLabels = {
    enfermagem: "Enfermagem",
    recepcao: "Recepção",
    gestor: "Gestor",
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{roleLabels[user.role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default UserHeader;
