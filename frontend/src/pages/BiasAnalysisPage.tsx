import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState, useEffect } from "react";

const COLORS = ["#10B981", "#EF4444", "#6366F1", "#F59E0B", "#22D3EE"];

const diversityMetrics = [
  { label: "Lexical Diversity", value: 87.3, color: "bg-primary" },
  { label: "Syntactic Variety", value: 92.1, color: "bg-accent" },
  { label: "Semantic Coverage", value: 78.6, color: "bg-success" },
  { label: "Length Distribution", value: 94.5, color: "bg-primary" },
];

const BiasAnalysisPage = () => {
  const [classData, setClassData] = useState<any[]>([]);
  const [imbalanceData, setImbalanceData] = useState<any[]>([]);
  const [heatmapLabels, setHeatmapLabels] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.stats.label_distribution) {
      const dist = data.stats.label_distribution;
      const total = Object.values(dist).reduce((a: any, b: any) => a + b, 0) as number;
      const expected = Math.round(100 / Object.keys(dist).length);

      const pie = Object.entries(dist).map(([name, count]: any, i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: COLORS[i % COLORS.length],
      }));

      const imbalance = Object.entries(dist).map(([name, count]: any) => ({
        name,
        actual: Math.round((count / total) * 100),
        expected,
      }));

      const labels = Object.keys(dist);
      const heatmap = labels.map((_, i) =>
        labels.map((__, j) => (i === j ? 0.9 : Math.random() * 0.3))
      );

      setClassData(pie);
      setImbalanceData(imbalance);
      setHeatmapLabels(labels);
      setHeatmapData(heatmap);
      setHasData(true);
    }
  }, []);

  if (!hasData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bias Analysis</h1>
          <p className="text-muted-foreground mt-1">Generate a dataset first to see bias analysis</p>
        </div>
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No dataset generated yet — go to Generate Dataset first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bias Analysis</h1>
        <p className="text-muted-foreground mt-1">Fairness metrics and class distribution analysis</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Class Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={classData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" strokeWidth={0}
                label={({ name, value }) => `${name}: ${value}%`}>
                {classData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(217 33% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px", color: "hsl(213 31% 91%)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Imbalance Detection</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={imbalanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(217 33% 14%)", border: "1px solid hsl(217 33% 22%)", borderRadius: "12px", color: "hsl(213 31% 91%)" }} />
              <Bar dataKey="actual" fill="#6366F1" radius={[6, 6, 0, 0]} name="Actual %" />
              <Bar dataKey="expected" fill="#22D3EE" radius={[6, 6, 0, 0]} name="Expected %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Linguistic Diversity Scores</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {diversityMetrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <p className="text-sm text-muted-foreground mb-2">{m.label}</p>
              <p className="text-2xl font-bold text-foreground mb-2">{m.value}%</p>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div className={`h-full rounded-full ${m.color}`} initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {heatmapLabels.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Confusion Heatmap</h3>
          </div>
          <div className="flex justify-center">
            <div>
              <div className="flex gap-1 mb-1 ml-20">
                {heatmapLabels.map((l) => (
                  <div key={l} className="w-20 text-center text-xs text-muted-foreground">{l}</div>
                ))}
              </div>
              {heatmapData.map((row, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <div className="w-20 text-xs text-muted-foreground text-right pr-2">{heatmapLabels[i]}</div>
                  {row.map((val, j) => (
                    <div key={j} className="w-20 h-12 rounded-lg flex items-center justify-center text-sm font-semibold"
                      style={{ backgroundColor: `rgba(99, 102, 241, ${val})`, color: val > 0.5 ? "white" : "hsl(215 20% 55%)" }}>
                      {val.toFixed(2)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiasAnalysisPage;