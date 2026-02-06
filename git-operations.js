import { CONFIG, COMMIT_MESSAGES } from './config.js';
import {
    generateHash,
    randomFrom,
    getCommitById,
    getBranchColor,
    validateBranchName,
    getBranchCommits,
    getMaxCol,
    createPosition,
    collectAncestors,
    isAncestor
} from './utils.js';

function createInitialCommit() {
    return {
        id: generateHash(),
        message: 'Initial commit',
        branch: 'main',
        parents: [],
        ...createPosition(0, 0),
        timestamp: new Date().toISOString()
    };
}

function cloneCommit(commit, overrides = {}) {
    return {
        ...commit,
        ...overrides
    };
}

function createRemoteStateFromLocal(localState) {
    return {
        commits: localState.commits.map((commit) => ({
            id: commit.id,
            message: commit.message,
            branch: commit.branch,
            parents: [...commit.parents],
            timestamp: commit.timestamp
        })),
        branches: Object.fromEntries(
            Object.values(localState.branches).map((branch) => [
                branch.name,
                {
                    name: branch.name,
                    head: branch.head,
                    color: branch.color,
                    row: branch.row
                }
            ])
        )
    };
}

function createInitialState() {
    const initialCommit = createInitialCommit();
    const baseState = {
        commits: [initialCommit],
        branches: {
            main: {
                name: 'main',
                head: initialCommit.id,
                color: CONFIG.branchColors[0],
                row: 0
            }
        },
        currentBranch: 'main',
        commitCounter: 1,
        branchCounter: 1,
        stash: [],
        remote: null,
        remoteTracking: {},
        tutorial: {
            activeId: null,
            stepIndex: 0
        }
    };
    baseState.remote = createRemoteStateFromLocal(baseState);
    baseState.remoteTracking = {
        'origin/main': initialCommit.id
    };
    return baseState;
}

function getNextCol(commits) {
    return getMaxCol(commits) + 1;
}

function createCommitOnBranch(state, branchName, { message, isMerge = false, mergeSource, parents }) {
    const branch = state.branches[branchName];
    const col = getNextCol(state.commits);
    const position = createPosition(col, branch.row);

    const commit = {
        id: generateHash(),
        message,
        branch: branchName,
        parents,
        ...position,
        timestamp: new Date().toISOString(),
        isMerge,
        mergeSource,
        isNew: true
    };

    state.commits.push(commit);
    state.branches[branchName].head = commit.id;
    state.commitCounter += 1;
    return commit;
}

function listBranchCommitsLinear(commits, headId) {
    const linear = [];
    let current = getCommitById(commits, headId);
    while (current) {
        linear.push(current);
        if (!current.parents.length) {
            break;
        }
        current = getCommitById(commits, current.parents[0]);
    }
    return linear;
}

function importRemoteCommits(draft, remoteHeadId, branchName) {
    const localCommitIds = new Set(draft.commits.map((commit) => commit.id));
    if (localCommitIds.has(remoteHeadId)) {
        return;
    }

    const remoteMap = new Map(draft.remote.commits.map((commit) => [commit.id, commit]));
    const pending = new Map();
    const stack = [remoteHeadId];
    while (stack.length) {
        const currentId = stack.pop();
        if (!currentId || localCommitIds.has(currentId) || pending.has(currentId)) {
            continue;
        }
        const commit = remoteMap.get(currentId);
        if (!commit) {
            continue;
        }
        pending.set(currentId, commit);
        commit.parents.forEach((parentId) => {
            if (parentId && !localCommitIds.has(parentId)) {
                stack.push(parentId);
            }
        });
    }

    const ordered = [];
    const orderedIds = new Set();
    let safety = 0;
    while (pending.size && safety < 1000) {
        safety += 1;
        for (const [id, commit] of pending) {
            const parentsReady = commit.parents.every((parentId) => localCommitIds.has(parentId) || orderedIds.has(parentId));
            if (parentsReady) {
                ordered.push(commit);
                orderedIds.add(id);
                pending.delete(id);
            }
        }
    }

    ordered.forEach((remoteCommit) => {
        const col = getNextCol(draft.commits);
        const position = createPosition(col, draft.branches[branchName].row);
        draft.commits.push({
            id: remoteCommit.id,
            message: remoteCommit.message,
            branch: branchName,
            parents: [...remoteCommit.parents],
            ...position,
            timestamp: remoteCommit.timestamp,
            isRemote: true
        });
        localCommitIds.add(remoteCommit.id);
    });
}

export class GitOperations {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    initializeRepo() {
        this.stateManager.replaceState(createInitialState());
        return {
            explanation: 'welcome',
            command: 'git init'
        };
    }

    resetAll() {
        this.stateManager.replaceState(createInitialState());
        return {
            explanation: 'welcome',
            command: 'git init',
            fullRender: true
        };
    }

