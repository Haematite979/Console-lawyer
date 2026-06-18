import React from "react";
import * as Icons from "lucide-react";
import { templates, TCTemplate } from "../templates";

interface DocSelectorProps {
  onSelect: (template: TCTemplate) => void;
  selectedId: string | null;
}

export function DocSelector({ onSelect, selectedId }: DocSelectorProps) {
  // Helper to render dynamic Lucide Icons
  const renderIcon = (iconName: string, className: string) => {
    // Falls back gracefully if an icon is missing
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent className={className} />;
  };

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:bg-zinc-800";
      case "Medium":
        return "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700";
      case "High":
        return "bg-zinc-200 text-black border-zinc-300 hover:bg-zinc-100";
      case "Critical":
        return "bg-white text-black border-white font-extrabold shadow-[0_0_8px_rgba(255,255,255,0.15)] hover:bg-zinc-50";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          Interactive Presets
        </span>
        <span className="text-[11px] text-zinc-500 font-mono">
          PRESETS GATEWAY
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((tpl) => {
          const isSelected = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              id={`preset-btn-${tpl.id}`}
              type="button"
              className={`flex items-start p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                isSelected
                  ? "bg-white border-white text-black shadow-lg shadow-white/5"
                  : "bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 text-zinc-300 hover:border-zinc-750"
              }`}
            >
              {/* Dynamic subtle hover background pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

              <div className={`mr-3 mt-1 p-2 rounded-lg transition-colors duration-200 shrink-0 ${
                isSelected 
                  ? "bg-black text-white" 
                  : "bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-700/80 group-hover:text-zinc-200"
              }`}>
                {renderIcon(
                  tpl.icon,
                  `w-4 h-4 transition-transform duration-300 group-hover:scale-110`
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate leading-snug">
                  {tpl.name.split(" (")[0]}
                </span>
                <span className="block text-[11px] text-zinc-500 truncate mt-0.5 font-mono">
                  RISK PRE-SET Snip
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-2 transition-all ${getRiskBadgeStyles(
                    tpl.expectedRisk
                  )} ${isSelected ? "brightness-95 contrast-125" : ""}`}
                >
                  {tpl.expectedRisk} Risk
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
