import { useState, useEffect } from "react";
import { Settings, Key, CheckCircle, Eye, EyeOff, Trash2 } from "lucide-react";

const SettingsPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState("JSON");

  useEffect(() => {
    const stored = localStorage.getItem("gemini_api_key") || "";
    setSavedKey(stored);
    setApiKey(stored);
    const fmt = localStorage.getItem("default_format") || "JSON";
    setDefaultFormat(fmt);
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    localStorage.setItem("gemini_api_key", trimmed);
    localStorage.setItem("default_format", defaultFormat);
    setSavedKey(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setSavedKey("");
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "•".repeat(key.length);
    return key.slice(0, 7) + "•".repeat(key.length - 11) + key.slice(-4);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your DataGen preferences</p>
      </div>

      {/* API Key Section */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
          {savedKey && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-success bg-success/10 px-3 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Key saved
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            Gemini API Key
          </label>
          <p className="text-xs text-muted-foreground">
            Your key is stored locally in your browser and never sent to any server except Gemini's API.
          </p>
          <div className="relative max-w-xl">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 pr-20 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {savedKey && (
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {savedKey && !showKey && (
            <p className="text-xs text-muted-foreground font-mono">
              Currently saved: {maskKey(savedKey)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">LLM Provider</label>
          <select
            className="w-full max-w-md px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none opacity-70"
          >
            <option>Google Gemini</option>
            <option>OpenAI</option>
            <option>Anthropic</option>
          </select>
          <p className="text-xs text-muted-foreground">More providers coming soon.</p>
        </div>
      </div>

      {/* General Settings */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">General</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Default Output Format</label>
            <div className="flex gap-2">
              {["JSON", "CSV"].map((f) => (
                <button
                  key={f}
                  onClick={() => setDefaultFormat(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${defaultFormat === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
