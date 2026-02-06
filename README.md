# Git Workflow Simulator

An interactive, beginner-friendly visualizer for learning Git concepts. Create branches, make commits, merge, rebase, cherry-pick, stash, and simulate remote collaboration — all rendered as a live SVG graph in your browser.

## Why I Built This

Version Control (D197) was where I finally started feeling like a real developer. The course covered branching, merging, tagging, and resolving conflicts through a GitLab-based project workflow. It took me two attempts to pass — my first submission missed structural requirements like correct folder placement and pushing certain files — but by the second attempt, everything clicked.

Even though the course didn't require a coded project, version control became so foundational to how I work that I built this simulator afterward. It turns Git's concepts into something anyone can see and play with, and creating it solidified what I had struggled with during my first attempt.

## Features

- **Commit creation** — add snapshots with random messages and see the graph grow
- **Branch management** — create, switch, and visualize multiple branches
- **Merge** — combine branches with merge commits (two-parent nodes)
- **Rebase** — replay commits onto a target branch with new hashes
- **Cherry-pick** — copy a single commit onto your current branch
- **Stash** — save and restore work-in-progress changes
- **Remote simulation** — push, pull, fetch, and simulate remote commits
- **Conflict resolution** — demo merge conflicts with side-by-side code comparison
- **Undo / Redo** — step backward and forward through your history
- **Guided tutorials** — follow step-by-step workflows (feature branch, rebase, cherry-pick, stash, remote collaboration)
- **Keyboard shortcuts** — `C` commit, `B` branch, `M` merge, `S` switch, `U` undo, `R` redo
- **Equivalent git commands** — every action shows the real CLI command
- **localStorage persistence** — your graph survives page reloads

## Getting Started

No dependencies required — this is a vanilla JavaScript app.

```bash
# Clone the repo
git clone <your-repo-url>
cd git-workflow-simulator

# Option 1: npm start
npm start

# Option 2: any static server
npx http-server . -p 3000 -o

# Option 3: Python
python -m http.server 3000
```

Then open [http://localhost:3000](http://localhost:3000).

## What I Learned

The D197 course gave me confidence using Git in the terminal, comfort with branching and merging, and a real understanding of conflict resolution. Building this simulator reinforced all of that and added:

- How Git internally represents commits, branches, and HEAD
- Why branching is nearly instant (branches are just pointers)
- The difference between merge and rebase and when to use each
- How `fetch` vs `pull` work under the hood
- The importance of clean commit history and documentation

Even though version control isn't as "flashy" as other projects, it's one of the courses that changed me the most as a developer.

## License

MIT
