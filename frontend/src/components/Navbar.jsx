import React from "react";
import { Box, Shield, Wallet, Cpu, ExternalLink } from "lucide-react";
import { useEscrow, MST_CONFIG } from "../context/EscrowContext";

export const Navbar = ({ currentScreen, setCurrentScreen }) => {
  const { walletBalance, isWeb3Connected, connectWallet, activeRole, setActiveRole } = useEscrow();

  return (
    <header className="border-b border-stitch-border bg-stitch-surface/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setCurrentScreen("overview")}
            className="flex items-center space-x-2.5 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-stitch-surfaceSubtle border border-stitch-mint/40 flex items-center justify-center text-stitch-mint shadow-[0_0_12px_rgba(0,229,153,0.15)] group-hover:border-stitch-mint transition-colors">
              <Box className="w-4 h-4 text-stitch-mint" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-mono font-bold tracking-wider text-base text-stitch-text group-hover:text-stitch-mint transition-colors">
                MST
              </span>
              <span className="text-xs uppercase tracking-widest text-stitch-muted font-medium">
                Economy
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentScreen("overview")}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentScreen === "overview"
                  ? "text-stitch-mint bg-stitch-mintSubtle"
                  : "text-stitch-muted hover:text-stitch-text hover:bg-stitch-surfaceSubtle"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentScreen("marketplace")}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentScreen === "marketplace"
                  ? "text-stitch-mint bg-stitch-mintSubtle"
                  : "text-stitch-muted hover:text-stitch-text hover:bg-stitch-surfaceSubtle"
              }`}
            >
              Agent Marketplace
            </button>
            <button
              onClick={() => setCurrentScreen("create")}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentScreen === "create"
                  ? "text-stitch-mint bg-stitch-mintSubtle"
                  : "text-stitch-muted hover:text-stitch-text hover:bg-stitch-surfaceSubtle"
              }`}
            >
              Create Task
            </button>
          </nav>
        </div>

        {/* Right Section: Role Switcher + Wallet + Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick Role Switcher for Hackathon Demo */}
          <div className="hidden lg:flex items-center bg-stitch-surfaceSubtle border border-stitch-border rounded-md p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveRole("requester")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeRole === "requester"
                  ? "bg-stitch-surface text-stitch-mint font-semibold shadow-sm"
                  : "text-stitch-muted hover:text-stitch-text"
              }`}
              title="Act as the Task Requester (Creates and Pays)"
            >
              Requester
            </button>
            <button
              onClick={() => setActiveRole("worker")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeRole === "worker"
                  ? "bg-stitch-surface text-stitch-mint font-semibold shadow-sm"
                  : "text-stitch-muted hover:text-stitch-text"
              }`}
              title="Act as the Autonomous AI Agent (Accepts and Delivers)"
            >
              Agent Mode
            </button>
          </div>

          {/* Wallet Balance Pill */}
          <button
            onClick={connectWallet}
            className="flex items-center space-x-2 bg-stitch-surfaceSubtle hover:bg-stitch-border border border-stitch-border px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-stitch-mint animate-pulse" />
            <span className="text-stitch-text font-semibold">
              {walletBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              MST
            </span>
          </button>

          {/* Agent Avatar Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stitch-mint/30 to-stitch-border border border-stitch-mint/40 flex items-center justify-center text-stitch-mint cursor-pointer hover:border-stitch-mint transition-colors">
            <Cpu className="w-4 h-4 text-stitch-mint" />
          </div>
        </div>
      </div>
    </header>
  );
};
