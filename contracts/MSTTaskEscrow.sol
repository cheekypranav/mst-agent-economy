// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MSTTaskEscrow
 * @dev Non-custodial, trustless escrow smart contract for the MST Agents marketplace.
 *      Enforces the MVP lifecycle:
 *      createTask (locks MST funds) -> acceptTask -> completeTask -> releasePayment
 */
contract MSTTaskEscrow {
    enum TaskStatus {
        Created,
        Accepted,
        Completed,
        Released,
        Refunded
    }

    struct Task {
        uint256 id;
        address requester;
        address worker;
        uint256 budget;
        TaskStatus status;
        string taskMetadata;
        string deliverable;
        uint256 createdAt;
        uint256 completedAt;
    }

    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) private requesterTasks;
    mapping(address => uint256[]) private workerTasks;

    // Events
    event TaskCreated(
        uint256 indexed taskId,
        address indexed requester,
        address indexed worker,
        uint256 budget,
        string taskMetadata
    );

    event TaskAccepted(
        uint256 indexed taskId,
        address indexed worker
    );

    event TaskCompleted(
        uint256 indexed taskId,
        address indexed worker,
        string deliverable
    );

    event PaymentReleased(
        uint256 indexed taskId,
        address indexed worker,
        uint256 amount
    );

    event TaskRefunded(
        uint256 indexed taskId,
        address indexed requester,
        uint256 amount
    );

    // Custom Errors for gas efficiency and clear reverts
    error InvalidBudget();
    error TaskNotFound();
    error InvalidTaskStatus(TaskStatus expected, TaskStatus current);
    error Unauthorized();
    error EmptyDeliverable();
    error TransferFailed();

    modifier taskExists(uint256 _taskId) {
        if (_taskId == 0 || _taskId > taskCount) {
            revert TaskNotFound();
        }
        _;
    }

    /**
     * @notice Creates a new task and deposits MST into escrow.
     * @param _worker Designated worker agent address (or address(0) for open matching).
     * @param _taskMetadata Specification, requirements, and metadata for the task.
     * @return taskId The unique ID of the created task.
     */
    function createTask(
        address _worker,
        string calldata _taskMetadata
    ) external payable returns (uint256) {
        if (msg.value == 0) {
            revert InvalidBudget();
        }

        taskCount++;
        uint256 taskId = taskCount;

        tasks[taskId] = Task({
            id: taskId,
            requester: msg.sender,
            worker: _worker,
            budget: msg.value,
            status: TaskStatus.Created,
            taskMetadata: _taskMetadata,
            deliverable: "",
            createdAt: block.timestamp,
            completedAt: 0
        });

        requesterTasks[msg.sender].push(taskId);
        if (_worker != address(0)) {
            workerTasks[_worker].push(taskId);
        }

        emit TaskCreated(taskId, msg.sender, _worker, msg.value, _taskMetadata);
        return taskId;
    }

    /**
     * @notice Allows an assigned (or matching) worker agent to accept the task.
     * @param _taskId ID of the task to accept.
     */
    function acceptTask(uint256 _taskId) external taskExists(_taskId) {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Created) {
            revert InvalidTaskStatus(TaskStatus.Created, task.status);
        }

        if (task.worker != address(0)) {
            if (msg.sender != task.worker) {
                revert Unauthorized();
            }
        } else {
            task.worker = msg.sender;
            workerTasks[msg.sender].push(_taskId);
        }

        task.status = TaskStatus.Accepted;
        emit TaskAccepted(_taskId, msg.sender);
    }

    /**
     * @notice Allows the assigned worker agent to submit completed deliverables.
     * @param _taskId ID of the task to complete.
     * @param _deliverable Hash, artifact summary, or output proof.
     */
    function completeTask(
        uint256 _taskId,
        string calldata _deliverable
    ) external taskExists(_taskId) {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Accepted) {
            revert InvalidTaskStatus(TaskStatus.Accepted, task.status);
        }

        if (msg.sender != task.worker) {
            revert Unauthorized();
        }

        if (bytes(_deliverable).length == 0) {
            revert EmptyDeliverable();
        }

        task.deliverable = _deliverable;
        task.completedAt = block.timestamp;
        task.status = TaskStatus.Completed;

        emit TaskCompleted(_taskId, msg.sender, _deliverable);
    }

    /**
     * @notice Allows the requester to verify the deliverable and release escrow payment to worker.
     * @param _taskId ID of the task to release payment for.
     */
    function releasePayment(uint256 _taskId) external taskExists(_taskId) {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Completed) {
            revert InvalidTaskStatus(TaskStatus.Completed, task.status);
        }

        if (msg.sender != task.requester) {
            revert Unauthorized();
        }

        uint256 amount = task.budget;
        address worker = task.worker;

        // Follow CEI (Checks-Effects-Interactions)
        task.status = TaskStatus.Released;

        emit PaymentReleased(_taskId, worker, amount);

        (bool success, ) = payable(worker).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Allows the requester to cancel and refund an uncompleted task.
     *         Cannot be refunded if already completed, released, or refunded.
     * @param _taskId ID of the task to refund.
     */
    function refundTask(uint256 _taskId) external taskExists(_taskId) {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Created && task.status != TaskStatus.Accepted) {
            revert InvalidTaskStatus(TaskStatus.Created, task.status);
        }

        if (msg.sender != task.requester) {
            revert Unauthorized();
        }

        uint256 amount = task.budget;
        address requester = task.requester;

        // Follow CEI
        task.status = TaskStatus.Refunded;

        emit TaskRefunded(_taskId, requester, amount);

        (bool success, ) = payable(requester).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Returns complete task details by ID.
     */
    function getTask(uint256 _taskId) external view taskExists(_taskId) returns (Task memory) {
        return tasks[_taskId];
    }

    /**
     * @notice Returns total number of tasks created.
     */
    function getTaskCount() external view returns (uint256) {
        return taskCount;
    }

    /**
     * @notice Returns all task IDs created by a requester.
     */
    function getTasksByRequester(address _requester) external view returns (uint256[] memory) {
        return requesterTasks[_requester];
    }

    /**
     * @notice Returns all task IDs assigned to a worker.
     */
    function getTasksByWorker(address _worker) external view returns (uint256[] memory) {
        return workerTasks[_worker];
    }
}
