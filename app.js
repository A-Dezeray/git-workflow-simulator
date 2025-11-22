// ===== Git Workflow Simulator =====

// Configuration
const CONFIG = {
    nodeRadius: 16,
    nodeSpacingX: 100,
    nodeSpacingY: 70,
    startX: 80,
    startY: 60,
    branchColors: [
        '#58a6ff', // main - blue
        '#a371f7', // purple
        '#3fb950', // green
        '#f78166', // orange
        '#d29922', // yellow
        '#db61a2', // pink
        '#79c0ff', // light blue
        '#7ee787', // light green
    ]
};

// Sample commit messages
const COMMIT_MESSAGES = [
    'Initial commit',
    'Add feature implementation',
    'Fix bug in authentication',
    'Update dependencies',
    'Refactor database queries',
    'Add unit tests',
    'Improve error handling',
    'Update documentation',
    'Optimize performance',
    'Add input validation',
    'Fix memory leak',
    'Update API endpoints',
    'Add caching layer',
    'Fix CSS styling issues',
    'Add logging functionality'
];

// Sample code for conflicts
const CONFLICT_EXAMPLES = [
    {
        current: 'function greet(name) {\n  return "Hello, " + name;\n}',
        incoming: 'function greet(name) {\n  return `Welcome, ${name}!`;\n}'
    },
    {
        current: 'const API_URL = "http://localhost:3000";',
        incoming: 'const API_URL = "https://api.example.com";'
    },
    {
        current: 'button {\n  color: blue;\n  padding: 10px;\n}',
        incoming: 'button {\n  color: green;\n  padding: 12px 20px;\n}'
    }
];

// ===== State =====
let state = {
    commits: [],
    branches: {},
    currentBranch: 'main',
    commitCounter: 0,
    branchCounter: 0,
    tooltip: null
};

// ===== Utility Functions =====
function generateHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 7; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

function getRandomMessage() {
    return COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
}

function getBranchColor(branchName) {
    const branchNames = Object.keys(state.branches);
    const index = branchNames.indexOf(branchName);
    return CONFIG.branchColors[index % CONFIG.branchColors.length];
}

function getCommitById(id) {
    return state.commits.find(c => c.id === id);
}

// ===== Core Git Operations =====
function initializeRepo() {
    const initialCommit = {
        id: generateHash(),
        message: 'Initial commit',
        branch: 'main',
        parents: [],
        x: CONFIG.startX,
        y: CONFIG.startY,
        row: 0,
        col: 0,
        timestamp: new Date()
    };

    state.commits = [initialCommit];
    state.branches = {
        'main': {
            name: 'main',
            head: initialCommit.id,
            color: CONFIG.branchColors[0],
            row: 0
        }
    };
    state.currentBranch = 'main';
    state.commitCounter = 1;
    state.branchCounter = 1;

    render();
    updateUI();
    showExplanation('welcome');
}

function createCommit() {
    const currentBranchData = state.branches[state.currentBranch];
    const parentCommit = getCommitById(currentBranchData.head);

    // Calculate position
    const branchCommits = state.commits.filter(c => c.branch === state.currentBranch);
    const col = Math.max(...state.commits.map(c => c.col)) + 1;

    const newCommit = {
        id: generateHash(),
        message: getRandomMessage(),
        branch: state.currentBranch,
        parents: [parentCommit.id],
        x: CONFIG.startX + col * CONFIG.nodeSpacingX,
        y: CONFIG.startY + currentBranchData.row * CONFIG.nodeSpacingY,
        row: currentBranchData.row,
        col: col,
        timestamp: new Date(),
        isNew: true
    };

    state.commits.push(newCommit);
    state.branches[state.currentBranch].head = newCommit.id;
    state.commitCounter++;

    render();
    updateUI();
    showExplanation('commit');

    // Remove the "new" flag after animation
    setTimeout(() => {
        newCommit.isNew = false;
    }, 500);
}

function createBranch(branchName) {
    if (state.branches[branchName]) {
        alert('Branch already exists!');
        return false;
    }

    const currentBranchData = state.branches[state.currentBranch];
    const currentHead = currentBranchData.head;

    // Assign new row for the branch
    const newRow = Object.keys(state.branches).length;

    state.branches[branchName] = {
        name: branchName,
        head: currentHead,
        color: CONFIG.branchColors[newRow % CONFIG.branchColors.length],
        row: newRow,
        createdFrom: state.currentBranch,
        createdAt: currentHead
    };

    state.branchCounter++;
    state.currentBranch = branchName;

    render();
    updateUI();
    showExplanation('branch');
    return true;
}

