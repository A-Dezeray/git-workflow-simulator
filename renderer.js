import { CONFIG } from './config.js';
import { getCommitById, getBranchColor } from './utils.js';

function createSvgElement(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

export class Renderer {
    constructor({ onCommitEnter, onCommitLeave } = {}) {
        this.onCommitEnter = onCommitEnter;
        this.onCommitLeave = onCommitLeave;
        this.svg = null;
        this.layers = {};
        this.renderedCommitIds = new Set();
        this.renderedConnections = new Set();
        this.lastHeadId = null;
        this.lastLabelKey = null;
    }

    initialize(svg) {
        this.svg = svg;
        this.svg.innerHTML = '';

        const defs = createSvgElement('defs');
        defs.innerHTML = `
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        this.svg.appendChild(defs);

        this.layers.connections = createSvgElement('g');
        this.layers.labels = createSvgElement('g');
        this.layers.commits = createSvgElement('g');

        this.svg.appendChild(this.layers.connections);
        this.svg.appendChild(this.layers.labels);
        this.svg.appendChild(this.layers.commits);
    }

    render(state, { full = false } = {}) {
        if (!this.svg) {
            return;
        }

        this.fullRender = full;
        if (full) {
            Object.values(this.layers).forEach((layer) => {
                if (layer) {
                    layer.innerHTML = '';
                }
            });
            this.renderedCommitIds.clear();
            this.renderedConnections.clear();
            this.lastHeadId = null;
            this.lastLabelKey = null;
        }

        this.drawConnections(state);
        this.drawCommits(state);
        this.drawBranchLabels(state);
        this.updateHeadIndicator(state);
        this.updateViewBox(state);
    }

    updateViewBox(state) {
        if (state.commits.length === 0) {
            return;
        }
        const maxX = Math.max(...state.commits.map((c) => c.x)) + 160;
        const maxCommitY = Math.max(...state.commits.map((c) => c.y));
        // Also account for branch rows that may not have commits yet
        const maxBranchRow = Math.max(...Object.values(state.branches).map((b) => b.row));
        const maxBranchY = CONFIG.startY + maxBranchRow * CONFIG.nodeSpacingY;
        const maxY = Math.max(maxCommitY, maxBranchY) + 80;
        const width = Math.max(800, maxX);
        const height = Math.max(500, maxY);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.style.minWidth = `${width}px`;
        this.svg.style.minHeight = `${height}px`;
    }

    drawConnections(state) {
        state.commits.forEach((commit) => {
            if (this.renderedCommitIds.has(commit.id)) {
                return;
            }

            commit.parents.forEach((parentId, index) => {
                const parent = getCommitById(state.commits, parentId);
                if (!parent) {
                    return;
                }

                const connectionId = `${parent.id}->${commit.id}`;
                if (this.renderedConnections.has(connectionId)) {
                    return;
                }

                const path = createSvgElement('path');
                const isMergeConnection = commit.isMerge && index === 1;
                let d;

                if (parent.row === commit.row) {
                    d = `M ${parent.x} ${parent.y} L ${commit.x} ${commit.y}`;
                } else if (isMergeConnection) {
                    // Merge: curve right from source branch up/down to merge commit
                    d = `M ${parent.x} ${parent.y}
                         C ${commit.x} ${parent.y},
                           ${parent.x} ${commit.y},
                           ${commit.x} ${commit.y}`;
                } else {
                    // Branch fork: curve right and down from parent to commit
                    d = `M ${parent.x} ${parent.y}
                         C ${commit.x} ${parent.y},
                           ${parent.x} ${commit.y},
                           ${commit.x} ${commit.y}`;
                }

                path.setAttribute('d', d);
                path.setAttribute('class', `branch-line ${isMergeConnection ? 'merge-line' : ''}`.trim());
                path.setAttribute('stroke', getBranchColor(state.branches, commit.branch));
                if (isMergeConnection) {
                    path.style.strokeDasharray = '5,5';
                }

                this.layers.connections.appendChild(path);
                this.renderedConnections.add(connectionId);
            });
        });
    }

    buildLabelKey(state) {
        return Object.values(state.branches)
            .map((b) => `${b.name}:${b.head}:${b.color}`)
            .join('|') + `|HEAD=${state.currentBranch}`;
    }

    drawBranchLabels(state) {
        const key = this.buildLabelKey(state);
        if (key === this.lastLabelKey) {
            return;
        }
        this.lastLabelKey = key;

        this.layers.labels.innerHTML = '';

        Object.values(state.branches).forEach((branch) => {
            const headCommit = getCommitById(state.commits, branch.head);
            if (!headCommit) {
                return;
            }

            const g = createSvgElement('g');

            // If the head commit is on a different row (branch was just created,
            // sharing the parent's commit), position the label on the branch's own row
            const branchY = CONFIG.startY + branch.row * CONFIG.nodeSpacingY;
            const labelX = headCommit.x + CONFIG.nodeRadius + 10;
            const labelY = branchY;

            // Draw a fork indicator line from the shared commit down to this branch's row
            if (headCommit.row !== branch.row) {
                const forkLine = createSvgElement('path');
                const endX = headCommit.x + CONFIG.nodeSpacingX * 0.6;
                const d = `M ${headCommit.x} ${headCommit.y}
                           C ${endX} ${headCommit.y},
                             ${headCommit.x} ${branchY},
                             ${endX} ${branchY}`;
                forkLine.setAttribute('d', d);
                forkLine.setAttribute('class', 'branch-line');
                forkLine.setAttribute('stroke', branch.color);
                forkLine.setAttribute('stroke-opacity', '0.4');
                forkLine.setAttribute('stroke-dasharray', '4,4');
                g.appendChild(forkLine);

                // Draw a small dot at the branch's row to indicate the fork point
                const dot = createSvgElement('circle');
                dot.setAttribute('cx', endX);
                dot.setAttribute('cy', branchY);
                dot.setAttribute('r', 5);
                dot.setAttribute('fill', branch.color);
                dot.setAttribute('fill-opacity', '0.5');
                g.appendChild(dot);
            }

            const text = createSvgElement('text');
            text.setAttribute('x', labelX);
            text.setAttribute('y', labelY + 4);
            text.setAttribute('class', 'branch-label');
            text.setAttribute('fill', branch.color);
            text.textContent = branch.name;

            this.svg.appendChild(text);
            const bbox = text.getBBox();
            this.svg.removeChild(text);

            const rect = createSvgElement('rect');
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

            if (branch.name === state.currentBranch) {
                const headText = createSvgElement('text');
                headText.setAttribute('x', labelX + bbox.width + 18);
                headText.setAttribute('y', labelY + 4);
                headText.setAttribute('class', 'head-indicator');
                headText.textContent = 'HEAD';
                g.appendChild(headText);
            }

            this.layers.labels.appendChild(g);
        });
    }

    drawCommits(state) {
        state.commits.forEach((commit) => {
            if (this.renderedCommitIds.has(commit.id)) {
                return;
            }

            const g = createSvgElement('g');
            g.setAttribute('class', 'commit-node');
            g.setAttribute('data-commit-id', commit.id);

            const color = getBranchColor(state.branches, commit.branch);

            const glow = createSvgElement('circle');
            glow.setAttribute('cx', commit.x);
            glow.setAttribute('cy', commit.y);
            glow.setAttribute('r', CONFIG.nodeRadius + 6);
            glow.setAttribute('fill', color);
            glow.setAttribute('class', 'node-glow');
            g.appendChild(glow);

            const circle = createSvgElement('circle');
            circle.setAttribute('cx', commit.x);
            circle.setAttribute('cy', commit.y);
            circle.setAttribute('r', CONFIG.nodeRadius);
            circle.setAttribute('fill', '#0d1117');
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', commit.isMerge ? '4' : '3');
            circle.setAttribute('class', 'node-circle');
            g.appendChild(circle);

            if (commit.isMerge) {
                const innerCircle = createSvgElement('circle');
                innerCircle.setAttribute('cx', commit.x);
                innerCircle.setAttribute('cy', commit.y);
                innerCircle.setAttribute('r', 5);
                innerCircle.setAttribute('fill', color);
                g.appendChild(innerCircle);
            }

            const label = createSvgElement('text');
            label.setAttribute('x', commit.x);
            label.setAttribute('y', commit.y + CONFIG.nodeRadius + 14);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('class', 'node-label');
            label.textContent = commit.id;
            g.appendChild(label);

            if (this.onCommitEnter) {
                g.addEventListener('mouseenter', (event) => this.onCommitEnter(event, commit));
            }
            if (this.onCommitLeave) {
                g.addEventListener('mouseleave', this.onCommitLeave);
            }

            if (commit.isNew && !this.fullRender) {
                g.classList.add('new-commit');
                setTimeout(() => {
                    g.classList.remove('new-commit');
                }, 500);
            }

            this.layers.commits.appendChild(g);
            this.renderedCommitIds.add(commit.id);
        });
    }

    updateHeadIndicator(state) {
        const currentHead = state.branches[state.currentBranch]?.head;
        if (!currentHead) {
            return;
        }

        if (this.lastHeadId && this.lastHeadId !== currentHead) {
            const prevNode = this.layers.commits.querySelector(`[data-commit-id="${this.lastHeadId}"]`);
            if (prevNode) {
                prevNode.classList.remove('head');
            }
        }

        const currentNode = this.layers.commits.querySelector(`[data-commit-id="${currentHead}"]`);
        if (currentNode) {
            currentNode.classList.add('head');
        }

        this.lastHeadId = currentHead;
    }
}
