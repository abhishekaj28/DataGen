import { AlertTriangle } from "lucide-react";

/** Shown when the last dataset came from the demo fallback instead of a real LLM. */
const MockNotice = ({ source }: { source?: string }) => {
  if (source !== "mock") return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
      <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
      <p>
        <strong>Demo data.</strong> No API key was supplied, so this dataset is a small set of canned
        examples, not LLM output. Add a Gemini API key in Settings to generate real data.
      </p>
    </div>
  );
};

export default MockNotice;
