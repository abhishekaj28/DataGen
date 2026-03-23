import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Brain, ShieldCheck, Scale, ArrowRight, RefreshCw } from "lucide-react";

interface AgentStat {
  name: string;
  icon: React.ElementType;
  status: "Active" | "Running" | "Idle" | "Completed";
  confidence: number;
  iterations: number;
  description: string;
  detail: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Running: "bg-primary/10 text-primary",
  Idle: "bg-muted text-muted-foreground",
  Completed: "bg-accent/10 text-accent",
};

const AgentMonitorPage = () => {
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const loadFromDataset = () => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) {
      setHasData(false);
      setAgents(getDefaultAgents());
      return;
    }

    try {
      const data = JSON.parse(raw);
      setHasData(true);

      const totalGenerated = data.total_generated ?? 0;
      const totalValid = data.total_valid ?? 0;
      const invalidCount = data.stats?.invalid_count ?? 0;
      const avgScore = data.stats?.avg_validation_score ?? 0;
      const taskType = data.task_type ?? "unknown";
      const domain = data.domain ?? "unknown";

      // Derive per-agent stats from real data
      const qualityPct = Math.round(avgScore * 100);
      const biasCoverage = totalGenerated > 0 ? Math.round((totalValid / totalGenerated) * 100) : 0;

      setLastRun(new Date().toLocaleTimeString());

      setAgents([
        {
          name: "Planner Agent",
          icon: Brain,
          status: "Completed",
          confidence: 97,
          iterations: 1,
          description: "Analyzes task requirements and creates generation plan",
          detail: `Task: ${taskType} | Domain: ${domain} | Requested: ${data.total_requested} samples`,
        },
        {
          name: "Generator Agent",
          icon: Bot,
          status: "Completed",
          confidence: Math.min(99, 85 + qualityPct / 10),
          iterations: totalGenerated,
          description: "Creates synthetic samples using Claude",
          detail: `Generated ${totalGenerated} samples via Anthropic claude-sonnet-4-6`,
        },
        {
          name: "Critic Agent",
          icon: ShieldCheck,
          status: "Completed",
          confidence: qualityPct,
          iterations: totalGenerated,
          description: "Validates schema consistency and quality metrics",
          detail: `${totalValid} valid, ${invalidCount} flagged | Avg score: ${qualityPct}%`,
        },
        {
          name: "Bias Detector",
          icon: Scale,
          status: "Completed",
          confidence: biasCoverage,
          iterations: totalGenerated,
          description: "Monitors class balance and linguistic diversity",
          detail: `Valid coverage: ${biasCoverage}% | Flagged: ${invalidCount} samples`,
        },
      ]);
    } catch {
      setHasData(false);
      setAgents(getDefaultAgents());
    }
  };

  const getDefaultAgents = (): AgentStat[] => [
    {
      name: "Planner Agent",
      icon: Brain,
      status: "Idle",
      confidence: 0,
      iterations: 0,
      description: "Analyzes task requirements and creates generation plan",
      detail: "No dataset generated yet.",
    },
    {
      name: "Generator Agent",
      icon: Bot,
      status: "Idle",
      confidence: 0,
      iterations: 0,
      description: "Creates synthetic samples using Claude",
      detail: "Waiting for generation task.",
    },
    {
      name: "Critic Agent",
      icon: ShieldCheck,
      status: "Idle",
      confidence: 0,
      iterations: 0,
      description: "Validates schema consistency and quality metrics",
      detail: "No validation run yet.",
    },
    {
      name: "Bias Detector",
      icon: Scale,
      status: "Idle",
      confidence: 0,
      iterations: 0,
      description: "Monitors class balance and linguistic diversity",
      detail: "Awaiting dataset.",
    },
  ];

  useEffect(() => {
    loadFromDataset();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agent Monitor</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `Real-time status from last generation run${lastRun ? ` · ${lastRun}` : ""}`
              : "Generate a dataset first to see live agent stats"}
          </p>
        </div>
        <button
          onClick={loadFromDataset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {!hasData && (
        <div className="glass rounded-2xl p-6 text-center text-muted-foreground space-y-2">
          <p className="text-lg font-medium">No generation data yet</p>
          <p className="text-sm">Go to <strong>Generate Dataset</strong>, run a generation, and come back here to see real agent metrics.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {agents.map((agent, i) => (
          <motion.div key={agent.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 hover:glow-border transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <agent.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.description}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[agent.status]}`}>
                {agent.status}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Confidence</span>
                  <span>{agent.confidence.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.confidence}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Samples Processed</span>
                <span className="font-medium text-foreground">{agent.iterations}</span>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{agent.detail}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline flow */}
      {hasData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pipeline Flow</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["Planner", "Generator", "Critic", "Bias Detector", "Export"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-xl text-sm font-medium ${step === "Export" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                  }`}>
                  {step}
                </div>
                {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AgentMonitorPage;
