import React, { useState, useEffect } from "react";
import { Lock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { useEscrow, MST_CONFIG } from "../context/EscrowContext";

export const CreateTask = ({
  setCurrentScreen,
  setSelectedTaskId,
  preselectedAgentId,
}) => {
  const { agents, createTask, matchAgentForPrompt, walletBalance } = useEscrow();

  const [title, setTitle] = useState(
    "Audit LiquidityPool.sol for reentrancy and arithmetic overflows"
  );
  const [description, setDescription] = useState(
    "Specify expected input artifacts, target smart contract address or contract repository, required verification assertions, and deliverable format (bytecode report, formal report)."
  );
  const [budget, setBudget] = useState("450.00");
  const [selectedAgentId, setSelectedAgentId] = useState(
    preselectedAgentId || "secauditor-v4"
  );
  const [aiMatchInfo, setAiMatchInfo] = useState({
    reason: "Suggested Match (Based on Task Scope: Formal Verification)",
    confidence: "98.4%",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedAgentId) {
      setSelectedAgentId(preselectedAgentId);
      const agent = agents.find((a) => a.id === preselectedAgentId);
      if (agent) {
        setBudget(agent.rateNum.toFixed(2));
      }
    }
  }, [preselectedAgentId, agents]);

  // When agent dropdown changes manually, auto-adjust budget
  const handleAgentChange = (e) => {
    const newAgentId = e.target.value;
    setSelectedAgentId(newAgentId);
    const agent = agents.find((a) => a.id === newAgentId);
    if (agent) {
      setBudget(agent.rateNum.toFixed(2));
    }
  };

  // AI prompt analysis trigger
  const handleAiAnalyze = () => {
    const combined = `${title} ${description}`;
    const result = matchAgentForPrompt(combined);
    if (result && result.agent) {
      setSelectedAgentId(result.agent.id);
      setBudget(result.agent.rateNum.toFixed(2));
      setAiMatchInfo({
        reason: `AI Match: ${result.reason}`,
        confidence: result.confidence,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !budget) return;

    setIsSubmitting(true);
    try {
      const created = await createTask({
        title,
        description,
        agentId: selectedAgentId,
        budget,
        deliverableFormat: "spec/liquiditypool_proofs.tar.gz",
      });

      setSelectedTaskId(created.id);
      setCurrentScreen("details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) || agents[0];
  const budgetNum = parseFloat(budget) || 0;
  const gasEstimate = 0.0012;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-stitch-text font-sans">
          Create Task
        </h1>
        <p className="text-sm text-stitch-muted mt-1">
          Define execution parameters and lock verified funds into the non-custodial self-escrow.
        </p>
      </div>

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-stitch-surface border border-stitch-border rounded-lg p-6 sm:p-8 space-y-6 shadow-xl"
      >
        {/* Section 1: Title & Description */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-stitch-muted font-medium">
              TASK TITLE & SPECIFICATION
            </label>
            <button
              type="button"
              onClick={handleAiAnalyze}
              className="text-xs font-mono text-stitch-mint hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Smart Match Agent</span>
            </button>
          </div>

          <div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit LiquidityPool.sol for reentrancy and arithmetic overflows"
              className="w-full bg-stitch-surfaceSubtle border border-stitch-border focus:border-stitch-mint focus:outline-none rounded-md px-4 py-2.5 text-sm font-sans text-stitch-text placeholder:text-stitch-submuted transition-colors"
            />
          </div>

          <div>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Execution specs and test artifacts: Specify expected input artifacts, target smart contract address or contract repository, required verification assertions, and deliverable format (bytecode report, formal report)."
              className="w-full bg-stitch-surfaceSubtle border border-stitch-border focus:border-stitch-mint focus:outline-none rounded-md px-4 py-2.5 text-xs font-sans text-stitch-text placeholder:text-stitch-submuted transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Escrow Budget */}
        <div className="space-y-2 pt-2 border-t border-stitch-border">
          <label className="text-xs font-mono uppercase tracking-wider text-stitch-muted font-medium">
            ESCROW BUDGET (MST)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.1"
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-stitch-surfaceSubtle border border-stitch-border focus:border-stitch-mint focus:outline-none rounded-md pl-4 pr-16 py-2.5 text-base font-mono font-bold text-stitch-text transition-colors"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-stitch-mint font-semibold">
              MST
            </div>
          </div>
          <p className="text-[11px] font-mono text-stitch-submuted">
            Funds are deposited into an on-chain escrow contract and released ONLY after you verify completion or auto-acceptance timeout.
          </p>
        </div>

        {/* Section 3: Assigned Service Agent */}
        <div className="space-y-2 pt-2 border-t border-stitch-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-stitch-muted font-medium">
              ASSIGNED SERVICE AGENT
            </label>
            {aiMatchInfo && (
              <span className="text-[11px] font-mono text-stitch-mint flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-stitch-mint animate-pulse" />
                <span>{aiMatchInfo.confidence} match</span>
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-stitch-muted mb-1">
            {aiMatchInfo.reason}
          </div>

          <select
            value={selectedAgentId}
            onChange={handleAgentChange}
            className="w-full bg-stitch-surfaceSubtle border border-stitch-border focus:border-stitch-mint focus:outline-none rounded-md px-4 py-2.5 text-xs font-mono text-stitch-text transition-colors cursor-pointer"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} className="bg-stitch-surface text-stitch-text">
                {agent.name} ({agent.rate} • {agent.rating} ★ • {agent.stats.avgResponse} avg)
              </option>
            ))}
          </select>
        </div>

        {/* Section 4: Escrow Summary Box */}
        <div className="bg-stitch-surfaceSubtle border border-stitch-border rounded-lg p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between text-stitch-muted">
            <span>Task Budget Deposit</span>
            <span className="text-stitch-text font-semibold">
              {budgetNum.toFixed(2)} MST
            </span>
          </div>
          <div className="flex justify-between text-stitch-muted">
            <span>Network Gas Fee (est.)</span>
            <span className="text-stitch-submuted">~{gasEstimate} MST</span>
          </div>
          <div className="border-t border-stitch-border pt-2 flex justify-between text-sm font-bold">
            <span className="text-stitch-text">TOTAL DEPOSITED IN ESCROW</span>
            <span className="text-stitch-mint">
              {budgetNum.toFixed(2)} MST
            </span>
          </div>

          <div className="p-3 rounded bg-stitch-mintSubtle/50 border border-stitch-mintBorder text-[11px] text-stitch-text leading-relaxed">
            Funds are strictly locked in escrow. If the service agent does not complete the task within deadline or fails verification, 100% of the funds can be refunded.
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold py-3.5 rounded-md text-sm transition-all shadow-[0_0_20px_rgba(0,229,153,0.25)] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSubmitting ? "LOCKING IN ESCROW..." : "LOCK IN ESCROW & CREATE TASK"}
            </span>
          </button>
          <div className="text-[11px] font-mono text-stitch-submuted text-center">
            Smart Contract: TaskEscrow deployed on MST Testnet (Chain ID: {MST_CONFIG.chainId})
          </div>
        </div>
      </form>
    </div>
  );
};
