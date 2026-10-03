import { motion } from "framer-motion";
import { Database, BarChart3, ShieldCheck, TrendingUp, Activity } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import MockNotice from "@/components/MockNotice";

const statusColors: Record<string, string> = {
  success: "bg-success", warning: "bg-accent", error: "bg-destructive", info: "bg-primary",
};

const DashboardPage = () => {
  const [stats, setStats] = useState([
    { label: "Datasets (last run)", value: "0", icon: Database },
    { label: "Samples Created", value: "0", icon: BarChart3 },
    { label: "Validation Score", value: "0%", icon: ShieldCheck },
    { label: "Flagged Samples", value: "0%", icon: TrendingUp },
  ]);
  const [runInfo, setRunInfo] = useState<{ label: string; value: string }[]>([]);
  const [source, setSource] = useState<string | undefined>(undefined);
  const [pieData, setPieData] = useState([
    { name: "Valid", value: 100, color: "#10B981" },
    { name: "Invalid", value: 0, color: "#EF4444" },
  ]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) return;
    const data = JSON.parse(raw);

    const validScore = Math.round((data.stats.avg_validation_score ?? 0) * 100);
    const invalidCount = data.stats.invalid_count ?? 0;
    const biasScore = Math.round((invalidCount / data.total_generated) * 100);

    setStats([
      { label: "Datasets (last run)", value: "1", icon: Database },
      { label: "Samples Created", value: String(data.total_generated), icon: BarChart3 },
      { label: "Validation Score", value: `${validScore}%`, icon: ShieldCheck },
      { label: "Flagged Samples", value: `${biasScore}%`, icon: TrendingUp },
    ]);
    setSource(data.source);
    setRunInfo([
      { label: "Task type", value: String(data.task_type) },
      { label: "Domain", value: String(data.domain) },
      { label: "Data source", value: data.source === "mock" ? "Demo data (no API key)" : `LLM (${data.provider ?? "unknown"})` },
      { label: "Requested / generated / valid", value: `${data.total_requested} / ${data.total_generated} / ${data.total_valid}` },
    ]);

    setPieData([
      { name: "Valid", value: data.total_valid, color: "#10B981" },
      { name: "Invalid", value: invalidCount || 0, color: "#EF4444" },
    ]);

    // Build activity log from label distribution
    const logs: any[] = [];
    logs.push({
      time: "Just now",
      message: `${data.task_type} dataset generated — ${data.total_generated} samples in ${data.domain} domain`,
      status: "success",
    });
    logs.push({
      time: "Just now",
      message: `Validation complete — ${validScore}% quality score`,
      status: validScore >= 80 ? "success" : "warning",
    });
    if (data.stats.label_distribution) {
      Object.entries(data.stats.label_distribution).forEach(([label, count]) => {
        logs.push({
          time: "Just now",
          message: `Label "${label}" — ${count} samples generated`,
          status: "info",
        });
      });
    }
    logs.push({
      time: "Just now",
      message: `Dataset ready for export — JSON & CSV available`,
      status: "success",
    });

    setActivityLogs(logs);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Summary of your most recent dataset generation run</p>
      </div>

      <MockNotice source={source} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Last Run</h3>
          {runInfo.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dataset generated yet. Go to Generate Dataset first.</p>
          ) : (
            <dl className="space-y-3">
              {runInfo.map((r) => (
                <div key={r.label} className="flex justify-between text-sm border-b border-border pb-2">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="font-medium text-foreground">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Valid vs Flagged</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(217 33% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px", color: "hsl(213 31% 91%)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        {activityLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet — generate a dataset first!</p>
        ) : (
          <div className="space-y-3">
            {activityLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${statusColors[log.status]}`} />
                <p className="text-sm text-foreground flex-1">{log.message}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;