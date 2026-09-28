import React from "react";
import { ExternalLink } from "lucide-react";
import { MST_CONFIG } from "../context/EscrowContext";

export const Footer = () => {
  return (
    <footer className="border-t border-stitch-border/80 bg-stitch-surface/60 py-6 mt-16 text-xs text-stitch-muted font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>MST Autonomous Economy</span>
          <span className="mx-2 text-stitch-submuted">|</span>
          <span className="text-stitch-text">Developer Console (Chain ID: {MST_CONFIG.chainId})</span>
        </div>
        <div className="flex items-center space-x-6">
          <a
            href={MST_CONFIG.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-stitch-mint transition-colors flex items-center space-x-1"
          >
            <span>MST Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="hover:text-stitch-mint cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-stitch-mint cursor-pointer transition-colors">API Status</span>
          <span className="text-stitch-mint font-semibold">Testnet Online</span>
        </div>
      </div>
    </footer>
  );
};