function checkout(branchName) {
    if (!state.branches[branchName]) {
        alert('Branch does not exist!');
        return;
    }

    state.currentBranch = branchName;
    render();
    updateUI();
    showExplanation('checkout', { branch: branchName });
}

function merge(sourceBranch, simulateConflict = false) {
    const targetBranch = state.currentBranch;
    const sourceBranchData = state.branches[sourceBranch];
    const targetBranchData = state.branches[targetBranch];

    if (sourceBranch === targetBranch) {
        alert('Cannot merge a branch into itself!');
        return;
    }

    // Check if there might be a conflict (for demo purposes)
    if (simulateConflict) {
        showConflictModal(sourceBranch, targetBranch);
        return;
    }

    performMerge(sourceBranch, targetBranch);
}

function performMerge(sourceBranch, targetBranch) {
    const sourceBranchData = state.branches[sourceBranch];
    const targetBranchData = state.branches[targetBranch];

    // Calculate position for merge commit
    const col = Math.max(...state.commits.map(c => c.col)) + 1;

    const mergeCommit = {
        id: generateHash(),
        message: `Merge '${sourceBranch}' into '${targetBranch}'`,
        branch: targetBranch,
        parents: [targetBranchData.head, sourceBranchData.head],
        x: CONFIG.startX + col * CONFIG.nodeSpacingX,
        y: CONFIG.startY + targetBranchData.row * CONFIG.nodeSpacingY,
        row: targetBranchData.row,
        col: col,
        timestamp: new Date(),
        isMerge: true,
        isNew: true,
        mergeSource: sourceBranch
    };

    state.commits.push(mergeCommit);
    state.branches[targetBranch].head = mergeCommit.id;
    state.commitCounter++;

    render();
    updateUI();
    showExplanation('merge', { source: sourceBranch, target: targetBranch });

    setTimeout(() => {
        mergeCommit.isNew = false;
    }, 500);
}

function resetAll() {
    state = {
        commits: [],
        branches: {},
        currentBranch: 'main',
        commitCounter: 0,
        branchCounter: 0,
        tooltip: null
    };
    initializeRepo();
}

function demoConflict() {
    // First create a scenario that would have a conflict
    if (Object.keys(state.branches).length < 2) {
        createBranch('feature');
    }

    // Switch to a branch that's not main and try to merge
    const otherBranches = Object.keys(state.branches).filter(b => b !== state.currentBranch);
    if (otherBranches.length > 0) {
        showConflictModal(otherBranches[0], state.currentBranch);
    } else {
        showExplanation('conflict-setup');
    }
}

// ===== Rendering =====
function render() {
    const svg = document.getElementById('git-graph');
    svg.innerHTML = '';

    // Create defs for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Add glow filter
    defs.innerHTML = `
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    `;
    svg.appendChild(defs);

    // Draw connections first (so they're behind nodes)
    drawConnections(svg);

    // Draw branch labels
    drawBranchLabels(svg);

    // Draw commit nodes
    drawCommits(svg);
}

function drawConnections(svg) {
    state.commits.forEach(commit => {
        commit.parents.forEach((parentId, index) => {
            const parent = getCommitById(parentId);
            if (!parent) return;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            let d;
            const isMergeConnection = commit.isMerge && index === 1;

            if (parent.row === commit.row) {
                // Same row - straight line
                d = `M ${parent.x} ${parent.y} L ${commit.x} ${commit.y}`;
            } else {
                // Different rows - curved line
                const midX = (parent.x + commit.x) / 2;
                if (isMergeConnection) {
                    // Merge line coming from source branch
                    d = `M ${parent.x} ${parent.y}
                         C ${parent.x + 40} ${parent.y},
                           ${commit.x - 40} ${commit.y},
                           ${commit.x} ${commit.y}`;
                } else {
                    // Branch creation line
                    d = `M ${parent.x} ${parent.y}
                         C ${parent.x + 30} ${parent.y},
                           ${parent.x + 30} ${commit.y},
                           ${commit.x} ${commit.y}`;
                }
            }

            path.setAttribute('d', d);
            path.setAttribute('class', `branch-line ${isMergeConnection ? 'merge-line' : ''}`);
            path.setAttribute('stroke', getBranchColor(commit.branch));

            if (isMergeConnection) {
                path.style.strokeDasharray = '5,5';
            }

            svg.appendChild(path);
        });
    });
}

