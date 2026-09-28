import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  Star,
  Shield,
  Cpu,
  TrendingUp,
  Database,
  Network,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useEscrow } from "../context/EscrowContext";

const CATEGORIES = ["All", "Security", "Data & Analytics", "DevOps", "Verification"];

export const AgentMarketplace = ({ setCurrentScreen, setPreselectedAgentId }) => {
  const { agents } = useEscrow();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedAgentId, setInspectedAgentId] = useState(agents[0].id);

  const inspectedAgent =
    agents.find((a) => a.id === inspectedAgentId) || agents[0];

  const filteredAgents = agents.filter((agent) => {
    const matchesCategory =
      selectedCategory === "All" || agent.category === selectedCategory;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.roleTagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const handleHireClick = (agentId) => {
    setPreselectedAgentId(agentId);
    setCurrentScreen("create");
  };

  const getAgentIcon = (category) => {
    switch (category) {
      case "Security":
        return <Shield className="w-4 h-4 text-stitch-mint" />;
      case "Data & Analytics":
        return <TrendingUp className="w-4 h-4 text-stitch-blue" />;
      case "DevOps":
        return <Network className="w-4 h-4 text-stitch-amber" />;
      case "Verification":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-stitch-mint" />;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stitch-text font-sans">
            Agent Marketplace
          </h1>
          <p className="text-sm text-stitch-muted mt-1">
            Discover and hire verified autonomous agents for digital tasks.
          </p>
        </div>
      </div>

      {/* Filter Tabs + Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stitch-border pb-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-stitch-mint text-black font-semibold"
                  : "bg-stitch-surface text-stitch-muted hover:text-stitch-text hover:bg-stitch-surfaceSubtle border border-stitch-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stitch-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stitch-surface border border-stitch-border focus:border-stitch-mint focus:outline-none rounded-md pl-9 pr-4 py-1.5 text-xs font-mono text-stitch-text placeholder:text-stitch-submuted transition-colors"
          />
        </div>
      </div>

      {/* 2-Column Split: Agents List (Left) + Inspected Agent Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Agent List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredAgents.map((agent) => {
            const isSelected = agent.id === inspectedAgent.id;
            return (
              <div
                key={agent.id}
                onClick={() => setInspectedAgentId(agent.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-stitch-surface border-stitch-mint/60 shadow-[0_0_15px_rgba(0,229,153,0.08)]"
                    : "bg-stitch-surface/60 border-stitch-border hover:border-stitch-borderHover hover:bg-stitch-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded bg-stitch-surfaceSubtle border border-stitch-border flex items-center justify-center shrink-0 mt-0.5">
                      {getAgentIcon(agent.category)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-stitch-text group-hover:text-stitch-mint">
                          {agent.name}
                        </span>
                        <CheckCircle className="w-3.5 h-3.5 text-stitch-mint shrink-0" />
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stitch-surfaceSubtle text-stitch-muted border border-stitch-border">
                          {agent.category}
                        </span>
                      </div>
                      <p className="text-xs text-stitch-muted mt-1 line-clamp-1">
                        {agent.roleTagline}
                      </p>
                      <div className="flex items-center space-x-3 mt-2 text-xs font-mono text-stitch-muted">
                        <span className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 mr-1 fill-amber-400 stroke-none" />
                          {agent.rating}
                        </span>
                        <span>•</span>
                        <span>{agent.taskCount} tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate + Action */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-stitch-text">
                      {agent.rate}
                    </div>
                    <div className="text-[10px] font-mono text-stitch-submuted">
                      / task
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHireClick(agent.id);
                      }}
                      className="mt-3 px-3 py-1 bg-stitch-surfaceSubtle hover:bg-stitch-mint hover:text-black text-stitch-mint border border-stitch-mint/40 hover:border-stitch-mint rounded text-xs font-mono font-medium transition-all"
                    >
                      Hire
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2 text-xs font-mono text-stitch-submuted text-center sm:text-left">
            Showing {filteredAgents.length} verified active agents
          </div>
        </div>

        {/* Right Column: Inspected Agent Detail Card (5 cols) */}
        <div className="lg:col-span-5 bg-stitch-surface border border-stitch-border rounded-lg p-6 space-y-6 sticky top-24">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded bg-stitch-surfaceSubtle border border-stitch-mint/40 flex items-center justify-center">
                {getAgentIcon(inspectedAgent.category)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-stitch-text font-sans">
                    {inspectedAgent.name}
                  </h3>
                  <CheckCircle className="w-4 h-4 text-stitch-mint" />
                </div>
                <div className="text-xs font-mono text-stitch-mint flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-stitch-mint animate-pulse" />
                  <span>Available for instant escrow tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-stitch-muted leading-relaxed">
            {inspectedAgent.description}
          </p>

          {/* Metrics 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-stitch-surfaceSubtle border border-stitch-border rounded p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stitch-muted">
                SUCCESS RATE
              </div>
              <div className="text-base font-bold font-mono text-stitch-text mt-1">
                {inspectedAgent.stats.successRate}
              </div>
            </div>
            <div className="bg-stitch-surfaceSubtle border border-stitch-border rounded p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stitch-muted">
                AVG RESPONSE
              </div>
              <div className="text-base font-bold font-mono text-stitch-text mt-1">
                {inspectedAgent.stats.avgResponse}
              </div>
            </div>
            <div className="bg-stitch-surfaceSubtle border border-stitch-border rounded p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stitch-muted">
                TASKS COMPLETED
              </div>
              <div className="text-base font-bold font-mono text-stitch-text mt-1">
                {inspectedAgent.stats.completedTasks}
              </div>
            </div>
            <div className="bg-stitch-surfaceSubtle border border-stitch-border rounded p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stitch-muted">
                BASE ESCROW RATE
              </div>
              <div className="text-base font-bold font-mono text-stitch-mint mt-1">
                {inspectedAgent.stats.baseEscrowRate}
              </div>
            </div>
          </div>

          {/* Capabilities Badges */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-stitch-muted">
              CAPABILITIES
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inspectedAgent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2.5 py-1 rounded bg-stitch-surfaceSubtle border border-stitch-border text-xs font-mono text-stitch-text"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Verification / Performance Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono text-stitch-muted">
              <span>REPUTATION INDEX</span>
              <span className="text-stitch-mint">99.2 / 100</span>
            </div>
            <div className="w-full bg-stitch-surfaceSubtle rounded-full h-1.5 overflow-hidden">
              <div className="bg-stitch-mint h-1.5 rounded-full w-[99.2%]" />
            </div>
          </div>

          {/* Hire Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => handleHireClick(inspectedAgent.id)}
              className="w-full bg-stitch-mint hover:bg-stitch-mintHover text-black font-semibold py-3 rounded-md text-sm transition-all shadow-[0_0_20px_rgba(0,229,153,0.25)] flex items-center justify-center space-x-2"
            >
              <span>HIRE AGENT ({inspectedAgent.rate})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="text-[11px] font-mono text-stitch-submuted text-center flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3 text-stitch-muted" />
              <span>Escrow funds held in smart contract until delivery approved.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
