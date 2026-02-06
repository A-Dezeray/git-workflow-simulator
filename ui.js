import { CONFLICT_EXAMPLES, EXPLANATIONS, SHORTCUTS, TUTORIALS } from './config.js';
import { getBranchCommits } from './utils.js';

function byId(id) {
    return document.getElementById(id);
}

function clearChildren(node) {
    node.innerHTML = '';
}

export function createUI({ actions, tutorialManager }) {
    const elements = {
        currentHead: byId('current-head'),
        branchList: byId('branch-list'),
        commitCount: byId('commit-count'),
        stashCount: byId('stash-count'),
        remoteBranchList: byId('remote-branch-list'),
        remoteCommitCount: byId('remote-commit-count'),
        explanationContent: byId('explanation-content'),
        commandOutput: byId('command-output'),
        statusMessage: byId('status-message'),
        tutorialSelect: byId('tutorial-select'),
        tutorialSteps: byId('tutorial-steps'),
        tutorialStatus: byId('tutorial-status'),
        shortcutList: byId('shortcut-list'),
        undoButton: byId('btn-undo'),
        redoButton: byId('btn-redo'),
        modal: {
            overlay: byId('modal-overlay'),
            input: byId('modal-input'),
            confirm: byId('modal-confirm'),
            cancel: byId('modal-cancel'),
            error: byId('modal-error')
        },
        merge: {
            overlay: byId('merge-modal-overlay'),
            options: byId('merge-branch-options'),
            target: byId('merge-target'),
            cancel: byId('merge-modal-cancel')
        },
        checkout: {
            overlay: byId('checkout-modal-overlay'),
            options: byId('checkout-branch-options'),
            cancel: byId('checkout-modal-cancel')
        },
        rebase: {
            overlay: byId('rebase-modal-overlay'),
            options: byId('rebase-branch-options'),
            cancel: byId('rebase-modal-cancel')
        },
        cherryPick: {
            overlay: byId('cherry-pick-modal-overlay'),
            branchSelect: byId('cherry-pick-branch-select'),
            commitList: byId('cherry-pick-commit-list'),
            cancel: byId('cherry-pick-modal-cancel')
        },
        stash: {
            overlay: byId('stash-modal-overlay'),
            input: byId('stash-input'),
            confirm: byId('stash-confirm'),
            cancel: byId('stash-cancel'),
            list: byId('stash-list')
        },
        conflict: {
            overlay: byId('conflict-modal-overlay'),
            currentBranch: byId('conflict-current-branch'),
            incomingBranch: byId('conflict-incoming-branch'),
            currentCode: byId('conflict-current-code'),
            incomingCode: byId('conflict-incoming-code'),
            acceptCurrent: byId('conflict-accept-current'),
            acceptIncoming: byId('conflict-accept-incoming'),
            acceptBoth: byId('conflict-accept-both')
        }
    };

    function updateStatus(message, { tone = 'info' } = {}) {
        if (!elements.statusMessage) {
            if (message) {
                alert(message);
            }
            return;
        }

        if (!message) {
            elements.statusMessage.classList.add('hidden');
            return;
        }

        elements.statusMessage.textContent = message;
        elements.statusMessage.dataset.tone = tone;
        elements.statusMessage.classList.remove('hidden');
        setTimeout(() => {
            elements.statusMessage.classList.add('hidden');
        }, 2500);
    }

    function updateUI(state, history) {
        elements.currentHead.textContent = state.currentBranch;
        elements.currentHead.style.borderColor = state.branches[state.currentBranch].color;
        elements.currentHead.style.color = state.branches[state.currentBranch].color;
        elements.currentHead.style.background = `${state.branches[state.currentBranch].color}20`;

        elements.branchList.innerHTML = Object.values(state.branches).map((branch) => `
            <span class="branch-tag ${branch.name === state.currentBranch ? 'active' : ''}"
                  style="border-color: ${branch.color}; ${branch.name === state.currentBranch ? `color: ${branch.color}; background: ${branch.color}20;` : ''}">
                ${branch.name}
            </span>
        `).join('');

        elements.commitCount.textContent = state.commits.length;
        elements.stashCount.textContent = state.stash.length;

        if (elements.stash.list) {
            if (state.stash.length === 0) {
                elements.stash.list.innerHTML = '';
            } else {
                elements.stash.list.innerHTML = state.stash.map((entry, i) => `
                    <div class="stash-entry">
                        <span class="stash-index">stash@{${i}}</span>
                        <span class="stash-message">${entry.message}</span>
                    </div>
                `).join('');
            }
        }

        elements.remoteCommitCount.textContent = state.remote.commits.length;
        elements.remoteBranchList.innerHTML = Object.values(state.remote.branches).map((branch) => `
            <span class="branch-tag">
                origin/${branch.name}
            </span>
        `).join('');

        if (elements.undoButton) {
            elements.undoButton.disabled = !history.canUndo();
        }
        if (elements.redoButton) {
            elements.redoButton.disabled = !history.canRedo();
        }
    }

    function showExplanation(type, data = {}) {
        const explanation = EXPLANATIONS[type];
        if (!explanation) {
            return;
        }

        let text = explanation.text;
        if (data.branch) {
            text = text.replace('{branch}', `<code>${data.branch}</code>`);
        }
        if (data.source && data.target) {
            text = `<strong>Merge complete!</strong> Branch <code>${data.source}</code> has been merged into <code>${data.target}</code>.
                    The merge commit has two parents, combining both branches' history.`;
        }

        elements.explanationContent.innerHTML = `
            <div class="explanation-icon">${explanation.icon}</div>
            <div class="explanation-text">${text}</div>
        `;
    }

    function showCommand(command) {
        elements.commandOutput.innerHTML = `<code>${command}</code>`;
    }

    function showBranchModal() {
        elements.modal.error.textContent = '';
        elements.modal.overlay.classList.remove('hidden');
        elements.modal.input.value = '';
        elements.modal.input.focus();
    }

    function hideBranchModal() {
        elements.modal.overlay.classList.add('hidden');
    }

    function showMergeModal(state) {
        elements.merge.target.textContent = state.currentBranch;
        const otherBranches = Object.values(state.branches).filter((branch) => branch.name !== state.currentBranch);

        if (otherBranches.length === 0) {
            elements.merge.options.innerHTML = '<p class="empty-state">No other branches to merge.</p>';
        } else {
            elements.merge.options.innerHTML = otherBranches.map((branch) => `
                <div class="merge-option" data-branch="${branch.name}">
                    <div class="merge-option-color" style="background: ${branch.color};"></div>
                    <span class="merge-option-name">${branch.name}</span>
                </div>
            `).join('');
            elements.merge.options.querySelectorAll('.merge-option').forEach((option) => {
                option.addEventListener('click', () => {
                    const branchName = option.dataset.branch;
                    hideMergeModal();
                    actions.merge(branchName);
                });
            });
        }
        elements.merge.overlay.classList.remove('hidden');
    }

    function hideMergeModal() {
        elements.merge.overlay.classList.add('hidden');
    }

    function showCheckoutModal(state) {
        const otherBranches = Object.values(state.branches).filter((branch) => branch.name !== state.currentBranch);
        if (otherBranches.length === 0) {
            elements.checkout.options.innerHTML = '<p class="empty-state">No other branches to switch to.</p>';
        } else {
            elements.checkout.options.innerHTML = otherBranches.map((branch) => `
                <div class="merge-option" data-branch="${branch.name}">
                    <div class="merge-option-color" style="background: ${branch.color};"></div>
                    <span class="merge-option-name">${branch.name}</span>
                </div>
            `).join('');
            elements.checkout.options.querySelectorAll('.merge-option').forEach((option) => {
                option.addEventListener('click', () => {
                    const branchName = option.dataset.branch;
                    hideCheckoutModal();
                    actions.checkout(branchName);
                });
            });
        }
        elements.checkout.overlay.classList.remove('hidden');
    }

    function hideCheckoutModal() {
        elements.checkout.overlay.classList.add('hidden');
    }

    function showRebaseModal(state) {
        const otherBranches = Object.values(state.branches).filter((branch) => branch.name !== state.currentBranch);
        if (otherBranches.length === 0) {
            elements.rebase.options.innerHTML = '<p class="empty-state">No branches available for rebase.</p>';
        } else {
            elements.rebase.options.innerHTML = otherBranches.map((branch) => `
                <div class="merge-option" data-branch="${branch.name}">
                    <div class="merge-option-color" style="background: ${branch.color};"></div>
                    <span class="merge-option-name">${branch.name}</span>
                </div>
            `).join('');
            elements.rebase.options.querySelectorAll('.merge-option').forEach((option) => {
                option.addEventListener('click', () => {
                    const branchName = option.dataset.branch;
                    hideRebaseModal();
                    actions.rebase(branchName);
                });
            });
        }
        elements.rebase.overlay.classList.remove('hidden');
    }

    function hideRebaseModal() {
        elements.rebase.overlay.classList.add('hidden');
    }

    function showCherryPickModal(state) {
        elements.cherryPick.branchSelect.innerHTML = Object.values(state.branches).map((branch) => `
            <option value="${branch.name}">${branch.name}</option>
        `).join('');

        const updateCommitList = () => {
            const branchName = elements.cherryPick.branchSelect.value;
            const commits = getBranchCommits(state.commits, branchName).slice().reverse();
            if (commits.length === 0) {
                elements.cherryPick.commitList.innerHTML = '<p class="empty-state">No commits on this branch.</p>';
                return;
            }
            elements.cherryPick.commitList.innerHTML = commits.map((commit) => `
                <div class="commit-option" data-commit="${commit.id}">
                    <div class="commit-id">${commit.id}</div>
                    <div class="commit-message">${commit.message}</div>
                </div>
            `).join('');
            elements.cherryPick.commitList.querySelectorAll('.commit-option').forEach((option) => {
                option.addEventListener('click', () => {
                    hideCherryPickModal();
                    actions.cherryPick(option.dataset.commit);
                });
            });
        };

        elements.cherryPick.branchSelect.onchange = updateCommitList;
        updateCommitList();

        elements.cherryPick.overlay.classList.remove('hidden');
    }

    function hideCherryPickModal() {
        elements.cherryPick.overlay.classList.add('hidden');
    }

    function showStashModal() {
        elements.stash.input.value = '';
        elements.stash.overlay.classList.remove('hidden');
        elements.stash.input.focus();
    }

    function hideStashModal() {
        elements.stash.overlay.classList.add('hidden');
    }

    function showConflictModal(sourceBranch, targetBranch) {
        const example = CONFLICT_EXAMPLES[Math.floor(Math.random() * CONFLICT_EXAMPLES.length)];
        elements.conflict.currentBranch.textContent = targetBranch;
        elements.conflict.incomingBranch.textContent = sourceBranch;
        elements.conflict.currentCode.textContent = example.current;
        elements.conflict.incomingCode.textContent = example.incoming;
        elements.conflict.overlay.dataset.sourceBranch = sourceBranch;
        elements.conflict.overlay.dataset.targetBranch = targetBranch;
        elements.conflict.overlay.classList.remove('hidden');
    }

    function hideConflictModal() {
        elements.conflict.overlay.classList.add('hidden');
    }

    function populateTutorials() {
        elements.tutorialSelect.innerHTML = TUTORIALS.map((tutorial) => `
            <option value="${tutorial.id}">${tutorial.title}</option>
        `).join('');
    }

    function updateTutorialPanel() {
        const tutorial = tutorialManager.getActiveTutorial();
        if (!tutorial) {
            elements.tutorialStatus.textContent = 'No tutorial active.';
            elements.tutorialSteps.innerHTML = '';
            return;
        }

        elements.tutorialStatus.textContent = `Active: ${tutorial.title}`;
        elements.tutorialSteps.innerHTML = tutorial.steps.map((step, index) => `
            <li class="${index < tutorialManager.stepIndex ? 'done' : index === tutorialManager.stepIndex ? 'active' : ''}">
                ${step.description}
            </li>
        `).join('');
    }

    function populateShortcuts() {
        elements.shortcutList.innerHTML = SHORTCUTS.map((shortcut) => `
            <li><span class="shortcut-key">${shortcut.key}</span>${shortcut.label}</li>
        `).join('');
    }

    function bindEvents() {
        byId('btn-commit').addEventListener('click', () => actions.commit());
        byId('btn-branch').addEventListener('click', showBranchModal);
        byId('btn-merge').addEventListener('click', () => actions.openMergeModal());
        byId('btn-checkout').addEventListener('click', () => actions.openCheckoutModal());
        byId('btn-reset').addEventListener('click', () => actions.reset());
        byId('btn-demo-conflict').addEventListener('click', () => actions.demoConflict());
        byId('btn-undo').addEventListener('click', () => actions.undo());
        byId('btn-redo').addEventListener('click', () => actions.redo());

        byId('btn-rebase').addEventListener('click', () => actions.openRebaseModal());
        byId('btn-cherry-pick').addEventListener('click', () => actions.openCherryPickModal());

        byId('btn-stash-save').addEventListener('click', showStashModal);
        byId('btn-stash-apply').addEventListener('click', () => actions.stashApply(false));
        byId('btn-stash-pop').addEventListener('click', () => actions.stashApply(true));
        byId('btn-stash-drop').addEventListener('click', () => actions.stashDrop());

        byId('btn-fetch').addEventListener('click', () => actions.fetch());
        byId('btn-pull').addEventListener('click', () => actions.pull());
        byId('btn-push').addEventListener('click', () => actions.push());
        byId('btn-remote-commit').addEventListener('click', () => actions.remoteCommit());

        byId('btn-start-tutorial').addEventListener('click', () => actions.startTutorial());
        byId('btn-stop-tutorial').addEventListener('click', () => actions.stopTutorial());

        elements.modal.cancel.addEventListener('click', hideBranchModal);
        elements.modal.confirm.addEventListener('click', () => {
            const name = elements.modal.input.value.trim();
            const result = actions.branch(name);
            if (result && result.error) {
                elements.modal.error.textContent = result.error;
                return;
            }
            hideBranchModal();
        });
        elements.modal.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const name = elements.modal.input.value.trim();
                const result = actions.branch(name);
                if (result && result.error) {
                    elements.modal.error.textContent = result.error;
                    return;
                }
                hideBranchModal();
            } else if (event.key === 'Escape') {
                hideBranchModal();
            }
        });

        elements.merge.cancel.addEventListener('click', hideMergeModal);
        elements.checkout.cancel.addEventListener('click', hideCheckoutModal);
        elements.rebase.cancel.addEventListener('click', hideRebaseModal);
        elements.cherryPick.cancel.addEventListener('click', hideCherryPickModal);

        elements.stash.cancel.addEventListener('click', hideStashModal);
        elements.stash.confirm.addEventListener('click', () => {
            const message = elements.stash.input.value.trim();
            actions.stashSave(message);
            hideStashModal();
        });

        elements.conflict.acceptCurrent.addEventListener('click', () => actions.resolveConflict('current'));
        elements.conflict.acceptIncoming.addEventListener('click', () => actions.resolveConflict('incoming'));
        elements.conflict.acceptBoth.addEventListener('click', () => actions.resolveConflict('both'));

        document.querySelectorAll('.modal-overlay').forEach((overlay) => {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    overlay.classList.add('hidden');
                }
            });
        });

        document.addEventListener('keydown', (event) => {
            const tag = event.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || event.altKey || event.metaKey) {
                return;
            }
            const key = event.key.toLowerCase();
            if (key === 'c') actions.commit();
            if (key === 'b') showBranchModal();
            if (key === 'm') actions.openMergeModal();
            if (key === 's') actions.openCheckoutModal();
            if (key === 'u') actions.undo();
            if (key === 'r') actions.redo();
            if (event.ctrlKey && key === 'z') actions.undo();
            if (event.ctrlKey && key === 'y') actions.redo();
        });
    }

    populateTutorials();
    populateShortcuts();
    bindEvents();

    return {
        updateUI,
        showExplanation,
        showCommand,
        showConflictModal,
        hideConflictModal,
        showMergeModal,
        showCheckoutModal,
        showRebaseModal,
        showCherryPickModal,
        updateStatus,
        updateTutorialPanel
    };
}
