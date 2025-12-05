type Listener = () => void;

class EventEmitter {
    private listeners = new Set<Listener>();

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit() {
        this.listeners.forEach(l => l());
    }
}

export const documentsChanged = new EventEmitter();
