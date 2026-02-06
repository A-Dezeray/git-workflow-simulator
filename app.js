import { GitOperations, getInitialState } from './git-operations.js';
import { Renderer } from './renderer.js';
import { StateManager } from './state.js';
import { HistoryManager } from './history.js';
import { createUI } from './ui.js';
import { createTooltip } from './tooltip.js';
import { loadState, saveState, clearState } from './storage.js';
import { TutorialManager } from './tutorial.js';
import { TUTORIALS } from './config.js';

function hydrateState(snapshot) {
    if (!snapshot) {
        return null;
    }
    const base = getInitialState();
    const merged = {
        ...base,
        ...snapshot,
        remote: snapshot.remote || base.remote,
        remoteTracking: snapshot.remoteTracking || base.remoteTracking,
        stash: snapshot.stash || [],
        tutorial: snapshot.tutorial || base.tutorial
    };
    merged.commits = merged.commits.map((commit) => ({
        ...commit,
        isNew: false
    }));
    return merged;
}

document.addEventListener('DOMContentLoaded', () => {
    const stored = loadState();
    const initialState = hydrateState(stored) || getInitialState();
    const stateManager = new StateManager(initialState);
    const history = new HistoryManager({ limit: 75 });
    history.seed(stateManager.getSnapshot());

    const gitOps = new GitOperations(stateManager);
    const tooltip = createTooltip();
    const renderer = new Renderer({
        onCommitEnter: tooltip.show,
        onCommitLeave: tooltip.hide
    });
    renderer.initialize(document.getElementById('git-graph'));

    const tutorialManager = new TutorialManager(TUTORIALS);

    let ui;

    function afterAction(result, { fullRender = false } = {}) {
        if (!result || result.abort) {
            if (result?.error) {
                ui.updateStatus(result.error, { tone: 'warning' });
            }
            return result;
        }

        const snapshot = stateManager.getSnapshot();
        history.record(snapshot);
        saveState(snapshot);

        renderer.render(stateManager.getState(), { full: Boolean(result.fullRender || fullRender) });
        ui.updateUI(stateManager.getState(), history);

        if (result.explanation) {
            ui.showExplanation(result.explanation, result.data);
        }
        if (result.command) {
            ui.showCommand(result.command);
        }

        const progress = tutorialManager.evaluate(stateManager.getState());
        if (progress) {
            ui.updateTutorialPanel();
        }

        return result;
    }

    const actions = {
        commit: () => afterAction(gitOps.createCommit()),
        branch: (name) => afterAction(gitOps.createBranch(name)),
        checkout: (name) => afterAction(gitOps.checkout(name)),
        merge: (name) => {
            const result = gitOps.merge(name);
            if (result.showConflict) {
                ui.showConflictModal(result.sourceBranch, result.targetBranch);
                return result;
            }
            return afterAction(result);
        },
        rebase: (name) => afterAction(gitOps.rebase(name)),
        cherryPick: (commitId) => afterAction(gitOps.cherryPick(commitId)),
        stashSave: (message) => afterAction(gitOps.stashSave(message)),
        stashApply: (pop) => afterAction(gitOps.stashApply({ pop })),
        stashDrop: () => afterAction(gitOps.stashDrop()),
        fetch: () => afterAction(gitOps.fetch()),
        push: () => afterAction(gitOps.push()),
        pull: () => afterAction(gitOps.pull()),
        remoteCommit: () => afterAction(gitOps.remoteCommit()),
        undo: () => {
            const previous = history.undo(stateManager.getSnapshot());
            if (!previous) {
                ui.updateStatus('Nothing to undo.', { tone: 'warning' });
                return null;
            }
            stateManager.replaceState(previous);
            saveState(previous);
            renderer.render(stateManager.getState(), { full: true });
            ui.updateUI(stateManager.getState(), history);
            ui.showExplanation('undo');
            ui.showCommand('git reset --soft HEAD~1');
            ui.updateTutorialPanel();
            return { explanation: 'undo' };
        },
        redo: () => {
            const next = history.redo(stateManager.getSnapshot());
            if (!next) {
                ui.updateStatus('Nothing to redo.', { tone: 'warning' });
                return null;
            }
            stateManager.replaceState(next);
            saveState(next);
            renderer.render(stateManager.getState(), { full: true });
            ui.updateUI(stateManager.getState(), history);
            ui.showExplanation('redo');
            ui.showCommand('git reflog');
            ui.updateTutorialPanel();
            return { explanation: 'redo' };
        },
        reset: () => {
            clearState();
            const result = afterAction(gitOps.resetAll(), { fullRender: true });
            history.seed(stateManager.getSnapshot());
            ui.updateUI(stateManager.getState(), history);
            return result;
        },
        demoConflict: () => {
            const state = stateManager.getState();
            if (Object.keys(state.branches).length < 2) {
                const result = afterAction(gitOps.createBranch('feature'));
                if (result?.error && result.error !== 'Branch already exists.') {
                    ui.updateStatus(result.error, { tone: 'warning' });
                    return result;
                }
            }
            const updated = stateManager.getState();
            const otherBranches = Object.keys(updated.branches).filter((branch) => branch !== updated.currentBranch);
            if (otherBranches.length > 0) {
                ui.showConflictModal(otherBranches[0], updated.currentBranch);
            } else {
                ui.showExplanation('conflict-setup');
            }
        },
        resolveConflict: () => {
            const overlay = document.getElementById('conflict-modal-overlay');
            const sourceBranch = overlay.dataset.sourceBranch;
            ui.hideConflictModal();
            const result = afterAction(gitOps.merge(sourceBranch));
            if (result && !result.abort) {
                ui.showExplanation('conflict');
                ui.showCommand('git add . && git commit');
            }
        },
        openMergeModal: () => ui.showMergeModal(stateManager.getState()),
        openCheckoutModal: () => ui.showCheckoutModal(stateManager.getState()),
        openRebaseModal: () => ui.showRebaseModal(stateManager.getState()),
        openCherryPickModal: () => ui.showCherryPickModal(stateManager.getState()),
        startTutorial: () => {
            const id = document.getElementById('tutorial-select').value;
            const result = tutorialManager.start(id);
            if (result?.error) {
                ui.updateStatus(result.error, { tone: 'warning' });
                return;
            }
            ui.showExplanation('tutorial');
            ui.updateTutorialPanel();
        },
        stopTutorial: () => {
            tutorialManager.stop();
            ui.updateTutorialPanel();
            ui.updateStatus('Tutorial stopped.', { tone: 'info' });
        }
    };

    ui = createUI({ actions, tutorialManager });

    renderer.render(stateManager.getState(), { full: true });
    ui.updateUI(stateManager.getState(), history);
    ui.updateTutorialPanel();

    if (!stored) {
        ui.showExplanation('welcome');
        ui.showCommand('git init');
    } else {
        ui.showExplanation('welcome');
        ui.showCommand('git status');
    }
});
