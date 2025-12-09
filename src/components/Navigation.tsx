import { Link, useLocation } from "react-router-dom";
import { Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 md:hidden z-50">
      <div className="flex items-center justify-around p-2">
        <Button
          variant={location.pathname === "/" ? "default" : "ghost"}
          size="sm"
          asChild
          className={location.pathname === "/" ? "bg-gradient-to-r from-primary to-primary/80" : ""}
        >
          <Link to="/" className="flex flex-col items-center gap-1 py-2">
            <Users className="w-5 h-5" />
            <span className="text-xs">Pacientes</span>
          </Link>
        </Button>
        
        <Button
          variant={location.pathname === "/dashboard" ? "default" : "ghost"}
          size="sm"
          asChild
          className={location.pathname === "/dashboard" ? "bg-gradient-to-r from-primary to-primary/80" : ""}
        >
          <Link to="/dashboard" className="flex flex-col items-center gap-1 py-2">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
        </Button>
      </div>
    </nav>
  );
};
