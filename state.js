export class StateManager {
    #state;
    #listeners;

    constructor(initialState) {
        this.#state = structuredClone(initialState);
        this.#listeners = new Set();
    }

    getState() {
        return structuredClone(this.#state);
    }

    getSnapshot() {
        return structuredClone(this.#state);
    }

    replaceState(nextState, { notify = true } = {}) {
        this.#state = structuredClone(nextState);
        if (notify) {
            this.#notify();
        }
    }

    mutate(mutator) {
        const draft = structuredClone(this.#state);
        const result = mutator(draft) || {};

        if (result.abort) {
            return result;
        }

        this.#state = draft;
        this.#notify();
        return result;
    }

    subscribe(listener) {
        this.#listeners.add(listener);
        return () => {
            this.#listeners.delete(listener);
        };
    }

    #notify() {
        const snapshot = this.getState();
        this.#listeners.forEach((listener) => listener(snapshot));
    }
}