function drawBranchLabels(svg) {
    Object.values(state.branches).forEach(branch => {
        const headCommit = getCommitById(branch.head);
        if (!headCommit) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const labelX = headCommit.x + CONFIG.nodeRadius + 10;
        const labelY = headCommit.y;

        // Background rect
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY + 4);
        text.setAttribute('class', 'branch-label');
        text.setAttribute('fill', branch.color);
        text.textContent = branch.name;

        // Measure text for background
        svg.appendChild(text);
        const bbox = text.getBBox();
        svg.removeChild(text);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bbox.x - 6);
        rect.setAttribute('y', bbox.y - 3);
        rect.setAttribute('width', bbox.width + 12);
        rect.setAttribute('height', bbox.height + 6);
        rect.setAttribute('class', 'branch-label-bg');
        rect.setAttribute('fill', branch.color);
        rect.setAttribute('fill-opacity', '0.15');
        rect.setAttribute('stroke', branch.color);
        rect.setAttribute('stroke-opacity', '0.5');

        g.appendChild(rect);
        g.appendChild(text);

        // HEAD indicator
        if (branch.name === state.currentBranch) {
            const headText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            headText.setAttribute('x', labelX + bbox.width + 18);
            headText.setAttribute('y', labelY + 4);
            headText.setAttribute('class', 'head-indicator');
            headText.textContent = 'HEAD';
            g.appendChild(headText);
        }

        svg.appendChild(g);
    });
}

function drawCommits(svg) {
    state.commits.forEach(commit => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `commit-node${commit.isNew ? ' new-commit' : ''}${commit.id === state.branches[state.currentBranch].head ? ' head' : ''}`);
        g.setAttribute('data-commit-id', commit.id);

        const color = getBranchColor(commit.branch);

        // Glow effect
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', commit.x);
        glow.setAttribute('cy', commit.y);
        glow.setAttribute('r', CONFIG.nodeRadius + 6);
        glow.setAttribute('fill', color);
        glow.setAttribute('class', 'node-glow');
        g.appendChild(glow);

        // Main circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', commit.x);
        circle.setAttribute('cy', commit.y);
        circle.setAttribute('r', CONFIG.nodeRadius);
        circle.setAttribute('fill', '#0d1117');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', commit.isMerge ? '4' : '3');
        circle.setAttribute('class', 'node-circle');
        g.appendChild(circle);

        // Inner dot for merge commits
        if (commit.isMerge) {
            const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            innerCircle.setAttribute('cx', commit.x);
            innerCircle.setAttribute('cy', commit.y);
            innerCircle.setAttribute('r', 5);
            innerCircle.setAttribute('fill', color);
            g.appendChild(innerCircle);
        }

        // Commit hash label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', commit.x);
        label.setAttribute('y', commit.y + CONFIG.nodeRadius + 14);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'node-label');
        label.textContent = commit.id;
        g.appendChild(label);

        // Event listeners
        g.addEventListener('mouseenter', (e) => showTooltip(e, commit));
        g.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(g);
    });
}

// ===== UI Updates =====
function updateUI() {
    // Update current HEAD
    document.getElementById('current-head').textContent = state.currentBranch;
    document.getElementById('current-head').style.borderColor = getBranchColor(state.currentBranch);
    document.getElementById('current-head').style.color = getBranchColor(state.currentBranch);
    document.getElementById('current-head').style.background = `${getBranchColor(state.currentBranch)}20`;

    // Update branch list
    const branchList = document.getElementById('branch-list');
    branchList.innerHTML = Object.values(state.branches).map(branch => `
        <span class="branch-tag ${branch.name === state.currentBranch ? 'active' : ''}"
              style="border-color: ${branch.color}; ${branch.name === state.currentBranch ? `color: ${branch.color}; background: ${branch.color}20;` : ''}">
            ${branch.name}
        </span>
    `).join('');

    // Update commit count
    document.getElementById('commit-count').textContent = state.commits.length;
}