    createCommit({ message } = {}) {
        return this.stateManager.mutate((draft) => {
            const currentBranchData = draft.branches[draft.currentBranch];
            const parentCommit = getCommitById(draft.commits, currentBranchData.head);
            const commitMessage = message || randomFrom(COMMIT_MESSAGES);

            createCommitOnBranch(draft, draft.currentBranch, {
                message: commitMessage,
                parents: [parentCommit.id]
            });

            return {
                explanation: 'commit',
                command: `git commit -m "${commitMessage}"`
            };
        });
    }

    createBranch(branchName) {
        return this.stateManager.mutate((draft) => {
            const validation = validateBranchName(branchName, draft.branches);
            if (!validation.valid) {
                return { abort: true, error: validation.error };
            }

            const currentBranchData = draft.branches[draft.currentBranch];
            const currentHead = currentBranchData.head;
            const newRow = Object.keys(draft.branches).length;
            const color = CONFIG.branchColors[newRow % CONFIG.branchColors.length];

            draft.branches[branchName] = {
                name: branchName,
                head: currentHead,
                color,
                row: newRow,
                createdFrom: draft.currentBranch,
                createdAt: currentHead
            };
            draft.branchCounter += 1;
            draft.currentBranch = branchName;

            return {
                explanation: 'branch',
                command: `git checkout -b ${branchName}`
            };
        });
    }

    checkout(branchName) {
        return this.stateManager.mutate((draft) => {
            if (!draft.branches[branchName]) {
                return { abort: true, error: 'Branch does not exist.' };
            }

            draft.currentBranch = branchName;
            return {
                explanation: 'checkout',
                command: `git checkout ${branchName}`,
                data: { branch: branchName }
            };
        });
    }

    merge(sourceBranch, { simulateConflict = false } = {}) {
        if (simulateConflict) {
            return {
                showConflict: true,
                sourceBranch,
                targetBranch: this.stateManager.getState().currentBranch
            };
        }

        return this.stateManager.mutate((draft) => {
            const targetBranch = draft.currentBranch;
            if (sourceBranch === targetBranch) {
                return { abort: true, error: 'Cannot merge a branch into itself.' };
            }

            const sourceBranchData = draft.branches[sourceBranch];
            if (!sourceBranchData) {
                return { abort: true, error: 'Source branch does not exist.' };
            }

            const targetBranchData = draft.branches[targetBranch];
            const mergeCommitMessage = `Merge '${sourceBranch}' into '${targetBranch}'`;

            createCommitOnBranch(draft, targetBranch, {
                message: mergeCommitMessage,
                parents: [targetBranchData.head, sourceBranchData.head],
                isMerge: true,
                mergeSource: sourceBranch
            });

            return {
                explanation: 'merge',
                command: `git merge ${sourceBranch}`,
                data: { source: sourceBranch, target: targetBranch }
            };
        });
    }

    rebase(targetBranch) {
        return this.stateManager.mutate((draft) => {
            const currentBranch = draft.currentBranch;
            if (currentBranch === targetBranch) {
                return { abort: true, error: 'Cannot rebase a branch onto itself.' };
            }

            const target = draft.branches[targetBranch];
            if (!target) {
                return { abort: true, error: 'Target branch does not exist.' };
            }

            const currentHead = draft.branches[currentBranch].head;
            const targetHead = target.head;
            const targetAncestors = collectAncestors(draft.commits, targetHead);

            const linearCommits = listBranchCommitsLinear(draft.commits, currentHead);
            const commitsToReplay = linearCommits
                .filter((commit) => !targetAncestors.has(commit.id) && commit.branch === currentBranch)
                .reverse();

            if (commitsToReplay.length === 0) {
                return { abort: true, error: 'No commits to rebase.' };
            }

            let newParent = targetHead;
            const createdCommits = [];

            commitsToReplay.forEach((commit) => {
                const message = commit.message;
                const newCommit = createCommitOnBranch(draft, currentBranch, {
                    message,
                    parents: [newParent]
                });
                newCommit.rebasedFrom = commit.id;
                createdCommits.push(newCommit);
                newParent = newCommit.id;
            });

            return {
                explanation: 'rebase',
                command: `git rebase ${targetBranch}`,
                data: { target: targetBranch }
            };
        });
    }

    cherryPick(commitId) {
        return this.stateManager.mutate((draft) => {
            const commit = getCommitById(draft.commits, commitId);
            if (!commit) {
                return { abort: true, error: 'Commit not found.' };
            }

            const currentBranchData = draft.branches[draft.currentBranch];
            const newMessage = `Cherry-pick: ${commit.message}`;
            createCommitOnBranch(draft, draft.currentBranch, {
                message: newMessage,
                parents: [currentBranchData.head]
            });

            return {
                explanation: 'cherry-pick',
                command: `git cherry-pick ${commit.id}`
            };
        });
    }

