import React, { createContext, useContext, useState, useEffect } from "react";
import { INITIAL_AGENTS, INITIAL_TASKS } from "../data/mockData";
import { ethers } from "ethers";
import MSTTaskEscrowABI from "../contracts/MSTTaskEscrowABI.json";

const EscrowContext = createContext(null);

export const MST_CONFIG = {
  name: "MST Testnet",
  chainId: 91562037,
  chainIdHex: "0x5752035",
  rpcUrl: "https://testnetrpc.mstblockchain.com",
  explorerUrl: "https://mstscan.com",
  nativeCurrency: {
    name: "MST",
    symbol: "MST",
    decimals: 18,
  },
};

export const EscrowProvider = ({ children }) => {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeRole, setActiveRole] = useState("requester"); // 'requester' or 'worker'
  const [walletBalance, setWalletBalance] = useState(14850.4);
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
  const [liveAccount, setLiveAccount] = useState("");
  const [contractAddress, setContractAddress] = useState(
    "0x7a281898bFc46eBc215D3f1a0e98B8c8B3a4f9c"
  );
  const [isExecutingSimulation, setIsExecutingSimulation] = useState(false);

  // Addresses
  const requesterAddress = liveAccount || "0x14B289e223D9E9c0A175B8912349071fDe89e22";
  const currentWorker = agents[0]; // Default SecAuditor-v4

  // Calculate stats
  const activeTasksCount = tasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "PENDING_ACCEPTANCE" || t.status === "COMPLETED"
  ).length;

  const escrowedTotal = tasks
    .filter((t) => t.status !== "RELEASED" && t.status !== "REFUNDED")
    .reduce((acc, t) => acc + (t.budgetNum || 0), 0);

  const completedCount = tasks.filter((t) => t.status === "RELEASED").length;

  // Web3 Connect function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          setLiveAccount(accounts[0]);
          setIsWeb3Connected(true);

          // Attempt to switch to MST Testnet
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: MST_CONFIG.chainIdHex }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: MST_CONFIG.chainIdHex,
                    chainName: MST_CONFIG.name,
                    rpcUrls: [MST_CONFIG.rpcUrl],
                    blockExplorerUrls: [MST_CONFIG.explorerUrl],
                    nativeCurrency: MST_CONFIG.nativeCurrency,
                  },
                ],
              });
            }
          }
        }
      } catch (err) {
        console.error("MetaMask connection failed:", err);
      }
    } else {
      // In-browser mock connected
      setIsWeb3Connected(true);
      setLiveAccount("0x14B289e223D9E9c0A175B8912349071fDe89e22");
    }
  };

  // AI Matching logic based on task prompt
  const matchAgentForPrompt = (promptText = "") => {
    const text = promptText.toLowerCase();

    if (
      text.includes("verification") ||
      text.includes("formal") ||
      text.includes("audit") ||
      text.includes("reentrancy") ||
      text.includes("solidity") ||
      text.includes("overflow") ||
      text.includes("security")
    ) {
      return {
        agent: agents.find((a) => a.id === "secauditor-v4") || agents[0],
        confidence: "98.4%",
        reason: "Matched EVM formal verification, reentrancy analysis, and bytecode auditing specs.",
      };
    }

    if (
      text.includes("arbitrage") ||
      text.includes("dex") ||
      text.includes("amm") ||
      text.includes("mev") ||
      text.includes("slippage") ||
      text.includes("liquidity") ||
      text.includes("routing")
    ) {
      return {
        agent: agents.find((a) => a.id === "quantarbitrage-x") || agents[1],
        confidence: "96.8%",
        reason: "Matched high-frequency cross-AMM mathematical modeling and routing analysis.",
      };
    }

    if (
      text.includes("dataset") ||
      text.includes("clean") ||
      text.includes("dedup") ||
      text.includes("embedding") ||
      text.includes("etl") ||
      text.includes("vector")
    ) {
      return {
        agent: agents.find((a) => a.id === "deepclean-data") || agents[2],
        confidence: "95.2%",
        reason: "Matched automated dataset deduplication and structural cleaning pipelines.",
      };
    }

    if (
      text.includes("consensus") ||
      text.includes("gossip") ||
      text.includes("p2p") ||
      text.includes("fork") ||
      text.includes("validator") ||
      text.includes("latency")
    ) {
      return {
        agent: agents.find((a) => a.id === "consensussync-agent") || agents[3],
        confidence: "97.1%",
        reason: "Matched distributed consensus validation and validator network stress testing.",
      };
    }

    if (
      text.includes("zk") ||
      text.includes("snark") ||
      text.includes("circom") ||
      text.includes("halo2") ||
      text.includes("circuit") ||
      text.includes("constraint")
    ) {
      return {
        agent: agents.find((a) => a.id === "zksolve-zk") || agents[4],
        confidence: "99.0%",
        reason: "Matched Circom / Halo2 zero-knowledge constraint verification specifications.",
      };
    }

    // Default fallback
    return {
      agent: agents[0],
      confidence: "91.0%",
      reason: "General digital task matching. Verified agent SecAuditor-v4 has highest reputation.",
    };
  };

  // Flow: 1. Create Task & Lock Escrow
  const createTask = async ({
    title,
    description,
    agentId,
    budget,
    deliverableFormat = "spec/output_artifacts.tar.gz",
  }) => {
    const assignedAgent = agents.find((a) => a.id === agentId) || agents[0];
    const budgetNum = parseFloat(budget) || 450.0;
    const newNumericId = tasks.length + 1;
    const newId = `task-89${40 + newNumericId}`;

    const randomHash = "0x" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("") + "...d8e1";

    const newTask = {
      id: newId,
      numericId: newNumericId,
      title: title || "Automated Agent Verification Task",
      agentId: assignedAgent.id,
      agentName: assignedAgent.name,
      agentRole: assignedAgent.roleTagline,
      agentRating: assignedAgent.rating,
      budget: `${budgetNum.toFixed(2)} MST`,
      budgetNum: budgetNum,
      status: "PENDING_ACCEPTANCE", // Created state
      time: "Just now",
      contractAddress: contractAddress,
      depositTx: randomHash,
      requesterAddress: requesterAddress,
      workerAddress: assignedAgent.address,
      description: description || "Execute digital task according to provided specifications.",
      deliverableFormat: deliverableFormat,
      checksPassed: "0/2 CHECKS PASSED",
      deliverablePayload: "",
      timeline: [
        {
          id: `step-${Date.now()}-2`,
          title: "Escrow deposit confirmed",
          desc: `${budgetNum.toFixed(2)} MST successfully deposited in MST smart contract escrow. Tx: ${randomHash}`,
          time: "Just now",
          status: "done",
        },
        {
          id: `step-${Date.now()}-1`,
          title: "Task created by requester",
          desc: `Created from UI with budget ${budgetNum.toFixed(2)} MST assigned to ${assignedAgent.name}.`,
          time: "Just now",
          status: "done",
        },
      ],
    };

    setTasks((prev) => [newTask, ...prev]);
    setWalletBalance((prev) => Math.max(0, prev - budgetNum));

    return newTask;
  };

  // Flow: 2. Accept Task
  const acceptTask = async (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedTimeline = [
            {
              id: `step-${Date.now()}`,
              title: `Task accepted by ${t.agentName}`,
              desc: `Agent acknowledged task spec. Execution slot reserved. Work started.`,
              time: "Just now",
              status: "done",
            },
            ...t.timeline,
          ];
          return {
            ...t,
            status: "IN_PROGRESS",
            timeline: updatedTimeline,
          };
        }
        return t;
      })
    );
  };

  // Flow: 3. Complete Task & Submit Deliverable (Simulated agent execution)
  const completeTask = async (taskId, deliverableText = null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const payload =
            deliverableText ||
            `Verification Status: PASSED (0 Critical, 0 High, 1 Low Info)\nProof Hash: 0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}\nArtifacts: Invariant assertions validated against EVM bytecode specs.\nSummary: All execution parameters satisfied.`;

          const updatedTimeline = [
            {
              id: `step-${Date.now()}`,
              title: "Deliverable submitted by agent",
              desc: `Execution complete. Output artifacts submitted to escrow. Awaiting requester verification.`,
              time: "Just now",
              status: "done",
            },
            ...t.timeline,
          ];

          return {
            ...t,
            status: "COMPLETED",
            checksPassed: "2/2 CHECKS VERIFIED",
            deliverablePayload: payload,
            timeline: updatedTimeline,
          };
        }
        return t;
      })
    );
  };

  // Flow: 4. Verify Deliverable & Release Payment
  const releasePayment = async (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedTimeline = [
            {
              id: `step-${Date.now()}`,
              title: "Payment Released",
              desc: `${t.budget} transferred from contract escrow to ${t.agentName}.`,
              time: "Just now",
              status: "done",
            },
            ...t.timeline,
          ];

          return {
            ...t,
            status: "RELEASED",
            timeline: updatedTimeline,
          };
        }
        return t;
      })
    );
  };

  // Flow: Refund Task
  const refundTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedTimeline = [
            {
              id: `step-${Date.now()}`,
              title: "Escrow Refunded",
              desc: `${t.budget} refunded back to requester wallet from contract escrow.`,
              time: "Just now",
              status: "done",
            },
            ...t.timeline,
          ];

          return {
            ...t,
            status: "REFUNDED",
            timeline: updatedTimeline,
          };
        }
        return t;
      })
    );

    setWalletBalance((prev) => prev + (task.budgetNum || 0));
  };

  // Full Simulated Autonomous Agent Pipeline
  const runAgentSimulation = async (taskId) => {
    setIsExecutingSimulation(true);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) {
      setIsExecutingSimulation(false);
      return;
    }

    // Step A: Accept Task (if not yet accepted)
    if (targetTask.status === "PENDING_ACCEPTANCE") {
      await acceptTask(taskId);
      await new Promise((r) => setTimeout(r, 1200));
    }

    // Step B: Progress timeline updates
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            timeline: [
              {
                id: `step-${Date.now()}-sim1`,
                title: "Symbolic proof generation started",
                desc: "Running Z3/smt-solver over exported bytecode AST. Analyzing potential integer under/overflows.",
                time: "Just now",
                status: "active",
              },
              ...t.timeline,
            ],
          };
        }
        return t;
      })
    );

    await new Promise((r) => setTimeout(r, 1500));

    // Step C: Complete Task
    await completeTask(
      taskId,
      `Verification Status: PASSED (0 Critical, 0 High, 2 Low)\nProof Hash: 0x98f4a123b49e8a7c2957b8c0df1e87900b1a2\nArtifacts: Invariant assertions validated on EVM bytecode.\nExecution Duration: 1.4s\nConclusion: Smart contract conforms to formal specifications.`
    );

    setIsExecutingSimulation(false);
  };

  return (
    <EscrowContext.Provider
      value={{
        agents,
        tasks,
        activeRole,
        setActiveRole,
        walletBalance,
        isWeb3Connected,
        liveAccount,
        contractAddress,
        activeTasksCount,
        escrowedTotal,
        completedCount,
        connectWallet,
        createTask,
        acceptTask,
        completeTask,
        releasePayment,
        refundTask,
        matchAgentForPrompt,
        runAgentSimulation,
        isExecutingSimulation,
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
};

export const useEscrow = () => {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error("useEscrow must be used within an EscrowProvider");
  }
  return context;
};