// ===== Tooltips =====
function showTooltip(event, commit) {
    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-hash">${commit.id}</div>
        <div class="tooltip-message">${commit.message}</div>
        <div class="tooltip-meta">
            Branch: ${commit.branch}<br>
            ${commit.isMerge ? `Merged from: ${commit.mergeSource}<br>` : ''}
            Parents: ${commit.parents.length > 0 ? commit.parents.join(', ') : 'none'}
        </div>
    `;

    document.body.appendChild(tooltip);
    state.tooltip = tooltip;

    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;

    // Adjust if off-screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
    }
}

function hideTooltip() {
    if (state.tooltip) {
        state.tooltip.remove();
        state.tooltip = null;
    }
}

// ===== Explanations =====
const EXPLANATIONS = {
    welcome: {
        icon: '💡',
        text: `<strong>Welcome!</strong> This simulator helps you understand Git concepts visually.
               Click <strong>"New Commit"</strong> to add commits, or <strong>"New Branch"</strong> to create a feature branch.
               Hover over nodes to see commit details.`
    },
    commit: {
        icon: '✅',
        text: `<strong>Commit created!</strong> A commit is a snapshot of your code at a point in time.
               Each commit has a unique hash (like <code>a1b2c3d</code>) and points to its parent commit,
               forming a chain of history.`
    },
    branch: {
        icon: '🌿',
        text: `<strong>Branch created!</strong> A branch is just a pointer to a commit.
               Creating a branch lets you work on features in isolation without affecting the main codebase.
               Notice how branches diverge visually in the graph.`
    },
    checkout: {
        icon: '📍',
        text: `<strong>Switched branches!</strong> The <code>HEAD</code> pointer now points to the new branch.
               Any new commits you create will be added to this branch.
               The HEAD indicator shows which branch you're currently on.`
    },
    merge: {
        icon: '🔀',
        text: `<strong>Merge complete!</strong> A merge commit has two parents - it combines the history of both branches.
               The dashed line shows where the merged branch's commits came from.
               This is how features get integrated back into the main branch.`
    },
    conflict: {
        icon: '⚠️',
        text: `<strong>Merge conflict resolved!</strong> Conflicts happen when both branches modify the same code.
               Git can't automatically decide which version to keep, so you must choose.
               In real Git, you'd edit the conflicting files and then commit the resolution.`
    },
    'conflict-setup': {
        icon: '💡',
        text: `<strong>Tip:</strong> To see a conflict demo, first create a branch, add some commits to both branches,
               then try to merge. The "Demo Conflict" button will show what conflict resolution looks like.`
    }
};

function showExplanation(type, data = {}) {
    const explanation = EXPLANATIONS[type];
    if (!explanation) return;

    let text = explanation.text;

    // Replace placeholders with data
    if (data.branch) {
        text = text.replace('{branch}', `<code>${data.branch}</code>`);
    }
    if (data.source && data.target) {
        text = `<strong>Merge complete!</strong> Branch <code>${data.source}</code> has been merged into <code>${data.target}</code>.
                The merge commit has two parents, combining both branches' history.`;
    }

    document.getElementById('explanation-content').innerHTML = `
        <div class="explanation-icon">${explanation.icon}</div>
        <div class="explanation-text">${text}</div>
    `;
}

// ===== Modals =====
function showBranchModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-input').value = '';
    document.getElementById('modal-input').focus();
}

function hideBranchModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function showMergeModal() {
    const overlay = document.getElementById('merge-modal-overlay');
    const optionsContainer = document.getElementById('merge-branch-options');
    const targetSpan = document.getElementById('merge-target');

    targetSpan.textContent = state.currentBranch;

    // Show all branches except current
    const otherBranches = Object.values(state.branches).filter(b => b.name !== state.currentBranch);

    if (otherBranches.length === 0) {
        optionsContainer.innerHTML = '<p style="color: var(--text-muted);">No other branches to merge.</p>';
    } else {
        optionsContainer.innerHTML = otherBranches.map(branch => `
            <div class="merge-option" data-branch="${branch.name}">
                <div class="merge-option-color" style="background: ${branch.color};"></div>
                <span class="merge-option-name">${branch.name}</span>
            </div>
        `).join('');

        // Add click handlers
        optionsContainer.querySelectorAll('.merge-option').forEach(option => {
            option.addEventListener('click', () => {
                const branchName = option.dataset.branch;
                hideMergeModal();
                merge(branchName);
            });
        });
    }

    overlay.classList.remove('hidden');
}

