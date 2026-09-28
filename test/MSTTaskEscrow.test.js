const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MSTTaskEscrow Smart Contract", function () {
  let escrow;
  let requester;
  let worker;
  let unauthorizedUser;
  const taskBudget = ethers.parseEther("1.5"); // 1.5 MST
  const taskMetadata = "Audit LiquidityPool.sol for reentrancy and arithmetic overflows";
  const deliverable = "ipfs://QmVerificationProofAuditReportHash12345";

  beforeEach(async function () {
    [requester, worker, unauthorizedUser] = await ethers.getSigners();
    const MSTTaskEscrow = await ethers.getContractFactory("MSTTaskEscrow");
    escrow = await MSTTaskEscrow.deploy();
    await escrow.waitForDeployment();
  });

  describe("1. Task Creation & Escrow Funding", function () {
    it("should allow requester to create a task and lock MST in escrow", async function () {
      const tx = await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });

      await expect(tx)
        .to.emit(escrow, "TaskCreated")
        .withArgs(1, requester.address, worker.address, taskBudget, taskMetadata);

      expect(await escrow.taskCount()).to.equal(1);

      const task = await escrow.getTask(1);
      expect(task.id).to.equal(1);
      expect(task.requester).to.equal(requester.address);
      expect(task.worker).to.equal(worker.address);
      expect(task.budget).to.equal(taskBudget);
      expect(task.status).to.equal(0); // TaskStatus.Created
      expect(task.taskMetadata).to.equal(taskMetadata);

      // Verify escrow contract holds the locked funds
      const contractBalance = await ethers.provider.getBalance(await escrow.getAddress());
      expect(contractBalance).to.equal(taskBudget);
    });

    it("should revert if budget is 0", async function () {
      await expect(
        escrow.connect(requester).createTask(worker.address, taskMetadata, { value: 0 })
      ).to.be.revertedWithCustomError(escrow, "InvalidBudget");
    });
  });

  describe("2. Task Acceptance", function () {
    beforeEach(async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });
    });

    it("should allow designated worker to accept the task", async function () {
      const tx = await escrow.connect(worker).acceptTask(1);

      await expect(tx)
        .to.emit(escrow, "TaskAccepted")
        .withArgs(1, worker.address);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(1); // TaskStatus.Accepted
    });

    it("should revert if an unauthorized user attempts to accept a designated task", async function () {
      await expect(
        escrow.connect(unauthorizedUser).acceptTask(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert if accepting a task that is not in Created status", async function () {
      await escrow.connect(worker).acceptTask(1);
      await expect(
        escrow.connect(worker).acceptTask(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");
    });

    it("should allow any worker to accept an unassigned task (worker = address(0))", async function () {
      await escrow.connect(requester).createTask(ethers.ZeroAddress, "Open task", {
        value: taskBudget,
      });

      await escrow.connect(worker).acceptTask(2);
      const task = await escrow.getTask(2);
      expect(task.worker).to.equal(worker.address);
      expect(task.status).to.equal(1);
    });
  });

  describe("3. Task Completion", function () {
    beforeEach(async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });
      await escrow.connect(worker).acceptTask(1);
    });

    it("should allow assigned worker to complete task and submit deliverable", async function () {
      const tx = await escrow.connect(worker).completeTask(1, deliverable);

      await expect(tx)
        .to.emit(escrow, "TaskCompleted")
        .withArgs(1, worker.address, deliverable);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(2); // TaskStatus.Completed
      expect(task.deliverable).to.equal(deliverable);
      expect(task.completedAt).to.be.gt(0);
    });

    it("should revert if unauthorized user attempts to complete task", async function () {
      await expect(
        escrow.connect(unauthorizedUser).completeTask(1, deliverable)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert if completing with an empty deliverable", async function () {
      await expect(
        escrow.connect(worker).completeTask(1, "")
      ).to.be.revertedWithCustomError(escrow, "EmptyDeliverable");
    });

    it("should revert if task has not been accepted yet", async function () {
      await escrow.connect(requester).createTask(worker.address, "Unaccepted task", {
        value: taskBudget,
      });

      await expect(
        escrow.connect(worker).completeTask(2, deliverable)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");
    });
  });

  describe("4. Payment Release & Double-Payment Prevention", function () {
    beforeEach(async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });
      await escrow.connect(worker).acceptTask(1);
      await escrow.connect(worker).completeTask(1, deliverable);
    });

    it("should allow requester to release payment and transfer MST to worker", async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);

      const tx = await escrow.connect(requester).releasePayment(1);

      await expect(tx)
        .to.emit(escrow, "PaymentReleased")
        .withArgs(1, worker.address, taskBudget);

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(taskBudget);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(3); // TaskStatus.Released

      const contractBalance = await ethers.provider.getBalance(await escrow.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it("should revert if unauthorized user tries to release payment", async function () {
      await expect(
        escrow.connect(unauthorizedUser).releasePayment(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should prevent duplicate payment release", async function () {
      await escrow.connect(requester).releasePayment(1);

      // Attempting to release payment a second time must revert
      await expect(
        escrow.connect(requester).releasePayment(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");
    });

    it("should prevent releasing payment on an incomplete task", async function () {
      await escrow.connect(requester).createTask(worker.address, "Incomplete task", {
        value: taskBudget,
      });
      await escrow.connect(worker).acceptTask(2);

      await expect(
        escrow.connect(requester).releasePayment(2)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");
    });
  });

  describe("5. Task Refunds", function () {
    it("should allow requester to refund an unaccepted task", async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });

      const requesterBalanceBefore = await ethers.provider.getBalance(requester.address);
      const tx = await escrow.connect(requester).refundTask(1);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const requesterBalanceAfter = await ethers.provider.getBalance(requester.address);
      expect(requesterBalanceAfter + gasSpent - requesterBalanceBefore).to.equal(taskBudget);

      const task = await escrow.getTask(1);
      expect(task.status).to.equal(4); // TaskStatus.Refunded
    });

    it("should revert if unauthorized user tries to refund", async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });

      await expect(
        escrow.connect(unauthorizedUser).refundTask(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should prevent refund once task has been completed or released", async function () {
      await escrow.connect(requester).createTask(worker.address, taskMetadata, {
        value: taskBudget,
      });
      await escrow.connect(worker).acceptTask(1);
      await escrow.connect(worker).completeTask(1, deliverable);

      // Cannot refund completed task
      await expect(
        escrow.connect(requester).refundTask(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");

      await escrow.connect(requester).releasePayment(1);

      // Cannot refund released task
      await expect(
        escrow.connect(requester).refundTask(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidTaskStatus");
    });
  });
});
