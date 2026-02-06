const STORAGE_KEY = 'git-workflow-simulator-state';
const STORAGE_VERSION = 1;

export function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        if (parsed.version !== STORAGE_VERSION) {
            return null;
        }
        return parsed.state;
    } catch (error) {
        return null;
    }
}

export function saveState(state) {
    const payload = {
        version: STORAGE_VERSION,
        savedAt: new Date().toISOString(),
        state
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}