function hideMergeModal() {
    document.getElementById('merge-modal-overlay').classList.add('hidden');
}

function showCheckoutModal() {
    const overlay = document.getElementById('checkout-modal-overlay');
    const optionsContainer = document.getElementById('checkout-branch-options');

    const otherBranches = Object.values(state.branches).filter(b => b.name !== state.currentBranch);

    if (otherBranches.length === 0) {
        optionsContainer.innerHTML = '<p style="color: var(--text-muted);">No other branches to switch to.</p>';
    } else {
        optionsContainer.innerHTML = otherBranches.map(branch => `
            <div class="merge-option" data-branch="${branch.name}">
                <div class="merge-option-color" style="background: ${branch.color};"></div>
                <span class="merge-option-name">${branch.name}</span>
            </div>
        `).join('');

        optionsContainer.querySelectorAll('.merge-option').forEach(option => {
            option.addEventListener('click', () => {
                const branchName = option.dataset.branch;
                hideCheckoutModal();
                checkout(branchName);
            });
        });
    }

    overlay.classList.remove('hidden');
}

function hideCheckoutModal() {
    document.getElementById('checkout-modal-overlay').classList.add('hidden');
}

function showConflictModal(sourceBranch, targetBranch) {
    const overlay = document.getElementById('conflict-modal-overlay');
    const example = CONFLICT_EXAMPLES[Math.floor(Math.random() * CONFLICT_EXAMPLES.length)];

    document.getElementById('conflict-current-branch').textContent = targetBranch;
    document.getElementById('conflict-incoming-branch').textContent = sourceBranch;
    document.getElementById('conflict-current-code').textContent = example.current;
    document.getElementById('conflict-incoming-code').textContent = example.incoming;

    // Store for resolution
    overlay.dataset.sourceBranch = sourceBranch;
    overlay.dataset.targetBranch = targetBranch;

    overlay.classList.remove('hidden');
}

function hideConflictModal() {
    document.getElementById('conflict-modal-overlay').classList.add('hidden');
}

function resolveConflict(resolution) {
    const overlay = document.getElementById('conflict-modal-overlay');
    const sourceBranch = overlay.dataset.sourceBranch;
    const targetBranch = overlay.dataset.targetBranch;

    hideConflictModal();
    performMerge(sourceBranch, targetBranch);
    showExplanation('conflict');
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    initializeRepo();

    // Button handlers
    document.getElementById('btn-commit').addEventListener('click', createCommit);
    document.getElementById('btn-branch').addEventListener('click', showBranchModal);
    document.getElementById('btn-merge').addEventListener('click', showMergeModal);
    document.getElementById('btn-checkout').addEventListener('click', showCheckoutModal);
    document.getElementById('btn-reset').addEventListener('click', resetAll);
    document.getElementById('btn-demo-conflict').addEventListener('click', demoConflict);

    // Branch modal handlers
    document.getElementById('modal-cancel').addEventListener('click', hideBranchModal);
    document.getElementById('modal-confirm').addEventListener('click', () => {
        const name = document.getElementById('modal-input').value.trim();
        if (name) {
            if (createBranch(name)) {
                hideBranchModal();
            }
        }
    });

    document.getElementById('modal-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const name = document.getElementById('modal-input').value.trim();
            if (name) {
                if (createBranch(name)) {
                    hideBranchModal();
                }
            }
        } else if (e.key === 'Escape') {
            hideBranchModal();
        }
    });

    // Merge modal handlers
    document.getElementById('merge-modal-cancel').addEventListener('click', hideMergeModal);

    // Checkout modal handlers
    document.getElementById('checkout-modal-cancel').addEventListener('click', hideCheckoutModal);

    // Conflict modal handlers
    document.getElementById('conflict-accept-current').addEventListener('click', () => resolveConflict('current'));
    document.getElementById('conflict-accept-incoming').addEventListener('click', () => resolveConflict('incoming'));
    document.getElementById('conflict-accept-both').addEventListener('click', () => resolveConflict('both'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });
});
