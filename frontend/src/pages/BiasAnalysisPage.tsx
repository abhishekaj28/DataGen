import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import MockNotice from "@/components/MockNotice";

const COLORS = ["#10B981", "#EF4444", "#6366F1", "#F59E0B", "#22D3EE"];

const BiasAnalysisPage = () => {
  const [classData, setClassData] = useState<any[]>([]);
  const [imbalanceData, setImbalanceData] = useState<any[]>([]);
  const [diversity, setDiversity] = useState<{ label: string; display: string; pct?: number; color: string }[]>([]);
  const [source, setSource] = useState<string | undefined>(undefined);
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

      // Diversity metrics computed from the generated inputs themselves
      const inputs: string[] = (data.samples ?? []).map((x: any) => String(x.input ?? "").trim().toLowerCase());
      const words = inputs.flatMap((t) => t.split(/\s+/).filter(Boolean));
      const lengths = inputs.map((t) => t.split(/\s+/).filter(Boolean).length);
      const lexical = words.length ? Math.round((new Set(words).size / words.length) * 1000) / 10 : 0;
      const uniqueInputs = inputs.length ? Math.round((new Set(inputs).size / inputs.length) * 1000) / 10 : 0;
      const avgLen = lengths.length ? Math.round((lengths.reduce((a, b) => a + b, 0) / lengths.length) * 10) / 10 : 0;
      setDiversity([
        { label: "Lexical Diversity (unique words / all words)", display: `${lexical}%`, pct: lexical, color: "bg-primary" },
        { label: "Unique Inputs", display: `${uniqueInputs}%`, pct: uniqueInputs, color: "bg-success" },
        { label: "Average Input Length", display: `${avgLen} words`, color: "bg-accent" },
        { label: "Input Length Range", display: lengths.length ? `${Math.min(...lengths)}-${Math.max(...lengths)} words` : "-", color: "bg-accent" },
      ]);
      setSource(data.source);

      setClassData(pie);
      setImbalanceData(imbalance);
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
        <p className="text-muted-foreground mt-1">Class distribution and dataset diversity. This is not a demographic or fairness audit.</p>
      </div>

      <MockNotice source={source} />

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
        <h3 className="text-lg font-semibold text-foreground mb-1">Dataset Diversity</h3>
        <p className="text-xs text-muted-foreground mb-6">Computed from the generated inputs of the last run.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {diversity.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <p className="text-sm text-muted-foreground mb-2">{m.label}</p>
              <p className="text-2xl font-bold text-foreground mb-2">{m.display}</p>
              {m.pct !== undefined && (
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div className={`h-full rounded-full ${m.color}`} initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiasAnalysisPage;