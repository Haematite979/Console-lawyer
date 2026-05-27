import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface RiskMeterProps {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
  verdict: string;
}

export function RiskMeter({ score, level, verdict }: RiskMeterProps) {
  // Smooth count-up and arc drawing state
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 1400; // 1.4s animation for smooth drawing
    const startScore = 0;
    const endScore = score;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (endScore - startScore) * easeOutCubic);
      
      setDisplayScore(currentScore);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [score]);

  // Map level to styling configurations
  const styles = {
    Low: {
      color: "text-emerald-500",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      stroke: "stroke-emerald-500",
      shadow: "shadow-emerald-100",
      description: "This document respects user privacy and displays exceptionally consumer-friendly, lightweight terms."
    },
    Medium: {
      color: "text-amber-500",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      stroke: "stroke-amber-500",
      shadow: "shadow-amber-100",
      description: "Standard industry practices. Some data tracking or advertising monetization, but standard dispute mechanisms exist."
    },
    High: {
      color: "text-orange-500",
      bg: "bg-orange-50 text-orange-700 border-orange-200",
      stroke: "stroke-orange-500",
      shadow: "shadow-orange-100",
      description: "Severe exposure. Contains broad intellectual property grabs, mandatory binding arbitration, or subtle automatic recurring bill cycles."
    },
    Critical: {
      color: "text-rose-600",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      stroke: "stroke-rose-600",
      shadow: "shadow-rose-100",
      description: "Extremely hostile clauses. Broad tracking of biometrics, unilateral terms revisions without prior consent, and complete waiver of basic rights."
    }
  }[level] || {
    color: "text-gray-500",
    bg: "bg-gray-50 text-gray-700 border-gray-200",
    stroke: "stroke-gray-500",
    shadow: "shadow-gray-100",
    description: "Unidentified risk factors."
  };

  // SVG parameters for the dial
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Create a half dial (or slightly open dial of 270 degrees)
  // Let's use a 240 degree arc. We start at 150 degrees (bottom-left) and wrap 240 degrees to 390 degrees.
  const angleStart = -120; // in degrees
  const angleEnd = 120; // in degrees
  const arcLength = 240; 
  const strokeDashoffset = circumference - (displayScore / 100) * (circumference * (arcLength / 360));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-between h-full shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
    >
      {/* Background Accent Grid */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-60 -z-10 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="w-full text-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Aggregate Legal Risk
        </h3>
        <p className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          {level} Exposure
        </p>
      </div>

      {/* Visual Circle Gauge */}
      <div className="relative flex items-center justify-center my-6">
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 120 120">
          {/* Background Track Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className="stroke-slate-100"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (120 / 360)} // Empty 120 degrees of the bottom
            strokeLinecap="round"
            transform="rotate(60 60 60)"
          />
          {/* Foreground Score Ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className={`transition-all duration-75 ease-out ${styles.stroke}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(150 60 60)" // Starts at bottom-left
          />
        </svg>

        {/* Inner Score Label */}
        <div className="absolute text-center flex flex-col justify-center items-center">
          <motion.span 
            key={score}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-extrabold text-slate-800 tracking-tight font-sans"
          >
            {displayScore}
          </motion.span>
          <span className="text-[10px] font-mono leading-none tracking-widest text-slate-400 uppercase mt-0.5">
            Risk Score
          </span>
        </div>
      </div>

      {/* Recommendation and Breakdown */}
      <div className="w-full text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold border ${styles.bg} mb-4 ${styles.shadow} shadow-sm transition-all duration-300`}
        >
          Verdict: {verdict}
        </motion.div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          {styles.description}
        </p>
      </div>
    </motion.div>
  );
}
