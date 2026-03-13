import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Settings,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, label: "Inicio" },
  { name: "NewExpense", icon: PlusCircle, label: "Registrar" },
  { name: "History", icon: Clock, label: "Historial" },
  { name: "Analytics", icon: BarChart3, label: "Análisis" },
  { name: "Settings", icon: Settings, label: "Ajustes" },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <style>{`
        :root {
          --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        }
        body {
          background: #F9FAFB;
          -webkit-tap-highlight-color: transparent;
          -webkit-font-smoothing: antialiased;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background: #111827;
          }
        }
      `}</style>

      {/* Status Bar Spacer */}
      <div className="h-2" />

      {/* Page Content */}
      <main className="pb-2">{children}</main>

      {/* Bottom Tab Bar - iOS Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 px-2 pt-2 pb-[max(0.5rem,var(--safe-area-inset-bottom))]">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const isActive = currentPageName === item.name;
                const isAddButton = item.name === "NewExpense";

                if (isAddButton) {
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.name)}
                      className="flex flex-col items-center -mt-5"
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                          isActive
                            ? "bg-emerald-500 shadow-emerald-500/30"
                            : "bg-emerald-500 shadow-emerald-500/25"
                        }`}
                      >
                        <item.icon
                          className="w-6 h-6 text-white"
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </motion.div>
                      <span className="text-[10px] font-medium mt-1 text-emerald-600">
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className="flex flex-col items-center py-1 px-3"
                  >
                    <motion.div whileTap={{ scale: 0.85 }}>
                      <item.icon
                        className={`w-5 h-5 transition-colors ${
                          isActive ? "text-emerald-500" : "text-gray-400"
                        }`}
                        strokeWidth={isActive ? 2.5 : 1.5}
                      />
                    </motion.div>
                    <span
                      className={`text-[10px] mt-1 transition-colors ${
                        isActive
                          ? "text-emerald-600 font-semibold"
                          : "text-gray-400 font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
