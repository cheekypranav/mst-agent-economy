import React, { useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
} from "lucide-react";
import { useEscrow, MST_CONFIG } from "../context/EscrowContext";

export const TaskDetails = ({
  taskId,
  setCurrentScreen,
}) => {
  const {
    tasks,
    acceptTask,
    completeTask,
    releasePayment,
    refundTask,
    runAgentSimulation,
    isExecutingSimulation,
    activeRole,
  } = useEscrow();

  const task = tasks.find((t) => t.id === taskId) || tasks[0];

  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const handleAccept = async () => {
    setIsProcessingTx(true);
    setActionMessage("Signing acceptTask transaction on MST...");
    try {
      await acceptTask(task.id);
      setActionMessage("Task accepted! Agent assigned.");
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleSimulateExecution = async () => {
    setActionMessage("Autonomous agent running verification pipeline...");
    await runAgentSimulation(task.id);
    setActionMessage("Deliverable successfully submitted to escrow!");
  };

  const handleReleasePayment = async () => {
    setIsProcessingTx(true);
    setActionMessage("Executing releasePayment transaction on MST Escrow...");
    try {
      await releasePayment(task.id);
      setActionMessage("Payment released! MST transferred to agent.");
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm("Are you sure you want to refund this escrow?")) return;
    setIsProcessingTx(true);
    setActionMessage("Executing refundTask transaction on MST Escrow...");
    try {
      await refundTask(task.id);
      setActionMessage("Escrow refunded to requester wallet.");
    } finally {
      setIsProcessingTx(false);
    }
  };

  const renderStatusBadge = () => {
    switch (task.status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-stitch-mintSubtle text-stitch-mint border border-stitch-mintBorder">
            <span className="w-1.5 h-1.5 rounded-full bg-stitch-mint mr-2 animate-pulse" />
            IN PROGRESS (ESCROW FUNDED)
          </span>
        );
      case "PENDING_ACCEPTANCE":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-stitch-amberSubtle text-stitch-amber border border-stitch-amberBorder">
            <span className="w-1.5 h-1.5 rounded-full bg-stitch-amber mr-2" />
            PENDING ACCEPTANCE (ESCROW FUNDED)
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-stitch-blueSubtle text-stitch-blue border border-stitch-blue/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-stitch-blue" />
            DELIVERABLE READY FOR VERIFICATION
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-stitch-surfaceSubtle text-stitch-muted border border-stitch-border">
            PAYMENT RELEASED (COMPLETED)
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            ESCROW REFUNDED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-mono text-stitch-muted">
        <button
          onClick={() => setCurrentScreen("overview")}
          className="hover:text-stitch-mint transition-colors"
        >
          Overview
        </button>
        <span>/</span>
        <button
          onClick={() => setCurrentScreen("overview")}
          className="hover:text-stitch-mint transition-colors"
        >
          Tasks
        </button>
        <span>/</span>
        <span className="text-stitch-text font-semibold">
          Task #{task.numericId ? `894${task.numericId}` : task.id}
        </span>
      </div>

      {/* Header Block with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stitch-border pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {renderStatusBadge()}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stitch-text font-sans">
            {task.title}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {task.status === "COMPLETED" && (
            <button
              onClick={handleReleasePayment}
              disabled={isProcessingTx}
              className="bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold px-4 py-2 rounded-md text-xs font-mono transition-all shadow-[0_0_15px_rgba(0,229,153,0.25)] flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>VERIFY & RELEASE PAYMENT</span>
            </button>
          )}

          <a
            href={`${MST_CONFIG.explorerUrl}/address/${task.contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-stitch-surface hover:bg-stitch-surfaceSubtle border border-stitch-border rounded-md text-xs font-mono text-stitch-muted hover:text-stitch-text transition-colors flex items-center space-x-1.5"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-stitch-mintSubtle border border-stitch-mintBorder rounded text-xs font-mono text-stitch-mint animate-pulse">
          {actionMessage}
        </div>
      )}

      {/* Main Grid: 2 Columns (65% Left, 35% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Spec, Deliverables, Activity Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Task Spec Container */}
          <div className="bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-4">
            <p className="text-sm text-stitch-text leading-relaxed font-sans">
              {task.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stitch-border">
              <span className="text-xs font-mono text-stitch-mint bg-stitch-surfaceSubtle border border-stitch-border px-3 py-1 rounded">
                Deliverable Format: {task.deliverableFormat || "spec/proofs.tar.gz"}
              </span>
              <span className="text-xs font-mono font-semibold text-stitch-muted">
                {task.checksPassed || "1/2 CHECKS PASSED"}
              </span>
            </div>
          </div>

          {/* Deliverable Section (If Completed or Deliverable submitted) */}
          {task.deliverablePayload && (
            <div className="bg-stitch-surface border border-stitch-mint/40 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-stitch-mint font-semibold">
                  <FileCheck className="w-4 h-4" />
                  <span>Agent Deliverable Submitted</span>
                </div>
                <span className="text-[11px] font-mono text-stitch-submuted">
                  Cryptographic Hash Verified
                </span>
              </div>
              <pre className="p-4 rounded bg-stitch-surfaceSubtle border border-stitch-border text-xs font-mono text-stitch-text whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {task.deliverablePayload}
              </pre>

              {task.status === "COMPLETED" && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-stitch-muted">
                    Escrow release requires requester verification.
                  </span>
                  <button
                    onClick={handleReleasePayment}
                    disabled={isProcessingTx}
                    className="bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold px-4 py-2 rounded text-xs font-mono transition-all flex items-center space-x-1"
                  >
                    <span>Release {task.budget}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Activity & Execution Timeline */}
          <div className="bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-6">
            <div className="text-xs font-mono uppercase tracking-wider text-stitch-muted font-medium">
              ACTIVITY & EXECUTION TIMELINE
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-stitch-border">
              {task.timeline &&
                task.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative flex items-start space-x-4">
                    {/* Timeline Node Circle */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        event.status === "active"
                          ? "bg-stitch-mint text-black border-2 border-stitch-surface"
                          : "bg-stitch-surface border-2 border-stitch-mint/60 text-stitch-mint"
                      }`}
                    >
                      {event.status === "active" ? (
                        <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      ) : (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>

                    {/* Timeline Event Content */}
                    <div className="flex-1 bg-stitch-surfaceSubtle/60 border border-stitch-border/60 rounded-md p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold font-sans text-stitch-text">
                          {event.title}
                        </span>
                        <span className="text-[11px] font-mono text-stitch-muted">
                          {event.time}
                        </span>
                      </div>
                      <p className="text-xs text-stitch-muted leading-relaxed font-mono">
                        {event.desc}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Escrow Details, Assigned Agent, Contract Pipeline Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Escrow Details */}
          <div className="bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-5">
            <div className="text-xs font-mono uppercase tracking-wider text-stitch-muted">
              ESCROW DETAILS
            </div>

            <div>
              <div className="text-3xl font-bold font-mono text-stitch-mint">
                {task.budget}
              </div>
              <div className="text-xs font-mono text-stitch-muted mt-1">
                Locked in smart contract escrow
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-stitch-border text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stitch-muted">ESCROW STATUS:</span>
                <span className="text-stitch-text font-semibold">
                  {task.status === "RELEASED"
                    ? "Settled & Released"
                    : task.status === "REFUNDED"
                    ? "Refunded"
                    : "Locked in Escrow"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stitch-muted">CONTRACT ADDRESS:</span>
                <span className="text-stitch-mint font-semibold truncate max-w-[130px]">
                  {task.contractAddress}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stitch-muted">DEPOSIT TX:</span>
                <span className="text-stitch-text truncate max-w-[130px]">
                  {task.depositTx}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stitch-muted">REQUESTER:</span>
                <span className="text-stitch-text truncate max-w-[130px]">
                  {task.requesterAddress} (You)
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stitch-muted">WORKER:</span>
                <span className="text-stitch-text truncate max-w-[130px]">
                  {task.workerAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Assigned Agent */}
          <div className="bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-stitch-muted">
              ASSIGNED AGENT
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-stitch-surfaceSubtle border border-stitch-mint/40 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-stitch-mint" />
              </div>
              <div>
                <div className="text-sm font-bold text-stitch-text">
                  {task.agentName}
                </div>
                <div className="text-xs font-mono text-stitch-mint">
                  {task.agentRating} ★ Verified Agent
                </div>
              </div>
            </div>

            <p className="text-xs text-stitch-muted leading-relaxed">
              {task.agentRole}
            </p>
          </div>

          {/* Card 3: Blockchain Flow Interactive Controls (Demo Pipeline) */}
          <div className="bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-stitch-text font-semibold flex items-center justify-between">
              <span>CONTRACT ACTIONS (MVP FLOW)</span>
              <span className="text-[10px] text-stitch-mint">MST Chain</span>
            </div>

            <div className="text-[11px] font-mono text-stitch-submuted">
              Standard EVM lifecycle: createTask → acceptTask → completeTask → releasePayment
            </div>

            {/* Step 1: Created */}
            <div className="p-2.5 rounded bg-stitch-surfaceSubtle border border-stitch-border flex items-center justify-between text-xs font-mono">
              <span className="text-stitch-muted">1. createTask & Fund</span>
              <span className="text-stitch-mint font-semibold">Done (Locked)</span>
            </div>

            {/* Step 2: Accept Task */}
            {task.status === "PENDING_ACCEPTANCE" ? (
              <button
                onClick={handleAccept}
                disabled={isProcessingTx}
                className="w-full bg-stitch-amber/20 hover:bg-stitch-amber/30 text-amber-300 border border-amber-500/40 py-2 rounded text-xs font-mono font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>2. acceptTask (Assign Agent)</span>
              </button>
            ) : (
              <div className="p-2.5 rounded bg-stitch-surfaceSubtle border border-stitch-border flex items-center justify-between text-xs font-mono">
                <span className="text-stitch-muted">2. acceptTask</span>
                <span className="text-stitch-mint font-semibold">Accepted</span>
              </div>
            )}

            {/* Step 3: Complete Task / Run Simulated Agent */}
            {task.status === "IN_PROGRESS" || task.status === "PENDING_ACCEPTANCE" ? (
              <button
                onClick={handleSimulateExecution}
                disabled={isExecutingSimulation}
                className="w-full bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold py-2.5 rounded text-xs font-mono transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isExecutingSimulation
                    ? "Simulating Agent..."
                    : "3. Run Agent & completeTask"}
                </span>
              </button>
            ) : task.status === "COMPLETED" || task.status === "RELEASED" ? (
              <div className="p-2.5 rounded bg-stitch-surfaceSubtle border border-stitch-border flex items-center justify-between text-xs font-mono">
                <span className="text-stitch-muted">3. completeTask</span>
                <span className="text-stitch-mint font-semibold">Deliverable Ready</span>
              </div>
            ) : null}

            {/* Step 4: Release Payment */}
            {task.status === "COMPLETED" ? (
              <button
                onClick={handleReleasePayment}
                disabled={isProcessingTx}
                className="w-full bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold py-2.5 rounded text-xs font-mono transition-all flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>4. releasePayment ({task.budget})</span>
              </button>
            ) : task.status === "RELEASED" ? (
              <div className="p-2.5 rounded bg-stitch-surfaceSubtle border border-stitch-border flex items-center justify-between text-xs font-mono">
                <span className="text-stitch-muted">4. releasePayment</span>
                <span className="text-stitch-mint font-semibold">Released & Settled</span>
              </div>
            ) : null}

            {/* Refund Safeguard */}
            {(task.status === "PENDING_ACCEPTANCE" || task.status === "IN_PROGRESS") && (
              <div className="pt-2">
                <button
                  onClick={handleRefund}
                  disabled={isProcessingTx}
                  className="w-full text-center text-xs font-mono text-stitch-submuted hover:text-rose-400 transition-colors flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refund Escrow (Cancel Task)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
