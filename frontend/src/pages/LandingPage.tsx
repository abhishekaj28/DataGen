import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Bot, ShieldCheck, BarChart3, Zap, Github, BookOpen, Info } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const features = [
  {
    icon: Sparkles,
    title: "Smart AI Generation",
    description: "Generate high-quality synthetic datasets with advanced language models and domain-specific fine-tuning.",
  },
  {
    icon: Bot,
    title: "Autonomous Agent Loop",
    description: "Multi-agent architecture with planner, generator, critic, and bias detection working in harmony.",
  },
  {
    icon: ShieldCheck,
    title: "Bias Detection Engine",
    description: "Real-time bias analysis with class balancing, linguistic diversity scoring, and fairness metrics.",
  },
  {
    icon: BarChart3,
    title: "Validation & Export",
    description: "Schema validation, duplicate detection, semantic consistency checks with one-click export.",
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const LandingPage = () => {
  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold text-foreground">DataGen</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Features</a>
          <a href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Architecture</a>
          <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all hover:glow-primary">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-accent mb-8">
          <Sparkles className="w-4 h-4" />
          Autonomous Dataset Intelligence Agent
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          From idea to{" "}
          <span className="gradient-text">high-quality dataset</span>
          <br />in seconds.
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          DataGenX automatically generates, validates, balances, and exports
          synthetic datasets using autonomous AI agents — no manual effort required.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
          <Link
            to="/dashboard/generate"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all hover:glow-primary hover:scale-105"
          >
            Start Generating <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass text-foreground font-semibold text-lg hover:bg-secondary transition-all hover:scale-105">
            <Play className="w-5 h-5 text-accent" /> View Demo
          </button>
        </motion.div>
      </motion.section>

      {/* Features */}
      <motion.section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-8 pb-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-4">
          Powered by <span className="gradient-text">Intelligent Agents</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
          A multi-agent pipeline that plans, generates, critiques, and refines your datasets autonomously.
        </motion.p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="glass rounded-2xl p-6 hover:glow-border transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Architecture Preview */}
      <motion.section
        id="architecture"
        className="relative z-10 max-w-5xl mx-auto px-8 pb-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
      >
        <motion.h2 variants={fadeUp} className="text-3xl font-bold text-center mb-12">
          Agent <span className="gradient-text">Architecture</span>
        </motion.h2>
        <motion.div variants={fadeUp} className="glass rounded-2xl p-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["User Input", "Planner Agent", "Generator Agent", "Critic Agent", "Bias Detector", "Export"].map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="px-5 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium border border-border hover:glow-border transition-all">
                  {step}
                </div>
                {i < 5 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">DataGen</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Documentation
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2">
              <Info className="w-4 h-4" /> About
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 DataGen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;