import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { OverviewDashboard } from "./components/OverviewDashboard";
import { AgentMarketplace } from "./components/AgentMarketplace";
import { CreateTask } from "./components/CreateTask";
import { TaskDetails } from "./components/TaskDetails";
import { EscrowProvider } from "./context/EscrowContext";

export function AppContent() {
  const [currentScreen, setCurrentScreen] = useState("overview"); // 'overview', 'marketplace', 'create', 'details'
  const [selectedTaskId, setSelectedTaskId] = useState("task-8942");
  const [preselectedAgentId, setPreselectedAgentId] = useState("secauditor-v4");

  return (
    <div className="min-h-screen bg-stitch-bg text-stitch-text flex flex-col font-sans selection:bg-stitch-mint/20 selection:text-stitch-mint">
      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentScreen === "overview" && (
          <OverviewDashboard
            setCurrentScreen={setCurrentScreen}
            setSelectedTaskId={setSelectedTaskId}
          />
        )}

        {currentScreen === "marketplace" && (
          <AgentMarketplace
            setCurrentScreen={setCurrentScreen}
            setPreselectedAgentId={setPreselectedAgentId}
          />
        )}

        {currentScreen === "create" && (
          <CreateTask
            setCurrentScreen={setCurrentScreen}
            setSelectedTaskId={setSelectedTaskId}
            preselectedAgentId={preselectedAgentId}
          />
        )}

        {currentScreen === "details" && (
          <TaskDetails
            taskId={selectedTaskId}
            setCurrentScreen={setCurrentScreen}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <EscrowProvider>
      <AppContent />
    </EscrowProvider>
  );
}
