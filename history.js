export class HistoryManager {
    #past;
    #future;
    #limit;

    constructor({ limit = 50 } = {}) {
        this.#past = [];
        this.#future = [];
        this.#limit = limit;
    }

    record(snapshot) {
        this.#past.push(structuredClone(snapshot));
        if (this.#past.length > this.#limit) {
            this.#past.shift();
        }
        this.#future = [];
    }

    canUndo() {
        return this.#past.length > 1;
    }

    canRedo() {
        return this.#future.length > 0;
    }

    undo(currentSnapshot) {
        if (!this.canUndo()) {
            return null;
        }
        const current = structuredClone(currentSnapshot);
        this.#past.pop();
        this.#future.push(current);
        return structuredClone(this.#past[this.#past.length - 1]);
    }

    redo(currentSnapshot) {
        if (!this.canRedo()) {
            return null;
        }
        const current = structuredClone(currentSnapshot);
        const next = this.#future.pop();
        this.#past.push(current);
        return structuredClone(next);
    }

    seed(initialSnapshot) {
        this.#past = [structuredClone(initialSnapshot)];
        this.#future = [];
    }
}
