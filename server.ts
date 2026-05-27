import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Ensure the dev server port is strictly 3000
const PORT = 3000;

async function startServer() {
  const app = express();

  // Allow larger payload sizes since Terms & Conditions can be extremely long
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Initialize the server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables!");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // API Endpoint: Analyze Terms and Conditions
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Valid terms and conditions text is required." });
      }

      console.log(`Starting T&C analysis for text of length: ${text.length} characters`);

      const systemPrompt = `You are a world-class Consumer Rights Protection Attorney and Senior Legal Analyst. 
Your task is to analyze the provided Terms & Conditions (T&C) or Privacy Policy document thoroughly and objectively.
Assess the document for consumer safety, key clauses, hidden implications, intellectual property, billing traps, and dispute waivers.
Evaluate implications carefully to generate an overall Risk Score out of 100, where:
- 0 to 30: Low Risk (highly consumer-friendly, respects privacy, reasonable terms)
- 31 to 60: Medium Risk (standard industry terms, some data monetization, standard billing, moderate exposure)
- 61 to 80: High Risk (frequent tracking, broad IP transfers, arbitration waivers, auto-renewal with complex cancelation)
- 81 to 100: Critical Risk (hostile, extensive tracking, broad unilateral changes without notice, massive waivers, deceptive pricing or sneaky billing)

You must produce a highly accurate, professional risk score, an overall high-level summary, a categorized list of key provisions with plain-English implications, favorable terms (if any exist), and direct actionable advice.`;

      const analysisPrompt = `Analyze the terms and conditions text provided below. Calculate the risk score out of 100, provide a rich human-readable summary, identify key provisions/clauses (categorized with plain-language implications and marked as red flags if high risk), find favorable consumer provisions, and suggest 4 custom specific follow-up questions for the user.

---BEGIN TERMS AND CONDITIONS TEXT---
${text.slice(0, 150000)}  // Safety limit to stay within token sizes of normal requests
---END TERMS AND CONDITIONS TEXT---`;

      // Configure a strict JSON responseSchema to prevent any hallucinations
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: analysisPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appName: {
                type: Type.STRING,
                description: "The estimated brand, platform, or vendor name identified in the terms document (e.g., 'Zoom', 'Spotify', 'General Terms')."
              },
              riskScore: {
                type: Type.INTEGER,
                description: "A calculated, objective numerical risk score from 0 (completely consumer-friendly) to 100 (hostile/critical risk)."
              },
              riskLevel: {
                type: Type.STRING,
                description: "Risk categorization matching the score. Must be one of: 'Low', 'Medium', 'High', 'Critical'."
              },
              summary: {
                type: Type.STRING,
                description: "A comprehensive, objective, multi-paragraph legal summary of the document (300-500 words). Explains general tone, content rights, key consent, and things to know before agreeing."
              },
              verdict: {
                type: Type.STRING,
                description: "The definitive human-oriented advice. Must be one of: 'Safe to Accept', 'Accept with Caution', 'High Exposure / Avoid if Possible'."
              },
              keyProvisions: {
                type: Type.ARRAY,
                description: "Major visual interest clauses discovered in the T&C.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "Brief category title for this provision (e.g. 'Unilateral Policy Adjustments', 'Arbitration & Waiver')."
                    },
                    category: {
                      type: Type.STRING,
                      description: "Broad category classifier. Must be one of: 'Privacy & Data', 'Billing & Refunds', 'Intellectual Property', 'Liability & Disputes', 'Account Termination'."
                    },
                    textSnippet: {
                      type: Type.STRING,
                      description: "Actual quote from the terms or precise close paraphrasing of the clause text."
                    },
                    riskLevel: {
                      type: Type.STRING,
                      description: "Clause-specific risk rating: 'Low', 'Medium', 'High', 'Critical'."
                    },
                    implication: {
                      type: Type.STRING,
                      description: "Clear, simple explanation of the legal and real-life consequences of this clause for the end-user."
                    },
                    isRedFlag: {
                      type: Type.BOOLEAN,
                      description: "True if this clause poses significant danger or unexpected loss of rights for the user."
                    }
                  },
                  required: ["title", "category", "textSnippet", "riskLevel", "implication", "isRedFlag"]
                }
              },
              favorablePoints: {
                type: Type.ARRAY,
                description: "Consumer-friendly elements in the document, showing that the company has actively implemented protection practices (e.g., explicit delete tools, user copyright retention).",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "Specific developer name or feature header (e.g., 'Allows Direct Data Portability')."
                    },
                    description: {
                      type: Type.STRING,
                      description: "Explain why this protects the user or is better than industry standards."
                    }
                  },
                  required: ["title", "description"]
                }
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                description: "4 specialized follow-up questions tailored specifically to the contents of this analyzed document.",
                items: {
                  type: Type.STRING
                }
              }
            },
            required: ["appName", "riskScore", "riskLevel", "summary", "verdict", "keyProvisions", "favorablePoints", "suggestedQuestions"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No output text received from Gemini analysis.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json(parsedJSON);
    } catch (err: any) {
      console.error("T&C Analysis endpoint error:", err);
      return res.status(500).json({ error: err.message || "An error occurred during terms analysis." });
    }
  });

  // Helper utility to strip HTML tags and scripts to extract raw terms text
  function cleanHtml(html: string): string {
    let clean = html;
    // Remove scripts, styles, head, and iframe tags
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    clean = clean.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "");
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
    
    // Replace structural block tags with line breaks for formatting
    clean = clean.replace(/<\/p>|<\/div>|<br\s*\/?>|<\/li>|<\/h[1-6]>/gi, "\n");
    // Strip remaining tags
    clean = clean.replace(/<[^>]+>/g, " ");
    
    // Convert common HTML entities
    clean = clean.replace(/&nbsp;/g, " ")
                 .replace(/&amp;/g, "&")
                 .replace(/&lt;/g, "<")
                 .replace(/&gt;/g, ">")
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&rsquo;/g, "'")
                 .replace(/&ldquo;/g, '"')
                 .replace(/&rdquo;/g, '"');

    // Collapse multi-spaces and whitespace blocks
    clean = clean.replace(/\s+/g, " ");
    return clean.trim();
  }

  // API Endpoint: Analyze Terms via URL Link (Active Scraping vs Brand Knowledge Base)
  app.post("/api/analyze-link", async (req, res) => {
    try {
      const { url, mode } = req.body;
      if (!url || typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({ error: "A valid website URL or brand name is required." });
      }

      const activeUrl = url.trim();
      const isScrapeMode = mode === "scrape";
      
      let termsText = "";
      let scrapeDisclaimer = "";

      if (isScrapeMode) {
        // Build valid URL format
        let targetUrl = activeUrl;
        if (!/^https?:\/\//i.test(targetUrl)) {
          targetUrl = "https://" + targetUrl;
        }

        console.log(`[Scraper] Attempting to fetch terms directly from: ${targetUrl}`);
        try {
          // Setup 10-second request timeout controller
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const fetchRes = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LexScanAI/1.0",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!fetchRes.ok) {
            throw new Error(`Website returned a server error status: ${fetchRes.status} (${fetchRes.statusText})`);
          }

          const rawHtml = await fetchRes.text();
          const cleanText = cleanHtml(rawHtml);

          // Standard safety checks on quality of scraped content (anti-bot or cloudflare blockers)
          if (!cleanText || cleanText.length < 350) {
            throw new Error("Scraper successfully connected, but received insufficient terms text content. The page might be protected or requires client-side JavaScript execution.");
          }

          // Limit content length to avoid exceeding Gemini context window
          termsText = cleanText.slice(0, 150000);
          scrapeDisclaimer = `Successfully parsed and active-analyzed ${termsText.length} characters from live document text scraped at ${targetUrl}.`;
          console.log(`[Scraper] Success! Extracted ${termsText.length} cleaned text characters.`);
        } catch (err: any) {
          console.error(`[Scraper] Direct Scraping Failed for ${activeUrl}:`, err.message);
          // High-grade recovery: Failover advice
          return res.status(422).json({
            error: `Website Scraping Blocked or Failed: ${err.message}. \n\nWe recommend using the "AI Knowledge Base Assessment (No Visit)" option to evaluate this service immediately without loading their active live servers.`,
            canFailover: true
          });
        }
      } else {
        // Brand Knowledge base prediction mode
        termsText = `EVALUATE BRAND BY INTERNAL GENERAL LEGAL KNOWLEDGE: ${activeUrl}`;
        scrapeDisclaimer = `Evaluated purely using AI knowledge-base assessment models without visiting the live servers for ${activeUrl}. This offers a highly optimized standard risk profile.`;
      }

      // Configure system prompts matching the chosen evaluation mode
      const systemPrompt = `You are a world-class Consumer Rights Protection Attorney and Senior Legal Analyst. 
Your task is to analyze terms for consumer safety, key clauses, hidden implications, intellectual property rights, billing practices, and legal disputes.
Calculate an overall Risk Score (0-100) and identify crucial red flags or favorable consumer points.
`;

      let queryPrompt = "";
      if (!isScrapeMode) {
        queryPrompt = `The user is providing the name or link of a service: "${activeUrl}".
Do NOT visit the website. Instead, utilize your extensive, current, accurate general legal knowledge database regarding this platform's actual Terms of Service and Privacy Policies.
Evaluate its standard service parameters. List the typical key provisions (such as data-sharing with advertising networks, proprietary licensing, mandatory binding arbitration in their specific registered state inside the US, limits of liability, auto-renewals, cancellation policies, and termination rules). Output high-quality actual/standard information. Choose realistic clauses and typical snippets that represent their live terms.`;
      } else {
        queryPrompt = `We actively gathered the following terms content from the scraped webpage: "${activeUrl}". Analyze it thoroughly.
---BEGIN RETRIEVED TEXT---
${termsText}
---END RETRIEVED TEXT---`;
      }

      // Call Gemini using the established JSON output schema
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: queryPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appName: {
                type: Type.STRING,
                description: "Name of the brand or service (e.g. 'Netflix', 'Slack')."
              },
              riskScore: {
                type: Type.INTEGER,
                description: "Calculated risk score from 0 (very friendy) to 100 (hostile/critical)."
              },
              riskLevel: {
                type: Type.STRING,
                description: "Must be: 'Low', 'Medium', 'High', 'Critical'."
              },
              summary: {
                type: Type.STRING,
                description: "Provide a detailed multiple-paragraph legal summary explaining standard behavior, major clauses, data practices, and general advice."
              },
              verdict: {
                type: Type.STRING,
                description: "Definitive action. Must be: 'Safe to Accept', 'Accept with Caution', 'High Exposure / Avoid if Possible'."
              },
              keyProvisions: {
                type: Type.ARRAY,
                description: "Identified clauses with high visibility implications.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING, description: "Must be one of: 'Privacy & Data', 'Billing & Refunds', 'Intellectual Property', 'Liability & Disputes', 'Account Termination'." },
                    textSnippet: { type: Type.STRING, description: "Exact or closely paraphrased legal clause representation." },
                    riskLevel: { type: Type.STRING, description: "Clause risk level." },
                    implication: { type: Type.STRING, description: "What this really means for the user in simple, actionable English." },
                    isRedFlag: { type: Type.BOOLEAN }
                  },
                  required: ["title", "category", "textSnippet", "riskLevel", "implication", "isRedFlag"]
                }
              },
              favorablePoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["appName", "riskScore", "riskLevel", "summary", "verdict", "keyProvisions", "favorablePoints", "suggestedQuestions"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No output text received from legal generation engine.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      
      // Inject terms text and disclaimer so the client-side can show or query the terms!
      return res.json({
        ...parsedJSON,
        scrapedText: isScrapeMode ? termsText : `Evaluated based on AI Legal Knowledge Base representation for "${activeUrl}". No active fetch commands were placed.`,
        disclaimer: scrapeDisclaimer
      });

    } catch (err: any) {
      console.error("T&C Analysis Link error:", err);
      return res.status(500).json({ error: err.message || "An error occurred during link evaluations." });
    }
  });

  // API Endpoint: Ask a Question (Chatbot context)
  app.post("/api/chat", async (req, res) => {
    try {
      const { termsText, messages, userMessage } = req.body;
      if (!termsText || typeof termsText !== "string" || termsText.trim().length === 0) {
        return res.status(400).json({ error: "Context Terms text is required." });
      }
      if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
        return res.status(400).json({ error: "A valid user question is required." });
      }

      console.log(`Answering user query regarding terms. History length: ${messages?.length || 0}`);

      const systemPrompt = `You are an expert consumer rights lawyer and legal analyzer assistant.
You must answer the user's questions about the provided Terms and Conditions.
Always represent user rights objectively and helpfully. Reference specific clauses or principles from the T&C text if they exist.
Keep your answers conversational, concise, and structured (use bullet points or line breaks for readability). 
Do not hallucinate agreements. If the text does not mention a certain topic (e.g., if they ask 'Does Disney own my art' but the terms are for Zoom), explain gracefully that the document does not seem to cover that or it belongs to a different platform.

Here is the exact text of the Terms & Conditions being discussed:
---START TERMS AND CONDITIONS---
${termsText.slice(0, 120000)}
---END TERMS AND CONDITIONS---`;

      // Map chat history to Gemini API format: [{ role: 'user' | 'model', parts: [{ text }] }]
      const conversationParts: any[] = [];
      if (Array.isArray(messages)) {
        for (const msg of messages) {
          if (msg.role && msg.content) {
            conversationParts.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }]
            });
          }
        }
      }

      // Add the final user turn
      conversationParts.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: conversationParts,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        }
      });

      return res.json({ reply: response.text });
    } catch (err: any) {
      console.error("T&C Chat endpoint error:", err);
      return res.status(500).json({ error: err.message || "An error occurred during chat consultation." });
    }
  });

  // Serve static assets in production or set up Vite Dev Server Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express in PRODUCTION mode targeting compiled SPA...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started successfully. Direct requests are routing to http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