    stashSave(message) {
        return this.stateManager.mutate((draft) => {
            const entry = {
                id: generateHash(),
                message: message || 'WIP: work in progress',
                createdAt: new Date().toISOString()
            };
            draft.stash.unshift(entry);
            return {
                explanation: 'stash-save',
                command: `git stash push -m "${entry.message}"`
            };
        });
    }

    stashApply({ pop = false } = {}) {
        return this.stateManager.mutate((draft) => {
            if (draft.stash.length === 0) {
                return { abort: true, error: 'No stashes to apply.' };
            }

            const entry = draft.stash[0];
            const currentBranchData = draft.branches[draft.currentBranch];
            const message = `WIP (stash): ${entry.message}`;
            createCommitOnBranch(draft, draft.currentBranch, {
                message,
                parents: [currentBranchData.head]
            });

            if (pop) {
                draft.stash.shift();
            }

            return {
                explanation: pop ? 'stash-pop' : 'stash-apply',
                command: pop ? 'git stash pop' : 'git stash apply'
            };
        });
    }

    stashDrop() {
        return this.stateManager.mutate((draft) => {
            if (draft.stash.length === 0) {
                return { abort: true, error: 'No stashes to drop.' };
            }

            draft.stash.shift();
            return {
                explanation: 'stash-drop',
                command: 'git stash drop'
            };
        });
    }

    remoteCommit() {
        return this.stateManager.mutate((draft) => {
            const remoteMain = draft.remote.branches.main;
            const remoteHead = remoteMain.head;
            const col = getNextCol(draft.remote.commits);
            const commit = {
                id: generateHash(),
                message: randomFrom(COMMIT_MESSAGES),
                branch: 'main',
                parents: [remoteHead],
                col,
                row: 0,
                timestamp: new Date().toISOString()
            };
            draft.remote.commits.push(commit);
            draft.remote.branches.main.head = commit.id;
            return {
                explanation: 'fetch',
                command: 'git commit (on remote)'
            };
        });
    }

    fetch() {
        return this.stateManager.mutate((draft) => {
            const tracking = {};
            Object.values(draft.remote.branches).forEach((branch) => {
                tracking[`origin/${branch.name}`] = branch.head;
            });
            draft.remoteTracking = tracking;
            return {
                explanation: 'fetch',
                command: 'git fetch origin'
            };
        });
    }

    push() {
        return this.stateManager.mutate((draft) => {
            const localBranch = draft.branches[draft.currentBranch];
            const remoteBranch = draft.remote.branches[draft.currentBranch];

            if (remoteBranch && !isAncestor(draft.commits, remoteBranch.head, localBranch.head)) {
                return { abort: true, error: 'Push rejected: remote has diverged.' };
            }

            const localAncestors = collectAncestors(draft.commits, localBranch.head);
            const commitsToSend = draft.commits.filter((commit) => localAncestors.has(commit.id));
            const remoteCommitIds = new Set(draft.remote.commits.map((commit) => commit.id));

            commitsToSend.forEach((commit) => {
                if (!remoteCommitIds.has(commit.id)) {
                    draft.remote.commits.push({
                        id: commit.id,
                        message: commit.message,
                        branch: commit.branch,
                        parents: [...commit.parents],
                        timestamp: commit.timestamp
                    });
                }
            });

            if (!draft.remote.branches[draft.currentBranch]) {
                draft.remote.branches[draft.currentBranch] = {
                    name: draft.currentBranch,
                    head: localBranch.head,
                    color: getBranchColor(draft.branches, draft.currentBranch),
                    row: Object.keys(draft.remote.branches).length
                };
            } else {
                draft.remote.branches[draft.currentBranch].head = localBranch.head;
            }

            return {
                explanation: 'push',
                command: `git push origin ${draft.currentBranch}`
            };
        });
    }

    pull() {
        return this.stateManager.mutate((draft) => {
            const localBranch = draft.branches[draft.currentBranch];
            const remoteBranch = draft.remote.branches[draft.currentBranch];
            if (!remoteBranch) {
                return { abort: true, error: 'Remote branch not found.' };
            }

            importRemoteCommits(draft, remoteBranch.head, draft.currentBranch);

            if (localBranch.head === remoteBranch.head) {
                return { abort: true, error: 'Already up to date.' };
            }

            if (isAncestor(draft.commits, localBranch.head, remoteBranch.head)) {
                localBranch.head = remoteBranch.head;
                return {
                    explanation: 'pull',
                    command: `git pull origin ${draft.currentBranch}`
                };
            }

            const mergeCommitMessage = `Merge 'origin/${draft.currentBranch}' into '${draft.currentBranch}'`;
            createCommitOnBranch(draft, draft.currentBranch, {
                message: mergeCommitMessage,
                parents: [localBranch.head, remoteBranch.head],
                isMerge: true,
                mergeSource: `origin/${draft.currentBranch}`
            });

            return {
                explanation: 'pull',
                command: `git pull origin ${draft.currentBranch}`
            };
        });
    }
}

export function getInitialState() {
    return createInitialState();
}
