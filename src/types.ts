export interface KeyProvision {
  title: string;
  category: "Privacy & Data" | "Billing & Refunds" | "Intellectual Property" | "Liability & Disputes" | "Account Termination";
  textSnippet: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  implication: string;
  isRedFlag: boolean;
}

export interface FavorablePoint {
  title: string;
  description: string;
}

export interface AnalysisResult {
  appName: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  verdict: string;
  keyProvisions: KeyProvision[];
  favorablePoints: FavorablePoint[];
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
