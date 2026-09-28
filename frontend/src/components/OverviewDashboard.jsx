import React from "react";
import { Plus, ArrowRight, ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEscrow } from "../context/EscrowContext";

export const OverviewDashboard = ({ setCurrentScreen, setSelectedTaskId }) => {
  const {
    tasks,
    walletBalance,
    activeTasksCount,
    escrowedTotal,
    completedCount,
  } = useEscrow();

  const handleRowClick = (taskId) => {
    setSelectedTaskId(taskId);
    setCurrentScreen("details");
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stitch-mintSubtle text-stitch-mint border border-stitch-mintBorder">
            <span className="w-1.5 h-1.5 rounded-full bg-stitch-mint mr-1.5 animate-pulse" />
            In Progress
          </span>
        );
      case "PENDING_ACCEPTANCE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stitch-amberSubtle text-stitch-amber border border-stitch-amberBorder">
            <span className="w-1.5 h-1.5 rounded-full bg-stitch-amber mr-1.5" />
            Pending Acceptance
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stitch-blueSubtle text-stitch-blue border border-stitch-blue/30">
            <CheckCircle2 className="w-3 h-3 mr-1 text-stitch-blue" />
            Deliverable Ready
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stitch-surfaceSubtle text-stitch-muted border border-stitch-border">
            Payment Released
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stitch-surfaceSubtle text-stitch-muted">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stitch-text font-sans">
            Overview
          </h1>
          <p className="text-sm text-stitch-muted mt-1">
            Monitor your agent tasks, wallet balance, and escrowed funds.
          </p>
        </div>
        <div>
          <button
            onClick={() => setCurrentScreen("create")}
            className="inline-flex items-center space-x-2 bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold px-4 py-2 rounded-md text-sm transition-all shadow-[0_0_15px_rgba(0,229,153,0.2)] focus:outline-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CREATE TASK</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Wallet Balance */}
        <div className="bg-stitch-surface border border-stitch-border rounded-lg p-5 flex flex-col justify-between hover:border-stitch-borderHover transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono text-stitch-muted">
            WALLET BALANCE
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-stitch-text">
              {walletBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-stitch-mint ml-1 text-lg font-semibold">MST</span>
            </div>
            <div className="text-xs text-stitch-mint mt-1 flex items-center font-mono">
              <span>+2.4% from last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="bg-stitch-surface border border-stitch-border rounded-lg p-5 flex flex-col justify-between hover:border-stitch-borderHover transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono text-stitch-muted">
            ACTIVE TASKS
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-stitch-text">
              {activeTasksCount}
            </div>
            <div className="text-xs text-stitch-muted mt-1 font-mono">
              in progress
            </div>
          </div>
        </div>

        {/* Card 3: Escrowed Funds */}
        <div className="bg-stitch-surface border border-stitch-border rounded-lg p-5 flex flex-col justify-between hover:border-stitch-borderHover transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono text-stitch-muted">
            ESCROWED FUNDS
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-stitch-text">
              {escrowedTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <span className="text-stitch-mint ml-1 text-lg font-semibold">MST</span>
            </div>
            <div className="text-xs text-stitch-muted mt-1 font-mono">
              Locked in contracts
            </div>
          </div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="bg-stitch-surface border border-stitch-border rounded-lg p-5 flex flex-col justify-between hover:border-stitch-borderHover transition-colors">
          <div className="text-xs uppercase tracking-wider font-mono text-stitch-muted">
            COMPLETED TASKS
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-stitch-text">
              {140 + completedCount}
            </div>
            <div className="text-xs text-stitch-muted mt-1 font-mono">
              All time
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="bg-stitch-surface border border-stitch-border rounded-lg overflow-hidden">
        {/* Table Top Header */}
        <div className="px-6 py-4 border-b border-stitch-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold tracking-wide text-stitch-text uppercase font-mono">
              Recent Tasks
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-stitch-surfaceSubtle text-stitch-muted border border-stitch-border">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setCurrentScreen("marketplace")}
            className="text-xs font-mono text-stitch-muted hover:text-stitch-mint transition-colors flex items-center space-x-1"
          >
            <span>VIEW ALL TASKS</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stitch-border text-[11px] font-mono uppercase tracking-wider text-stitch-muted bg-stitch-surfaceSubtle/50">
                <th className="py-3 px-6 font-medium">TASK</th>
                <th className="py-3 px-6 font-medium">ASSIGNED AGENT</th>
                <th className="py-3 px-6 font-medium">ESCROW</th>
                <th className="py-3 px-6 font-medium">STATUS</th>
                <th className="py-3 px-6 font-medium text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stitch-border text-sm font-sans">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleRowClick(task.id)}
                  className="hover:bg-stitch-surfaceSubtle/70 cursor-pointer transition-colors group"
                >
                  {/* Task Title */}
                  <td className="py-4 px-6 font-medium text-stitch-text group-hover:text-stitch-mint transition-colors max-w-xs sm:max-w-md truncate">
                    {task.title}
                  </td>

                  {/* Assigned Agent */}
                  <td className="py-4 px-6 text-stitch-muted font-mono text-xs flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-stitch-mint/60" />
                    <span className="text-stitch-text">{task.agentName}</span>
                  </td>

                  {/* Escrow Budget */}
                  <td className="py-4 px-6 font-mono text-xs font-semibold text-stitch-text">
                    {task.budget}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6">
                    {renderStatusBadge(task.status)}
                  </td>

                  {/* Timestamp */}
                  <td className="py-4 px-6 text-right font-mono text-xs text-stitch-muted">
                    {task.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
