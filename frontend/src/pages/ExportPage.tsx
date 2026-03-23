import { motion } from "framer-motion";
import { Download, Copy, Share2, FileJson, FileSpreadsheet, CheckCircle } from "lucide-react";
import { useState } from "react";

const ExportPage = () => {
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    const raw = localStorage.getItem("lastDataset");
    if (!raw) {
      alert("No dataset generated yet! Go to Generate Dataset first.");
      return;
    }
    const data = JSON.parse(raw);
    const samples = data.samples.map((s: any) => ({
      id: s.id,
      input: s.input,
      output: s.output,
      metadata: s.metadata,
    }));

    if (type === "json") {
      const blob = new Blob([JSON.stringify(samples, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datagen_${data.task_type}_${data.domain}.json`;
      a.click();
    } else if (type === "csv") {
      const rows = [["id", "input", "output"]];
      samples.forEach((s: any) => rows.push([s.id, s.input, JSON.stringify(s.output)]));
      const csv = rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datagen_${data.task_type}_${data.domain}.csv`;
      a.click();
    } else if (type === "clipboard") {
      await navigator.clipboard.writeText(JSON.stringify(samples, null, 2));
    }

    setExported(type);
    setTimeout(() => setExported(null), 2000);
  };

  const options = [
    { id: "json", label: "Download JSON", icon: FileJson, description: "Structured JSON format with metadata" },
    { id: "csv", label: "Download CSV", icon: FileSpreadsheet, description: "Flat CSV format for spreadsheets" },
    { id: "clipboard", label: "Copy to Clipboard", icon: Copy, description: "Copy dataset to clipboard" },
    { id: "api", label: "Share via API Key", icon: Share2, description: "Generate a shareable API endpoint" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Export Dataset</h1>
        <p className="text-muted-foreground mt-1">Download or share your generated dataset</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Latest Dataset</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Classification • Medical Domain • 5,000 samples • Generated 2 min ago</p>

        <div className="grid md:grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <motion.button key={opt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={() => handleExport(opt.id)}
              className="glass rounded-2xl p-6 text-left hover:glow-border transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {exported === opt.id ? <CheckCircle className="w-5 h-5 text-success" /> : <opt.icon className="w-5 h-5 text-primary" />}
                </div>
                <h4 className="font-semibold text-foreground">{opt.label}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
              {exported === opt.id && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-success mt-3 font-medium">
                  ✓ Export successful!
                </motion.p>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
