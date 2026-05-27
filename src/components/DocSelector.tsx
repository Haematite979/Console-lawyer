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
        return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100";
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Interactive Presets
        </span>
        <span className="text-[11px] text-slate-400">
          Click to load realistic legal terms
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
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                  : "bg-white hover:bg-slate-50 border-slate-200/60 text-slate-700 shadow-xs hover:border-slate-300"
              }`}
            >
              {/* Dynamic subtle hover background pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

              <div className="mr-3 mt-1 p-2 rounded-lg transition-colors duration-200 bg-slate-100 text-slate-600 group-hover:bg-slate-200/50 group-hover:text-slate-800 shrink-0">
                {renderIcon(
                  tpl.icon,
                  `w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                    isSelected ? "text-slate-900 bg-white rounded-md p-0.5" : ""
                  }`
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate leading-snug">
                  {tpl.name.split(" (")[0]}
                </span>
                <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                  Analyze specific agreements snippet
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-2 transition-all ${getRiskBadgeStyles(
                    tpl.expectedRisk
                  )} ${isSelected ? "brightness-95 contrast-125" : ""}`}
                >
                  Est: {tpl.expectedRisk} Risk
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
