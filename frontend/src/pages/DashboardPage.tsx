import { motion } from "framer-motion";
import { Database, BarChart3, ShieldCheck, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";

const statusColors: Record<string, string> = {
  success: "bg-success", warning: "bg-accent", error: "bg-destructive", info: "bg-primary",
};

const DashboardPage = () => {
  const [stats, setStats] = useState([
    { label: "Total Datasets", value: "0", icon: Database, change: "+0%" },
    { label: "Samples Created", value: "0", icon: BarChart3, change: "+0%" },
    { label: "Validation Score", value: "0%", icon: ShieldCheck, change: "+0%" },
    { label: "Bias Score", value: "0%", icon: TrendingUp, change: "+0%" },
  ]);
  const [pieData, setPieData] = useState([
    { name: "Valid", value: 100, color: "#10B981" },
    { name: "Invalid", value: 0, color: "#EF4444" },
  ]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [lineData] = useState([
    { name: "Mon", samples: 1200 }, { name: "Tue", samples: 3400 },
    { name: "Wed", samples: 2800 }, { name: "Thu", samples: 5200 },
    { name: "Fri", samples: 4100 }, { name: "Sat", samples: 6800 },
    { name: "Sun", samples: 7200 },
  ]);

  useEffect(() => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) return;
    const data = JSON.parse(raw);

    const validScore = Math.round((data.stats.avg_validation_score ?? 0) * 100);
    const invalidCount = data.stats.invalid_count ?? 0;
    const biasScore = Math.round((invalidCount / data.total_generated) * 100);

    setStats([
      { label: "Total Datasets", value: "1", icon: Database, change: "+100%" },
      { label: "Samples Created", value: String(data.total_generated), icon: BarChart3, change: "+100%" },
      { label: "Validation Score", value: `${validScore}%`, icon: ShieldCheck, change: "+2.1%" },
      { label: "Bias Score", value: `${biasScore}%`, icon: TrendingUp, change: biasScore > 5 ? "+bad" : "-good" },
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
        <p className="text-muted-foreground mt-1">Overview of your dataset generation activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.includes("bad") ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
              }`}>{stat.change}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Samples Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(217 33% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px", color: "hsl(213 31% 91%)" }} />
              <Line type="monotone" dataKey="samples" stroke="hsl(239 84% 67%)" strokeWidth={2} dot={{ fill: "hsl(239 84% 67%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Class Distribution</h3>
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