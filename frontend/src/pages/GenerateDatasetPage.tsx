import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Terminal, CheckCircle, AlertTriangle, Loader2, Key } from "lucide-react";

const taskTypes = ["Classification", "Question Answering", "Summarization", "NER", "Intent Detection"];
const outputFormats = ["JSON", "CSV"];

const TASK_MAP: Record<string, string> = {
  "Classification": "classification",
  "Question Answering": "qa",
  "Summarization": "summarization",
  "NER": "ner",
  "Intent Detection": "intent",
};

const GenerateDatasetPage = () => {
  const [taskType, setTaskType] = useState("Classification");
  const [domain, setDomain] = useState("");
  const [samples, setSamples] = useState(10);
  const [format, setFormat] = useState("JSON");
  const [instructions, setInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [noKeyWarning, setNoKeyWarning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("gemini_api_key") || "";
    setApiKey(stored);
    const fmt = localStorage.getItem("default_format") || "JSON";
    setFormat(fmt);
  }, []);

  const handleGenerate = async () => {
    if (!domain.trim()) {
      setLogs(["⚠️ Please enter a domain before generating."]);
      return;
    }

    const key = apiKey.trim();
    if (!key) {
      setNoKeyWarning(true);
      setLogs(["⚠️ No API key found. Please go to Settings and save your Gemini API key first."]);
      return;
    }
    setNoKeyWarning(false);

    setIsGenerating(true);
    setLogs(["🚀 Connecting to DataGen backend..."]);

    try {
      setLogs(prev => [...prev, "📋 Planner Agent: Analyzing task requirements..."]);

      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: TASK_MAP[taskType] || "classification",
          domain: domain.trim(),
          num_samples: Math.min(samples, 50),
          include_edge_cases: true,
          llm_provider: "gemini",
          api_key: key,
          custom_instructions: instructions.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errBody.detail || `Backend error: ${response.status}`);
      }

      const data = await response.json();

      const qualityPct = data.stats?.avg_validation_score
        ? Math.round(data.stats.avg_validation_score * 100)
        : "N/A";

      setLogs(prev => [...prev,
        "🧠 Generator Agent: Creating synthetic samples with Claude...",
      `📊 Generated ${data.total_generated} ${taskType.toLowerCase()} samples...`,
        "🔍 Critic Agent: Validating schema consistency...",
      `✅ Validation passed — ${qualityPct}% quality score`,
      `⚖️ Bias Detector: ${data.total_valid} valid / ${data.stats?.invalid_count ?? 0} flagged`,
      `📦 Dataset ready in ${format} format`,
        "🎉 Dataset generation complete!",
      ]);

      // Store result for other pages
      localStorage.setItem("lastDataset", JSON.stringify(data));

    } catch (error) {
      setLogs(prev => [...prev, "❌ Error: " + (error as Error).message]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Generate Dataset</h1>
        <p className="text-muted-foreground mt-1">Configure and launch AI-powered dataset generation</p>
      </div>

      {/* API Key warning banner */}
      {noKeyWarning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <Key className="w-4 h-4 shrink-0" />
          No Anthropic API key found. Go to <strong className="mx-1">Settings → API Configuration</strong> and save your key to enable real AI generation.
        </div>
      )}

      {/* No key passive notice */}
      {!apiKey && !noKeyWarning && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm">
          <Key className="w-4 h-4 shrink-0" />
          No API key configured — go to <strong className="mx-1">Settings</strong> to add your Anthropic key for real AI generation.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Dataset Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Task Type</label>
              <div className="flex flex-wrap gap-2">
                {taskTypes.map((t) => (
                  <button key={t} onClick={() => setTaskType(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${taskType === t ? "bg-primary text-primary-foreground glow-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Domain</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="e.g., Medical, Legal, Finance..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Number of Samples: {samples} <span className="text-xs text-muted-foreground">(max 50 per request)</span>
              </label>
              <input type="range" min={5} max={50} step={5} value={samples} onChange={(e) => setSamples(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5</span><span>50</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Output Format</label>
              <div className="flex gap-2">
                {outputFormats.map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${format === f ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>{f}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Custom Instructions</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
                placeholder="Add specific requirements, tone, constraints..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
            </div>

            <button onClick={handleGenerate} disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:glow-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Play className="w-5 h-5" /> Generate Dataset</>}
            </button>
          </div>
        </motion.div>

        {/* Console */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="terminal-bg rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Live Generation Console</h2>
            <div className="flex gap-1.5 ml-auto">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
            </div>
          </div>

          {isGenerating && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 10, ease: "linear" as const }} />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2 font-mono text-sm min-h-[300px] overflow-auto">
            {logs.length === 0 && !isGenerating && (
              <p className="text-muted-foreground italic">Waiting for generation to start...</p>
            )}
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                className="flex items-start gap-2">
                {log.includes("✅") ? <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" /> :
                  log.includes("⚖️") ? <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" /> : null}
                <span className={`${log.includes("❌") ? "text-destructive" : log.includes("🎉") ? "text-success" : "text-foreground/90"}`}>
                  {log}
                </span>
              </motion.div>
            ))}
            {isGenerating && <span className="inline-block w-2 h-4 bg-accent animate-pulse-glow" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GenerateDatasetPage;
