import { motion } from "framer-motion";
import { Bot, ShieldCheck, Scale, FileText, ArrowRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import MockNotice from "@/components/MockNotice";

interface Stage {
  name: string;
  icon: any;
  description: string;
  detail: string;
  done: boolean;
}

const emptyStages = (): Stage[] => [
  { name: "Prompt Builder", icon: FileText, description: "Builds a task-specific prompt from your settings", detail: "No dataset generated yet.", done: false },
  { name: "Generator", icon: Bot, description: "Calls the LLM (or returns demo data if no API key)", detail: "Waiting for a generation run.", done: false },
  { name: "Validator", icon: ShieldCheck, description: "Rule-based checks: empty fields, allowed labels, summary length, NER format", detail: "No validation run yet.", done: false },
  { name: "Distribution Check", icon: Scale, description: "Counts labels for classification and intent datasets", detail: "Awaiting dataset.", done: false },
];

const AgentMonitorPage = () => {
  const [stages, setStages] = useState<Stage[]>(emptyStages());
  const [hasData, setHasData] = useState(false);
  const [lastRun, setLastRun] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);

  const loadFromDataset = () => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) {
      setHasData(false);
      setStages(emptyStages());
      return;
    }
    try {
      const data = JSON.parse(raw);
      const generated = data.total_generated ?? 0;
      const valid = data.total_valid ?? 0;
      const flagged = data.stats?.invalid_count ?? 0;
      const avg = Math.round((data.stats?.avg_validation_score ?? 0) * 100);
      const dist = data.stats?.label_distribution;
      const providerText = data.source === "mock" ? "demo data (no API key)" : `LLM provider: ${data.provider ?? "unknown"}`;

      setHasData(true);
      setSource(data.source);
      setLastRun(new Date().toLocaleTimeString());
      setStages([
        { ...emptyStages()[0], done: true, detail: `Task: ${data.task_type} | Domain: ${data.domain} | Requested: ${data.total_requested} samples` },
        { ...emptyStages()[1], done: true, detail: `Produced ${generated} samples from ${providerText}` },
        { ...emptyStages()[2], done: true, detail: `${valid} valid, ${flagged} flagged | Average quality score: ${avg}%` },
        {
          ...emptyStages()[3],
          done: true,
          detail: dist ? `Labels: ${Object.entries(dist).map(([k, v]) => `${k} (${v})`).join(", ")}` : "Not applicable for this task type.",
        },
      ]);
    } catch {
      setHasData(false);
      setStages(emptyStages());
    }
  };

  useEffect(() => {
    loadFromDataset();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline Monitor</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `Stages of the last generation run${lastRun ? ` (loaded ${lastRun})` : ""}`
              : "Generate a dataset first to see the pipeline stages"}
          </p>
        </div>
        <button
          onClick={loadFromDataset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <MockNotice source={source} />

      <div className="grid md:grid-cols-2 gap-6">
        {stages.map((stage, i) => (
          <motion.div key={stage.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stage.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{stage.name}</h3>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stage.done ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                {stage.done ? "Completed" : "Idle"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground pt-2 border-t border-border">{stage.detail}</p>
          </motion.div>
        ))}
      </div>

      {hasData && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pipeline Flow</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["Prompt", "Generate", "Validate", "Distribution", "Export"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-xl text-sm font-medium ${step === "Export" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                  {step}
                </div>
                {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            These are sequential steps in one request, not independent autonomous agents.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentMonitorPage;
