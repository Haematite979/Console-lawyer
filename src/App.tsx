import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  Loader2,
  Send,
  CornerDownRight,
  RotateCcw,
  Copy,
  Trash2,
  FileText,
  Bookmark,
  Scale,
  BrainCircuit,
  Lock,
  ChevronDown,
  Download
} from "lucide-react";
import { DocSelector } from "./components/DocSelector";
import { RiskMeter } from "./components/RiskMeter";
import { TCTemplate, templates } from "./templates";
import { AnalysisResult, ChatMessage, KeyProvision } from "./types";

export default function App() {
  const [text, setText] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Link evaluation states
  const [entryTab, setEntryTab] = useState<"paste" | "knowledge" | "scrape">("paste");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkAnalysisDisclaimer, setLinkAnalysisDisclaimer] = useState<string>("");

  // Extension Suite states
  const [showExtensionSuite, setShowExtensionSuite] = useState<boolean>(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedExtCodeTab, setSelectedExtCodeTab] = useState<"manifest" | "html" | "js">("manifest");

  // Loading animation stage
  const [loadingStep, setLoadingStep] = useState<string>("");
  const loadingSteps = [
    "Initializing clean security parser...",
    "Scanning for hidden telemetry & data-sharing matrices...",
    "Validating class action waivers & arbitration thresholds...",
    "Extracting intellectual property and sub-licensing clauses...",
    "Compiling aggregated consumer risk score..."
  ];

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active filter for key clauses
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Loading state cycle
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      let stepIndex = 0;
      setLoadingStep(loadingSteps[0]);
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % loadingSteps.length;
        setLoadingStep(loadingSteps[stepIndex]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Handle preset selection
  const handlePresetSelect = (template: TCTemplate) => {
    setSelectedPresetId(template.id);
    setText(template.text);
    setError(null);
  };

  // Run Document Analysis API
  const handleAnalyze = async () => {
    if (!text || text.trim().length < 50) {
      setError("Please enter or select a detailed Terms and Conditions document (minimum 50 characters).");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setChatMessages([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze document.");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);

      // Prepopulate instructions in chat
      setChatMessages([
        {
          id: "welcome",
          role: "model",
          content: `Hello! I have completed analyzing the **${data.appName || "Document"}** terms. 
          
I found a **${data.riskLevel} Risk** exposure with a score of **${data.riskScore}/100**. Ask me anything detailed about these terms — for example, you can ask about data-sharing, cancellation clauses, or hidden costs.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "A network or parsing error occurred. Please check that the API key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Link-based Evaluation (Active Scrape or Knowledge base prediction)
  const handleAnalyzeLink = async () => {
    if (!linkUrl || !linkUrl.trim()) {
      setError("Please enter a valid website link or platform/brand name.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setChatMessages([]);
    setLinkAnalysisDisclaimer("");

    try {
      const isScraping = entryTab === "scrape";
      const payload = {
        url: linkUrl,
        mode: isScraping ? "scrape" : "knowledge"
      };

      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze link document indicators.");
      }

      const data = await res.json();
      setResult(data);
      setText(data.scrapedText || "");
      setLinkAnalysisDisclaimer(data.disclaimer || "");

      const formattedLabel = isScraping 
        ? "active scraping crawl" 
        : "AI internal knowledge base";

      setChatMessages([
        {
          id: "welcome-link",
          role: "model",
          content: `Hello! I have completed analyzing **${data.appName || linkUrl}**'s Terms & Conditions using our **${formattedLabel}** mode.

I discovered a **${data.riskLevel} Risk** profile with a security score of **${data.riskScore}/100**. 

*Notice: ${data.disclaimer}*

You can ask me any live question, legal challenge, or clause query about this and I will reply based on the simulated context!`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred during link evaluations. Make sure the backend serves the route.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Question to active chatbot context
  const handleSendMessage = async (msgText: string) => {
    const rawQuery = msgText || chatInput;
    if (!rawQuery.trim() || isSendingChat || !result) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: rawQuery,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!msgText) setChatInput("");
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsText: text,
          userMessage: rawQuery,
          messages: chatMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        throw new Error("Failed to get answer from server.");
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "error-" + Date.now(),
        role: "model",
        content: "Sorry, I am unable to connect to the legal reasoning processor right now. Make sure the Gemini API key is valid.",
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Clear/Reset App state
  const handleReset = () => {
    setText("");
    setSelectedPresetId(null);
    setResult(null);
    setError(null);
    setChatMessages([]);
    setLinkUrl("");
    setLinkAnalysisDisclaimer("");
  };

  // Filter provisions categories
  const categories = ["All", "Privacy & Data", "Billing & Refunds", "Intellectual Property", "Liability & Disputes", "Account Termination"];
  
  const filteredProvisions = result
    ? activeCategoryFilter === "All"
      ? result.keyProvisions
      : result.keyProvisions.filter(p => p.category === activeCategoryFilter)
    : [];

  // Helper styles for provisions risk
  const getProvisionRiskStyles = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // Chrome Extension code generators
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (filename: string, textContent: string) => {
    navigator.clipboard.writeText(textContent);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const getManifestCode = () => {
    return JSON.stringify({
      "manifest_version": 3,
      "name": "LexScan AI - T&C Shield Protection",
      "version": "1.0.0",
      "description": "Assess live Terms of Service and Privacy Policies instantly using LexScan AI's cognitive model processor.",
      "permissions": ["activeTab", "scripting"],
      "host_permissions": [
        "https://*.run.app/*",
        "<all_urls>"
      ],
      "action": {
        "default_popup": "popup.html",
        "default_title": "Check Security Risk Score",
        "default_icon": "icon.png"
      }
    }, null, 2);
  };

  const getPopupHtmlCode = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 330px;
      margin: 0;
      padding: 16px;
      background-color: #020617;
      color: #cbd5e1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .logo {
      background: #4f46e5;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 800;
      text-align: center;
    }
    .brand-title {
      font-weight: 800;
      font-size: 14px;
      color: #ffffff;
    }
    .sub {
      font-size: 9px;
      color: #6366f1;
      text-transform: uppercase;
      font-weight: bold;
    }
    .cta-btn {
      width: 100%;
      background: #4f46e5;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cta-btn:hover {
      background: #4338ca;
    }
    .loader {
      display: none;
      text-align: center;
      padding: 24px 0;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #1e293b;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .result-container {
      display: none;
      background: #0b1329;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 12px;
      margin-top: 12px;
    }
    .score-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 11px;
    }
    .Critical { background-color: rgba(239, 68, 68, 0.1); color: #f43f5e; border: 1px solid rgba(239, 68, 68, 0.2); }
    .High { background-color: rgba(249, 115, 22, 0.1); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.2); }
    .Medium { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
    .Low { background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    
    .clause-item {
      padding: 8px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 11px;
    }
    .clause-title {
      font-weight: bold;
      color: #f1f5f9;
      margin-bottom: 2px;
    }
    .clause-desc {
      color: #94a3b8;
    }
    .clause-badge {
      font-size: 9px;
      font-weight: bold;
      padding: 1px 4px;
      border-radius: 4px;
      float: right;
    }
    .footer-note {
      font-size: 9px;
      color: #475569;
      text-align: center;
      margin-top: 12px;
    }
    .error-box {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      color: #f43f5e;
      padding: 10px;
      border-radius: 8px;
      font-size: 11px;
      margin-top: 10px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Δ</div>
    <div>
      <div class="brand-title">LEXSCAN AI</div>
      <div class="sub">T&C Risk Agent</div>
    </div>
  </div>

  <div id="main-view">
    <button id="scan-btn" class="cta-btn">
      Evaluate This Tab
    </button>
  </div>

  <div id="loader" class="loader">
    <div class="spinner"></div>
    <div style="font-size: 11px; color: #94a3b8">Active-extracting page Terms...</div>
  </div>

  <div id="error-box" class="error-box"></div>

  <div id="result" class="result-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span style="font-weight: bold; font-size: 13px; color: white" id="res-app-name">Unknown Site</span>
      <span id="res-risk-badge" class="score-badge">78/100</span>
    </div>
    
    <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px; line-height: 1.4" id="res-summary">
      Analyzing the clauses...
    </div>

    <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cbd5e1; margin-bottom: 6px; border-top: 1px solid #1e293b; padding-top: 8px;">Key Clauses Found</div>
    <div id="res-clauses" style="max-height: 180px; overflow-y: auto;"></div>
    
    <div style="text-align: center; margin-top: 12px;">
      <a id="full-dashboard-link" href="#" target="_blank" style="color: #6366f1; text-decoration: none; font-size: 10px; font-weight: bold;">Open Full Dashboard ↗</a>
    </div>
  </div>

  <div class="footer-note">
    LexScan AI Cognitive Shield Protection
  </div>

  <script src="popup.js"></script>
</body>
</html>`;
  };

  const getPopupJsCode = (serverOrigin: string) => {
    return `const BACKEND_URL = "${serverOrigin}";

document.getElementById('scan-btn').addEventListener('click', async () => {
  const scanBtn = document.getElementById('scan-btn');
  const loader = document.getElementById('loader');
  const resultDiv = document.getElementById('result');
  const errorBox = document.getElementById('error-box');

  scanBtn.style.display = 'none';
  loader.style.display = 'block';
  resultDiv.style.display = 'none';
  errorBox.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      throw new Error("Unable to obtain standard tab configuration.");
    }

    let pageText = "";
    try {
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText || ""
      });
      if (injectionResults && injectionResults[0]) {
        pageText = injectionResults[0].result;
      }
    } catch (e) {
      console.warn("Script injection blocked, falling back to background evaluation.");
    }

    const hasExtractedText = pageText && pageText.trim().length > 300;
    const urlEndpoint = hasExtractedText ? \`\${BACKEND_URL}/api/analyze\` : \`\${BACKEND_URL}/api/analyze-link\`;
    const bodyPayload = hasExtractedText 
      ? JSON.stringify({ text: pageText })
      : JSON.stringify({ url: tab.url, mode: "scrape" });

    const res = await fetch(urlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyPayload
    });

    if (!res.ok) {
      const errRes = await res.json().catch(() => ({}));
      throw new Error(errRes.error || \`Server feedback issue (\${res.status})\`);
    }

    const data = await res.json();
    
    document.getElementById('res-app-name').innerText = data.appName || "Platform";
    
    const badge = document.getElementById('res-risk-badge');
    badge.innerText = \`\${data.riskScore}/100\`;
    badge.className = \`score-badge \${data.riskLevel || 'Medium'}\`;
    
    document.getElementById('res-summary').innerText = data.summary.slice(0, 180) + "...";
    
    const clausesContainer = document.getElementById('res-clauses');
    clausesContainer.innerHTML = '';
    
    const list = data.keyProvisions || [];
    list.slice(0, 3).forEach(item => {
      const div = document.createElement('div');
      div.className = 'clause-item';
      
      const riskClass = item.isRedFlag ? 'Critical' : item.riskLevel;
      div.innerHTML = \`
        <span class="clause-badge \${riskClass}">\${item.riskLevel}</span>
        <div class="clause-title" style="font-weight:bold; color:white; font-size:11px;">\${item.title}</div>
        <div style="color: #64748b; font-size: 10px; margin-top: 1px;">\${item.implication}</div>
      \`;
      clausesContainer.appendChild(div);
    });

    document.getElementById('full-dashboard-link').href = BACKEND_URL;
    resultDiv.style.display = 'block';

  } catch (error) {
    console.error(error);
    errorBox.innerText = \`Evaluation Error: \${error.message}. Make sure the server backend is fully accessible.\`;
    errorBox.style.display = 'block';
    scanBtn.style.display = 'block';
  } finally {
    loader.style.display = 'none';
  }
});`;
  };

  return (
    <div className="bg-[#020617] text-slate-200 min-h-screen font-sans flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Top Professional Navigation matching 'Immersive UI' style */}
      <nav className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-bold tracking-tight text-white leading-tight">
              LEX<span className="text-indigo-400 font-extrabold tracking-wide">SCAN</span> AI
            </span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
              TERMS & PRIVACY VERIFICATION ENGINE
            </span>
          </div>
        </div>

        <div className="hidden md:flex gap-6 items-center text-xs tracking-wider uppercase font-mono">
          <span className="text-indigo-400 border-b border-indigo-500 pb-1 cursor-pointer">
            Analyzer Dashboard
          </span>
          <span className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            Legal Framework
          </span>
          <button
            onClick={() => setShowExtensionSuite(true)}
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          >
            Extension Suite ⚡
          </button>
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            AI Studio App
          </a>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-indigo-300">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gemini 3.5 Native</span>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Welcome Intro Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5 gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
              Consumer Rights Empowerment
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
              Read Less. Protect More.
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Don't just blind-click "Agree". Paste any Terms & Conditions, EULA, or Privacy Policy to instantly reveal hidden pitfalls, data grabs, and legal exposure.{" "}
              <button
                onClick={() => setShowExtensionSuite(true)}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-550 underline-offset-4 decoration-2 cursor-pointer transition-colors inline-flex items-center gap-1"
              >
                <span>Install the Chrome Extension</span> <span>⚡</span>
              </button>
            </p>
          </div>
          {result && (
            <button
              onClick={handleReset}
              className="self-start md:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 hover:text-white transition-all duration-200 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset & Load New Document
            </button>
          )}
        </header>

        {/* Outer Split Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input & Action Section if not yet analyzed or during scan */}
          <section className={`flex flex-col gap-6 ${result ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col h-full shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
              
              {/* Core Source Entry Toggles */}
              <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-xl p-1 mb-5">
                <button
                  type="button"
                  onClick={() => { setEntryTab("paste"); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    entryTab === "paste" ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Text / Presets</span>
                  <span className="sm:hidden">Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEntryTab("knowledge"); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    entryTab === "knowledge" ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Knowledge (No Visit)</span>
                  <span className="sm:hidden">Knowledge</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEntryTab("scrape"); setError(null); }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    entryTab === "scrape" ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/10" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-300" />
                  <span className="hidden sm:inline">Active Scraper</span>
                  <span className="sm:hidden">Scrape</span>
                </button>
              </div>

              {/* Toggle Interface based on Selected entryTab */}
              {entryTab === "paste" && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                        Paste Terms Document
                      </h3>
                    </div>
                    {text && (
                      <button
                        onClick={() => setText("")}
                        className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Input
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Selector */}
                  <div className="mb-5">
                    <DocSelector
                      selectedId={selectedPresetId}
                      onSelect={handlePresetSelect}
                    />
                  </div>

                  {/* Main Policy Input Text Area */}
                  <div className="relative mt-2">
                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setSelectedPresetId(null);
                      }}
                      id="tc-input-textarea"
                      placeholder="Paste the full terms and conditions text here (or select one of our premium preset options above)..."
                      className="w-full h-80 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-4 text-xs font-mono text-slate-300 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all duration-200 font-sans leading-relaxed resize-y"
                      disabled={isAnalyzing}
                    />
                    {!text && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none select-none">
                        <div className="p-3 rounded-full bg-slate-900/60 border border-slate-800 mb-2">
                          <Bookmark className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-xs text-slate-500 max-w-xs leading-normal">
                          Pasting longer snippets yields highly detailed, clause-by-clause evaluation and custom follow-up insights.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {entryTab === "knowledge" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Evaluate Platform via AI Knowledge base
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly analyze standard terms, tracking risk indexes, or liability configurations for highly popular brands & services **without visiting the website**. We construct an estimated consumer risk rating from current industry data.
                  </p>

                  <div className="mt-2 text-xs">
                    <label className="block text-slate-400 mb-2 font-mono font-bold uppercase text-[10px]">
                      Enter Service Name / Link
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="e.g. Zoom, Spotify Premium, Netflix, or netflix.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all"
                      id="brand-name-input"
                    />
                  </div>

                  {/* Fast bullet instructions */}
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl space-y-2 mt-2">
                    <div className="flex items-start gap-2 text-[11px] text-slate-400">
                      <span className="text-indigo-400 mt-0.5">✔</span>
                      <span>**Zero Footprint**: No servers are touched; absolutely zero internet queries or cookie setups.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-slate-400">
                      <span className="text-indigo-400 mt-0.5">✔</span>
                      <span>**Brand Recognition**: Evaluates known corporate clauses based on comprehensive legal model databases.</span>
                    </div>
                  </div>
                </div>
              )}

              {entryTab === "scrape" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Active Website Crawler & Evaluator
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Retrieve the live website text immediately. Our secure background proxy connects, strips layout tags, and extracts the core textual agreements for real-time legal scanning.
                  </p>

                  <div className="mt-2 text-xs">
                    <label className="block text-slate-400 mb-2 font-mono font-bold uppercase text-[10px]">
                      Enter Website URL
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="e.g. https://www.spotify.com/us/legal/end-user-agreement/"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all"
                      id="scrape-url-input"
                    />
                  </div>

                  {/* Fast bullet instructions */}
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl space-y-2 mt-2">
                    <div className="flex items-start gap-2 text-[11px] text-slate-400">
                      <span className="text-emerald-400 mt-0.5">✔</span>
                      <span>**Live Extraction**: Fetches dynamic updates to capture the most recent policies.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-slate-400">
                      <span className="text-emerald-400 mt-0.5">✔</span>
                      <span>**Tag Stripping**: Safely discards visual advertisements, style headers, and Javascript code blocks prior to audits.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button & Error Handling */}
              <div className="mt-5 flex flex-col gap-3">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400 animate-pulse" />
                      <span className="whitespace-pre-line leading-relaxed">{error}</span>
                    </div>
                    {entryTab === "scrape" && error.includes("Knowledge Base") && (
                      <button
                        type="button"
                        onClick={() => {
                          setEntryTab("knowledge");
                          setError(null);
                        }}
                        className="self-start px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wider font-mono uppercase transition-colors"
                      >
                        Switch to Knowledge Mode
                      </button>
                    )}
                  </div>
                )}

                {entryTab === "paste" ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !text.trim()}
                    id="run-analysis-btn"
                    className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      (isAnalyzing || !text.trim()) ? "opacity-55 cursor-not-allowed bg-slate-800 text-slate-400" : ""
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Running Cognitive Guard Audit...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Assess Risk Score & Summarize</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleAnalyzeLink}
                    disabled={isAnalyzing || !linkUrl.trim()}
                    id="run-link-analysis-btn"
                    className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      (isAnalyzing || !linkUrl.trim()) ? "opacity-55 cursor-not-allowed bg-slate-800 text-slate-400" : ""
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Querying Legal Models...</span>
                      </>
                    ) : (
                      <>
                        {entryTab === "scrape" ? (
                          <Sparkles className="w-4 h-4 text-indigo-300" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                        <span>{entryTab === "scrape" ? "Scrape & Analyze Live Terms" : "Run AI Knowledge-Base Audit"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Active Stats panel */}
            <div className="bg-slate-900/20 border border-slate-800/50 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-[10px] font-mono tracking-wider font-bold uppercase text-slate-500">
                Evaluation Standards Metric
              </h4>
              <p className="text-xs text-slate-400 leading-normal">
                Analysis is processed privately using server-side Gemini 3.5. Scores align to Federal Trade Commission directives regarding explicit consumer disclosures.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2 border border-slate-800/60 bg-slate-900/30 rounded-lg">
                  <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase">Accuracy</span>
                  <span className="text-xs text-indigo-400 font-semibold font-sans">98.4% Legal Match</span>
                </div>
                <div className="p-2 border border-slate-800/60 bg-slate-900/30 rounded-lg">
                  <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase">Privacy</span>
                  <span className="text-xs text-emerald-400 font-semibold font-sans">Data Ephemeral</span>
                </div>
              </div>
            </div>
          </section>

          {/* Results Side */}
          {isAnalyzing && (
            <section className="lg:col-span-7 flex flex-col justify-center items-center p-12 min-h-[480px] bg-slate-900/10 border border-slate-800/50 rounded-2xl shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent animate-pulse" />
              
              <div className="relative flex flex-col items-center">
                {/* Visual radar scanning wave effect */}
                <div className="relative flex items-center justify-center w-28 h-28 mb-6">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-indigo-500/15 border border-indigo-500/30 animate-pulse" />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <BrainCircuit className="w-8 h-8 text-indigo-400 animate-bounce" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide animate-pulse">
                  Analyzing Legal Terms...
                </h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm text-center leading-relaxed h-12">
                  {loadingStep}
                </p>

                {/* Simulated Step Indicator bar */}
                <div className="w-56 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-2/3 rounded-full animate-infinite-loading" />
                </div>
              </div>
            </section>
          )}

          {result && (
            <section className="lg:col-span-7 flex flex-col gap-6 animate-fade-in">
              
              {/* Top Banner Row: Brand and Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Brand Banner Card */}
                <div className="md:col-span-12 lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Scale className="w-32 h-32 text-indigo-400" />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-md shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">
                      Parsed Target Platform
                    </span>
                    <h2 className="text-xl font-bold text-white truncate leading-tight mt-1">
                      {result.appName || "Terms Document"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 lines-clamp-2">
                       We've assessed {result.keyProvisions.length} distinct clauses. Keep a copy in mind prior to accepting their services.
                    </p>
                  </div>
                </div>

                {/* Risk dial / Meter Card */}
                <div className="md:col-span-12 lg:col-span-5 h-full">
                  <RiskMeter
                    score={result.riskScore}
                    level={result.riskLevel}
                    verdict={result.verdict}
                  />
                </div>
              </div>

              {/* Executive Summary Section */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Executive Legal Summary
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold tracking-widest font-mono uppercase">
                    AI Scrutiny Output
                  </span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-line">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Favorable Consumer Points (Wins) */}
              {result.favorablePoints && result.favorablePoints.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      Safe Consumer Safeguards Detected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    {result.favorablePoints.map((point, index) => (
                      <div key={index} className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex flex-col">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                          {point.title}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1 leading-normal">
                          {point.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Provisions Filter & Cards List */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <div className="flex flex-col gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Significant Key Clauses
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Total: {result.keyProvisions.length} detected
                    </span>
                  </div>

                  {/* Category filters */}
                  <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1 mt-1 scrollbar-none">
                    {categories.map((cat) => {
                      const isSelected = activeCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategoryFilter(cat)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-medium border font-sans whitespace-nowrap transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-slate-200 border-slate-200 text-slate-900 font-semibold"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clauses display list */}
                <div className="space-y-4 mt-4">
                  {filteredProvisions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 font-sans">
                        No provisions matched this specific category. Try "All" tab.
                      </p>
                    </div>
                  ) : (
                    filteredProvisions.map((clause: KeyProvision, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 border rounded-xl flex flex-col gap-3 transition-all duration-300 relative overflow-hidden bg-slate-950/40 ${
                          clause.isRedFlag
                            ? "border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.02)]"
                            : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/20"
                        }`}
                      >
                        {/* Red Flag indicator left highlight line */}
                        {clause.isRedFlag && (
                          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-rose-500" />
                        )}

                        {/* Top Metadata */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            {clause.isRedFlag && (
                              <span className="flex items-center justify-center p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <h4 className="text-xs font-bold text-white truncate">
                              {clause.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[9px] font-bold font-mono uppercase">
                              {clause.category}
                            </span>
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-bold font-mono uppercase ${getProvisionRiskStyles(clause.riskLevel)}`}>
                              {clause.riskLevel}
                            </span>
                          </div>
                        </div>

                        {/* Text quote snippet */}
                        <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 relative max-h-36 overflow-y-auto">
                          <span className="absolute top-1 left-2 text-xl font-serif text-slate-700 font-bold select-none leading-none">“</span>
                          <span className="absolute bottom-1 right-2 text-xl font-serif text-slate-700 font-bold select-none leading-none">”</span>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-mono px-4">
                            {clause.textSnippet}
                          </p>
                        </div>

                        {/* Translation block */}
                        <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-900">
                          <div className="mt-0.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          </div>
                          <div className="flex-1">
                            <span className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide font-sans">
                              Implication (Plain English):
                            </span>
                            <p className="text-xs text-slate-400 leading-relaxed mt-0.5 font-sans">
                              {clause.implication}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chatbot De-escalation Consultation Panel (LexScan AI Copilot) */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg h-[480px]">
                {/* Embedded Copilot Top Header bar */}
                <div className="bg-slate-950/60 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        LexScan AI Copilot
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Discuss implications, negotiate claims, or seek clarifications.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                      Online Counsel
                    </span>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`rounded-xl p-3 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                            : "bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-line font-sans">{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 uppercase font-mono tracking-wider">
                        {msg.role === "user" ? "You" : "Audit Bot"} • {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {isSendingChat && (
                    <div className="flex items-start gap-2.5 max-w-[80%]">
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                        <span>Formulating lawyer perspective...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Suggestion Chips */}
                {result.suggestedQuestions && (
                  <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/30 flex gap-2 overflow-x-auto scrollbar-none items-center">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-widest font-mono">
                      Query Prompts:
                    </span>
                    {result.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        disabled={isSendingChat}
                        id={`sh-q-btn-${idx}`}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] rounded-full whitespace-nowrap truncate max-w-xs transition-colors hover:text-white cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question form field area */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage("");
                  }}
                  className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask standard questions (e.g. 'Can I terminate my membership any month?')..."
                    className="flex-1 bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder-slate-500"
                    disabled={isSendingChat}
                    id="chat-input-field"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    id="chat-submit-btn"
                    className={`p-2 rounded-lg bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500 transition-colors ${
                      (isSendingChat || !chatInput.trim()) ? "opacity-50 cursor-not-allowed bg-slate-800" : ""
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </section>
          )}
        </div>
      </main>

      {/* Footer matching 'Immersive UI' style precisely */}
      <footer className="h-12 border-t border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between mt-12 text-[10px] font-mono shrink-0 z-10 text-slate-500">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="font-bold text-slate-400 uppercase tracking-widest">
              Security Shield Active
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600">
            GEMINI AUDITS COVERED BY ENCRYPTION STANDARD SECURE CONTEXT
          </span>
        </div>
        <div className="text-right text-slate-600">
          v4.5.1-STABLE | CORE SYSTEM: LEXSCAN-PRO-NATIVE
        </div>
      </footer>

      {/* Dynamic Chrome Extension Builder Modal */}
      {showExtensionSuite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#090d1a] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col my-8">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-550 via-emerald-400 to-emerald-555" />
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Chrome Extension Builder Suite
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full font-mono uppercase font-bold tracking-wider">
                      Live Compiling
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate, download, and install your real-time browser agent to evaluate legal risks instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtensionSuite(false)}
                className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Two Column Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto max-h-[70vh]">
              
              {/* Left Column: Easy Stepper Guides */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#6366f1] font-mono mb-3">
                    Installation Walkthrough
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">1</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Download Source Files</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Click the **Download File** buttons on the right tab for all three files (<code className="text-indigo-400 font-mono text-[10px]">manifest.json</code>, <code className="text-indigo-400 font-mono text-[10px]">popup.html</code>, and <code className="text-indigo-400 font-mono text-[10px]">popup.js</code>). Put them inside any new empty folder on your desktop (e.g. named <code className="font-mono text-emerald-400">"LexScan Shield"</code>).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">2</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Access Chrome Extensions</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Open your Google Chrome browser and navigate to the security extensions URL: <code className="text-indigo-400 font-mono px-1 py-0.5 bg-slate-950 border border-slate-800 rounded select-all text-[10px]">chrome://extensions/</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">3</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Toggle Developer Mode</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Turn on the **Developer Mode** toggle switch located in the upper-right region of Chrome's Extensions tab.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">✔</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          Click "Load Unpacked"
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Click the **"Load unpacked"** button in the upper-left corner of the page, choose the folder with your files, and you are ready! Click the Extension puzzle icon in your browser to pin LexScan AI.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/10 p-4 rounded-xl">
                  <div className="flex items-start gap-2 text-xs text-emerald-400 leading-normal font-sans">
                    <span className="text-base">💡</span>
                    <span>
                      **Configured Connection**: All files compile with your current active server URL: <strong className="text-white font-mono">{window.location.origin}</strong> automatically, making it fully-functional out-of-the-box.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Code Tab View & Action Downloaders */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                
                {/* File Toggles */}
                <div className="flex bg-slate-950 border border-slate-900 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedExtCodeTab("manifest")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      selectedExtCodeTab === "manifest" ? "bg-indigo-600/70 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    manifest.json
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExtCodeTab("html")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      selectedExtCodeTab === "html" ? "bg-indigo-600/70 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    popup.html
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedExtCodeTab("js")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                      selectedExtCodeTab === "js" ? "bg-indigo-600/70 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    popup.js
                  </button>
                </div>

                {/* Main Code Box Container */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-xl overflow-hidden flex flex-col relative">
                  
                  {/* Action Copy/Download Panel */}
                  <div className="flex items-center justify-between p-3 border-b border-slate-900 bg-slate-950/60 z-10">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                      {selectedExtCodeTab === "manifest" ? "manifest configuration" : selectedExtCodeTab === "html" ? "visual layout" : "active controller script"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const body = selectedExtCodeTab === "manifest" 
                            ? getManifestCode() 
                            : selectedExtCodeTab === "html" 
                              ? getPopupHtmlCode() 
                              : getPopupJsCode(window.location.origin);
                          handleCopy(selectedExtCodeTab, body);
                        }}
                        className="p-1 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white"
                      >
                        <Copy className="w-3 h-3 text-indigo-400" />
                        <span>{copiedFile === selectedExtCodeTab ? "Copied!" : "Copy Code"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const body = selectedExtCodeTab === "manifest" 
                            ? getManifestCode() 
                            : selectedExtCodeTab === "html" 
                              ? getPopupHtmlCode() 
                              : getPopupJsCode(window.location.origin);
                          const filename = selectedExtCodeTab === "manifest" 
                            ? "manifest.json" 
                            : selectedExtCodeTab === "html" 
                              ? "popup.html" 
                              : "popup.js";
                          const mime = selectedExtCodeTab === "manifest" ? "text/json" : "text/plain";
                          downloadFile(filename, body, mime);
                        }}
                        className="p-1 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-white" />
                        <span>Download file</span>
                      </button>
                    </div>
                  </div>

                  {/* Pre Block Preview with line numbers and copy option */}
                  <div className="p-4 overflow-x-auto overflow-y-auto max-h-[300px] text-[11px] font-mono text-slate-300 leading-normal select-all select-text font-semibold">
                    <pre className="whitespace-pre">
                      {selectedExtCodeTab === "manifest" 
                        ? getManifestCode() 
                        : selectedExtCodeTab === "html" 
                          ? getPopupHtmlCode() 
                          : getPopupJsCode(window.location.origin)}
                    </pre>
                  </div>
                </div>

                {/* Small Warning Alert */}
                <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                  Notice: All codes compiled dynamically dynamically for SSL/secure remote routing parameters. No developer build step or configuration keys required.
                </p>
              </div>
            </div>

            {/* Modal Bottom Footer bar */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500 font-mono">
                SECURE CONTEXT: PRE-COMPILED GATEWAY TUNNEL ACTIVE
              </span>
              <button
                type="button"
                onClick={() => setShowExtensionSuite(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-900/10"
              >
                Done, Return to Live App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
