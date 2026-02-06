import { CONFIG } from './config.js';

export function generateHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 7; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

export function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

export function getCommitById(commits, id) {
    return commits.find((commit) => commit.id === id);
}

export function getBranchColor(branches, branchName) {
    const branchNames = Object.keys(branches);
    const index = branchNames.indexOf(branchName);
    return CONFIG.branchColors[index % CONFIG.branchColors.length];
}

export function validateBranchName(name, branches) {
    if (!name) {
        return { valid: false, error: 'Branch name cannot be empty.' };
    }

    if (branches[name]) {
        return { valid: false, error: 'Branch already exists.' };
    }

    const basicPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
    if (!basicPattern.test(name)) {
        return { valid: false, error: 'Use letters, numbers, ".", "_", "-" and "/".' };
    }

    if (name.endsWith('/') || name.endsWith('.lock')) {
        return { valid: false, error: 'Branch name cannot end with "/" or ".lock".' };
    }

    if (name.includes('..') || name.includes('//') || name.includes('@{')) {
        return { valid: false, error: 'Branch name cannot contain "..", "//", or "@{".' };
    }

    if (name.startsWith('-')) {
        return { valid: false, error: 'Branch name cannot start with "-".' };
    }

    return { valid: true, error: '' };
}

export function collectAncestors(commits, startId) {
    const visited = new Set();
    const stack = [startId];
    while (stack.length) {
        const currentId = stack.pop();
        if (!currentId || visited.has(currentId)) {
            continue;
        }
        visited.add(currentId);
        const commit = getCommitById(commits, currentId);
        if (commit) {
            commit.parents.forEach((parentId) => stack.push(parentId));
        }
    }
    return visited;
}

export function isAncestor(commits, ancestorId, descendantId) {
    const ancestors = collectAncestors(commits, descendantId);
    return ancestors.has(ancestorId);
}

export function findCommonAncestor(commits, commitAId, commitBId) {
    const ancestorsA = collectAncestors(commits, commitAId);
    const queue = [commitBId];
    while (queue.length) {
        const currentId = queue.shift();
        if (!currentId) continue;
        if (ancestorsA.has(currentId)) {
            return currentId;
        }
        const commit = getCommitById(commits, currentId);
        if (commit) {
            commit.parents.forEach((parentId) => queue.push(parentId));
        }
    }
    return null;
}

export function getBranchCommits(commits, branchName) {
    return commits.filter((commit) => commit.branch === branchName);
}

export function getMaxCol(commits) {
    if (commits.length === 0) {
        return 0;
    }
    return Math.max(...commits.map((commit) => commit.col || 0));
}

export function createPosition(col, row) {
    return {
        x: CONFIG.startX + col * CONFIG.nodeSpacingX,
        y: CONFIG.startY + row * CONFIG.nodeSpacingY,
        col,
        row
    };
}
