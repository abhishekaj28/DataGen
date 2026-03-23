import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Sparkles, Bot, ClipboardCheck, Scale, Download, Settings, Zap, LogOut,
} from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Generate Dataset", path: "/dashboard/generate", icon: Sparkles },
  { title: "Agent Monitor", path: "/dashboard/agents", icon: Bot },
  { title: "Validation Report", path: "/dashboard/validation", icon: ClipboardCheck },
  { title: "Bias Analysis", path: "/dashboard/bias", icon: Scale },
  { title: "Export", path: "/dashboard/export", icon: Download },
  { title: "Settings", path: "/dashboard/settings", icon: Settings },
];

const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
        <span className="text-lg font-bold text-foreground">DataGen</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? "bg-primary/10 text-primary glow-border"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.title}
            </RouterNavLink>
          );
        })}
      </nav>
      
    </aside>
  );
};

export default DashboardSidebar;
