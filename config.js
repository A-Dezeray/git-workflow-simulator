export const CONFIG = {
    nodeRadius: 16,
    nodeSpacingX: 100,
    nodeSpacingY: 70,
    startX: 80,
    startY: 60,
    branchColors: [
        '#58a6ff',
        '#a371f7',
        '#3fb950',
        '#f78166',
        '#d29922',
        '#db61a2',
        '#79c0ff',
        '#7ee787'
    ]
};

export const COMMIT_MESSAGES = [
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

export const CONFLICT_EXAMPLES = [
    {
        current: 'function greet(name) {\\n  return "Hello, " + name;\\n}',
        incoming: 'function greet(name) {\\n  return `Welcome, ${name}!`;\\n}'
    },
    {
        current: 'const API_URL = "http://localhost:3000";',
        incoming: 'const API_URL = "https://api.example.com";'
    },
    {
        current: 'button {\\n  color: blue;\\n  padding: 10px;\\n}',
        incoming: 'button {\\n  color: green;\\n  padding: 12px 20px;\\n}'
    }
];

export const EXPLANATIONS = {
    welcome: {
        icon: 'TIP',
        text: `<strong>Welcome!</strong> This simulator helps you understand Git concepts visually.
               Click <strong>"New Commit"</strong> to add commits, or <strong>"New Branch"</strong> to create a feature branch.
               Hover over nodes to see commit details. Try the <strong>Tutorial</strong> section for guided workflows.`
    },
    commit: {
        icon: 'OK',
        text: `<strong>Commit created!</strong> A commit is a snapshot of your code at a point in time.
               Each commit has a unique SHA hash and points to its parent, forming a linked chain.
               Internally, Git stores a tree of file contents, the author, timestamp, and parent reference(s).`
    },
    branch: {
        icon: 'BR',
        text: `<strong>Branch created!</strong> A branch is just a lightweight pointer (a 41-byte file) to a commit hash.
               Creating a branch is nearly instant because Git doesn't copy any files &mdash;
               it just creates a new pointer. This is why Git branching is so fast compared to other VCS tools.`
    },
    checkout: {
        icon: 'SW',
        text: `<strong>Switched branches!</strong> <code>HEAD</code> is a special pointer that tells Git which branch you're on.
               When you switch branches, Git updates <code>HEAD</code> to point to the new branch and
               replaces your working directory files to match that branch's latest commit.`
    },
    merge: {
        icon: 'MG',
        text: `<strong>Merge complete!</strong> A merge commit is special &mdash; it has <em>two</em> parents,
               combining the history of both branches. Git finds the common ancestor and applies changes from both sides.
               If both branches modified different files, the merge is automatic ("fast-forward" or "recursive" strategy).`
    },
    conflict: {
        icon: 'WARN',
        text: `<strong>Merge conflict resolved!</strong> Conflicts happen when both branches modify the same lines in the same file.
               Git can't decide which version to keep, so it marks the file with <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> /
               <code>=======</code> / <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> markers and asks you to resolve manually.`
    },
    rebase: {
        icon: 'RB',
        text: `<strong>Rebase complete!</strong> Unlike merge, rebase "replays" your commits on top of the target branch,
               creating brand-new commits with new hashes. This produces a linear history without merge commits.
               <em>Warning:</em> never rebase commits that have been pushed to a shared remote.`
    },
    'cherry-pick': {
        icon: 'CP',
        text: `<strong>Cherry-pick complete!</strong> This copies a single commit's changes onto your current branch
               as a new commit. It's useful when you only need one specific fix from another branch
               without merging the entire branch. The new commit gets a different hash.`
    },
    'stash-save': {
        icon: 'ST',
        text: `<strong>Changes stashed!</strong> Git stash saves your uncommitted changes in a stack
               and reverts your working directory to a clean state. Think of it as a clipboard for code changes.
               You can stash multiple times &mdash; entries are stored in a LIFO (last-in, first-out) stack.`
    },
    'stash-apply': {
        icon: 'ST',
        text: `<strong>Stash applied!</strong> The stashed changes were re-applied to your working directory.
               The stash entry is kept in the stack, so you can apply it again to another branch if needed.`
    },
    'stash-pop': {
        icon: 'ST',
        text: `<strong>Stash popped!</strong> This is like "stash apply" + "stash drop" combined &mdash;
               the changes were applied and the stash entry was removed from the stack.`
    },
    'stash-drop': {
        icon: 'ST',
        text: `<strong>Stash dropped.</strong> The top stash entry was permanently removed without applying its changes.`
    },
    fetch: {
        icon: 'RF',
        text: `<strong>Fetch complete!</strong> <code>git fetch</code> downloads new commits from the remote
               but does <em>not</em> modify your local branches. It only updates "remote-tracking branches"
               (like <code>origin/main</code>). You can inspect changes before merging them in.`
    },
    push: {
        icon: 'RP',
        text: `<strong>Push complete!</strong> Your local commits were uploaded to the remote repository.
               This makes your work available to other collaborators. If the remote has diverged,
               you'll need to pull and resolve conflicts first before pushing.`
    },
    pull: {
        icon: 'RL',
        text: `<strong>Pull complete!</strong> <code>git pull</code> is essentially <code>git fetch</code> + <code>git merge</code>.
               It downloads remote commits and immediately merges them into your current branch.
               If there are conflicts, Git will ask you to resolve them before completing.`
    },
    undo: {
        icon: 'UN',
        text: `<strong>Undo complete!</strong> The previous state was restored. In real Git, you'd use
               <code>git reset</code>, <code>git revert</code>, or <code>git reflog</code> to undo changes,
               depending on whether you want to rewrite history or create a new "undo" commit.`
    },
    redo: {
        icon: 'RE',
        text: `<strong>Redo complete!</strong> The next state was restored. In real Git, <code>git reflog</code>
               lets you find and recover almost any previous state, even after destructive operations.`
    },
    tutorial: {
        icon: 'GO',
        text: `<strong>Tutorial mode active.</strong> Follow the steps in the tutorial panel to complete the workflow.
               Each step will be checked automatically as you perform actions.`
    },
    'conflict-setup': {
        icon: 'TIP',
        text: `<strong>Tip:</strong> To see a conflict demo, first create a branch, add some commits to both branches,
               then try to merge. The "Demo Conflict" button will show what conflict resolution looks like.`
    }
};

export const TUTORIALS = [
    {
        id: 'feature-flow',
        title: 'Feature Branch Flow',
        steps: [
            {
                id: 'create-feature',
                description: 'Create a branch named "feature".'
            },
            {
                id: 'feature-commits',
                description: 'Make 3 commits on "feature".'
            },
            {
                id: 'checkout-main',
                description: 'Switch back to "main".'
            },
            {
                id: 'merge-feature',
                description: 'Merge "feature" into "main".'
            }
        ]
    },
    {
        id: 'rebase-flow',
        title: 'Rebase Practice',
        steps: [
            {
                id: 'create-refactor',
                description: 'Create a branch named "refactor".'
            },
            {
                id: 'refactor-commits',
                description: 'Make 2 commits on "refactor".'
            },
            {
                id: 'checkout-main-again',
                description: 'Switch back to "main".'
            },
            {
                id: 'main-commit',
                description: 'Make 1 commit on "main".'
            },
            {
                id: 'rebase-refactor',
                description: 'Switch to "refactor" and rebase onto "main".'
            }
        ]
    },
    {
        id: 'cherry-pick-flow',
        title: 'Cherry-pick a Hotfix',
        steps: [
            {
                id: 'cp-create-hotfix',
                description: 'Create a branch named "hotfix".'
            },
            {
                id: 'cp-hotfix-commits',
                description: 'Make 2 commits on "hotfix".'
            },
            {
                id: 'cp-checkout-main',
                description: 'Switch back to "main".'
            },
            {
                id: 'cp-cherry-pick',
                description: 'Cherry-pick a commit from "hotfix" onto "main".'
            }
        ]
    },
    {
        id: 'stash-flow',
        title: 'Stash Workflow',
        steps: [
            {
                id: 'st-commit-first',
                description: 'Make a commit on "main".'
            },
            {
                id: 'st-stash-save',
                description: 'Save changes to the stash.'
            },
            {
                id: 'st-create-bugfix',
                description: 'Create a branch named "bugfix".'
            },
            {
                id: 'st-bugfix-commit',
                description: 'Make a commit on "bugfix".'
            },
            {
                id: 'st-checkout-main-back',
                description: 'Switch back to "main".'
            },
            {
                id: 'st-stash-pop',
                description: 'Pop the stash to restore your saved work.'
            }
        ]
    },
    {
        id: 'remote-collab',
        title: 'Remote Collaboration',
        steps: [
            {
                id: 'rc-push-main',
                description: 'Push "main" to the remote.'
            },
            {
                id: 'rc-simulate-remote',
                description: 'Simulate a remote commit (another developer pushes).'
            },
            {
                id: 'rc-pull-changes',
                description: 'Pull remote changes into "main".'
            },
            {
                id: 'rc-local-commit',
                description: 'Make a local commit on "main".'
            },
            {
                id: 'rc-push-again',
                description: 'Push your new commit to the remote.'
            }
        ]
    }
];

export const SHORTCUTS = [
    { key: 'C', action: 'commit', label: 'New Commit' },
    { key: 'B', action: 'branch', label: 'New Branch' },
    { key: 'M', action: 'merge', label: 'Merge Branch' },
    { key: 'S', action: 'switch', label: 'Switch Branch' },
    { key: 'U', action: 'undo', label: 'Undo' },
    { key: 'R', action: 'redo', label: 'Redo' }
];
