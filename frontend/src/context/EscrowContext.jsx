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
  }
};

export const EscrowProvider = ({ children }) => {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeRole, setActiveRole] = useState("requester"); // 'requester' or 'worker'
  const [walletBalance, setWalletBalance] = useState(14850.4);
  const [isWeb3Connected, setIsWeb3Connected] = useState(false);
  const [liveAccount, setLiveAccount] = useState("");
  const [contractAddress, setContractAddress] = useState(
    "0x179a544c6ea90d8512002d3702ae59187793994F"
  );
  const [isExecutingSimulation, setIsExecutingSimulation] = useState(false);
  const getContract = async () => {
    if (!window.ethereum) {
      throw new Error("No wallet found. Please install or open your Web3 wallet.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const network = await provider.getNetwork();

    if (Number(network.chainId) !== MST_CONFIG.chainId) {
      throw new Error("Please connect your wallet to MST Testnet.");
    }

    const signer = await provider.getSigner();

    return new ethers.Contract(
      contractAddress,
      MSTTaskEscrowABI,
      signer
    );
  };
  // Addresses
  const requesterAddress = liveAccount || "0x6278d13627F6cdDb85213E969E2145DBCF6e1C2D";
  console.log("Requester address:", requesterAddress);
  console.log("Is valid:", ethers.isAddress(requesterAddress));
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

    // Keywords that describe each agent's expertise
    const agentKeywords = {
      "secauditor-v4": [
        "solidity",
        "smart contract",
        "contract",
        "audit",
        "security",
        "reentrancy",
        "overflow",
        "underflow",
        "evm",
        "bytecode",
        "formal verification",
        "invariant",
        "vulnerability",
        "exploit",
      ],

      "quantarbitrage-x": [
        "arbitrage",
        "dex",
        "amm",
        "mev",
        "slippage",
        "liquidity",
        "routing",
        "trading",
        "cross-chain",
        "order book",
        "pool",
        "price",
      ],

      "deepclean-data": [
        "dataset",
        "data",
        "clean",
        "cleaning",
        "dedup",
        "duplicate",
        "embedding",
        "etl",
        "json",
        "vector",
        "logs",
        "csv",
        "database",
      ],

      "consensussync-agent": [
        "consensus",
        "validator",
        "gossip",
        "p2p",
        "peer",
        "fork",
        "latency",
        "network",
        "block propagation",
        "slashing",
        "node",
        "distributed",
      ],

      "zksolve-zk": [
        "zk",
        "zero knowledge",
        "snark",
        "zk-snark",
        "circom",
        "halo2",
        "circuit",
        "constraint",
        "witness",
        "r1cs",
        "proof",
        "formal proof",
      ],
    };

    const scoredAgents = agents.map((agent) => {
      const keywords = agentKeywords[agent.id] || [];

      let keywordScore = 0;
      const matchedKeywords = [];

      // Match task description against agent expertise
      keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          keywordScore += 10;
          matchedKeywords.push(keyword);
        }
      });

      // Small reputation bonus
      const reputationScore = agent.rating * 2;

      // Success-rate bonus
      const successRate = parseFloat(
        agent.stats.successRate.replace("%", "")
      );

      const successScore = successRate / 10;

      // Overall score
      const totalScore =
        keywordScore +
        reputationScore +
        successScore;

      return {
        agent,
        totalScore,
        matchedKeywords,
        keywordScore,
      };
    });

    // Sort highest score first
    scoredAgents.sort((a, b) => b.totalScore - a.totalScore);

    const winner = scoredAgents[0];

    // Calculate confidence based on how strongly the task matched
    const secondBest = scoredAgents[1];

    let confidence = 75;

    if (winner.keywordScore >= 40) {
      confidence = 98;
    } else if (winner.keywordScore >= 30) {
      confidence = 95;
    } else if (winner.keywordScore >= 20) {
      confidence = 92;
    } else if (winner.keywordScore >= 10) {
      confidence = 86;
    }

    // If there is almost no keyword match, reduce confidence
    if (winner.keywordScore === 0) {
      confidence = 65;
    }

    // Prevent confidence from being unrealistically high
    if (
      secondBest &&
      winner.totalScore - secondBest.totalScore < 5
    ) {
      confidence = Math.min(confidence, 82);
    }

    const reason =
      winner.matchedKeywords.length > 0
        ? `Matched ${winner.matchedKeywords
          .slice(0, 4)
          .join(", ")}. Agent reputation: ${winner.agent.rating}/5 with ${winner.agent.stats.successRate} success rate.`
        : `No strong capability keyword detected. Selected ${winner.agent.name} using reputation and historical success rate.`;

    return {
      agent: winner.agent,
      confidence: `${confidence.toFixed(1)}%`,
      reason,
      matchedKeywords: winner.matchedKeywords,
      scores: scoredAgents.map((item) => ({
        agentId: item.agent.id,
        agentName: item.agent.name,
        score: Number(item.totalScore.toFixed(2)),
      })),
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
    try {
      const assignedAgent =
        agents.find((a) => a.id === agentId) || agents[0];

      console.log("Selected agent:", assignedAgent);
      console.log("Agent address:", assignedAgent.address);





      const budgetNum = parseFloat(budget);

      if (!budgetNum || budgetNum <= 0) {
        throw new Error("Budget must be greater than 0.");
      }

      const contract = await getContract();

      const budgetWei = ethers.parseEther(budgetNum.toString());

      const taskMetadata = JSON.stringify({
        title: title || "Automated Agent Verification Task",
        description:
          description ||
          "Execute digital task according to provided specifications.",
        deliverableFormat,
        agentId: assignedAgent.id,
      });

      console.log("Creating blockchain transaction...");

      console.log("BEFORE CONTRACT CALL");
      console.log("Contract:", contractAddress);
      console.log("Worker:", assignedAgent.address);
      console.log("Task metadata:", taskMetadata);
      console.log("Budget:", budgetWei.toString());
      console.log(
        "Test worker valid:",
        ethers.isAddress("0x6278d13627F6cdDb85213E969E2145DBCF6e1C2D")
      );
      console.log("Worker valid:", ethers.isAddress(assignedAgent.address));
      console.log("Contract valid:", ethers.isAddress(contractAddress));
      const tx = await contract.createTask(
        assignedAgent.address,
        taskMetadata,
        {
          value: budgetWei,
        }
      );

      console.log("AFTER CONTRACT CALL");

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();

      console.log("Transaction confirmed:", receipt.hash);

      const taskCount = await contract.getTaskCount();
      const numericId = Number(taskCount);

      const newId = `task-89${40 + numericId}`;

      const newTask = {
        id: newId,
        numericId: numericId,
        title: title || "Automated Agent Verification Task",
        agentId: assignedAgent.id,
        agentName: assignedAgent.name,
        agentRole: assignedAgent.roleTagline,
        agentRating: assignedAgent.rating,
        budget: `${budgetNum.toFixed(2)} MST`,
        budgetNum: budgetNum,
        status: "PENDING_ACCEPTANCE",
        time: "Just now",
        contractAddress: contractAddress,
        depositTx: tx.hash,
        requesterAddress: requesterAddress,
        workerAddress: assignedAgent.address,
        description:
          description ||
          "Execute digital task according to provided specifications.",
        deliverableFormat: deliverableFormat,
        checksPassed: "0/2 CHECKS PASSED",
        deliverablePayload: "",

        timeline: [
          {
            id: `step-${Date.now()}-2`,
            title: "Escrow deposit confirmed",
            desc: `${budgetNum.toFixed(
              2
            )} MST successfully deposited in MST smart contract escrow. Tx: ${tx.hash
              }`,
            time: "Just now",
            status: "done",
          },
          {
            id: `step-${Date.now()}-1`,
            title: "Task created by requester",
            desc: `Created on MST Testnet with budget ${budgetNum.toFixed(
              2
            )} MST assigned to ${assignedAgent.name}.`,
            time: "Just now",
            status: "done",
          },
        ],
      };

      setTasks((prev) => [newTask, ...prev]);

      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("Requester address:", requesterAddress);
      const balance = await provider.getBalance(requesterAddress);

      setWalletBalance(Number(ethers.formatEther(balance)));

      return newTask;
    } catch (error) {
      console.error("Create task failed:", error);
      throw error;
    }
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
