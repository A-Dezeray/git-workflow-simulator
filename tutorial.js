import { getCommitById, getBranchCommits } from './utils.js';

export class TutorialManager {
    constructor(tutorials) {
        this.tutorials = tutorials;
        this.activeId = null;
        this.stepIndex = 0;
    }

    start(id) {
        const tutorial = this.tutorials.find((item) => item.id === id);
        if (!tutorial) {
            return { error: 'Tutorial not found.' };
        }
        this.activeId = id;
        this.stepIndex = 0;
        return { tutorial };
    }

    stop() {
        this.activeId = null;
        this.stepIndex = 0;
    }

    getActiveTutorial() {
        if (!this.activeId) {
            return null;
        }
        return this.tutorials.find((item) => item.id === this.activeId) || null;
    }

    evaluate(state) {
        const tutorial = this.getActiveTutorial();
        if (!tutorial) {
            return null;
        }

        const step = tutorial.steps[this.stepIndex];
        if (!step) {
            return null;
        }

        const checks = this.getChecksForTutorial(tutorial.id);
        const checkFn = checks[step.id];

        if (checkFn && checkFn(state)) {
            this.stepIndex += 1;
            return { completedStep: step.id, nextStep: tutorial.steps[this.stepIndex] };
        }

        return null;
    }

    getChecksForTutorial(id) {
        const checks = {
            'feature-flow': {
                'create-feature': (state) => Boolean(state.branches.feature),
                'feature-commits': (state) => getBranchCommits(state.commits, 'feature').length >= 3,
                'checkout-main': (state) => state.currentBranch === 'main',
                'merge-feature': (state) => {
                    const headId = state.branches.main?.head;
                    const commit = getCommitById(state.commits, headId);
                    return Boolean(commit && commit.isMerge && commit.mergeSource === 'feature');
                }
            },
            'rebase-flow': {
                'create-refactor': (state) => Boolean(state.branches.refactor),
                'refactor-commits': (state) => getBranchCommits(state.commits, 'refactor').length >= 2,
                'checkout-main-again': (state) => state.currentBranch === 'main',
                'main-commit': (state) => getBranchCommits(state.commits, 'main').length >= 2,
                'rebase-refactor': (state) => {
                    return state.commits.some((commit) => commit.branch === 'refactor' && commit.rebasedFrom);
                }
            },
            'cherry-pick-flow': {
                'cp-create-hotfix': (state) => Boolean(state.branches.hotfix),
                'cp-hotfix-commits': (state) => getBranchCommits(state.commits, 'hotfix').length >= 2,
                'cp-checkout-main': (state) => state.currentBranch === 'main',
                'cp-cherry-pick': (state) => {
                    return state.commits.some((commit) =>
                        commit.branch === 'main' && commit.message.startsWith('Cherry-pick:')
                    );
                }
            },
            'stash-flow': {
                'st-commit-first': (state) => getBranchCommits(state.commits, 'main').length >= 2,
                'st-stash-save': (state) => state.stash.length >= 1,
                'st-create-bugfix': (state) => Boolean(state.branches.bugfix),
                'st-bugfix-commit': (state) => getBranchCommits(state.commits, 'bugfix').length >= 1,
                'st-checkout-main-back': (state) => state.currentBranch === 'main',
                'st-stash-pop': (state) => {
                    return state.stash.length === 0 &&
                        state.commits.some((commit) =>
                            commit.branch === 'main' && commit.message.startsWith('WIP (stash):')
                        );
                }
            },
            'remote-collab': {
                'rc-push-main': (state) => {
                    return state.remote?.branches?.main?.head === state.branches.main?.head;
                },
                'rc-simulate-remote': (state) => {
                    return state.remote?.branches?.main?.head !== state.branches.main?.head;
                },
                'rc-pull-changes': (state) => {
                    const remoteHead = state.remote?.branches?.main?.head;
                    const localCommitIds = new Set(state.commits.map((c) => c.id));
                    return localCommitIds.has(remoteHead);
                },
                'rc-local-commit': (state) => {
                    return state.branches.main?.head !== state.remote?.branches?.main?.head;
                },
                'rc-push-again': (state) => {
                    return state.remote?.branches?.main?.head === state.branches.main?.head;
                }
            }
        };
        return checks[id] || {};
    }
}
