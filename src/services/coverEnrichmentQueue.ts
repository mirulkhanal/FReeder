export type CoverEnrichmentProgress = {
  active: boolean;
  total: number;
  completed: number;
  currentTitle?: string;
};

type ProgressListener = (progress: CoverEnrichmentProgress) => void;

const idleProgress: CoverEnrichmentProgress = {
  active: false,
  total: 0,
  completed: 0,
};

let progress: CoverEnrichmentProgress = { ...idleProgress };
const listeners = new Set<ProgressListener>();

function notify() {
  const snapshot = { ...progress };
  listeners.forEach(listener => listener(snapshot));
}

export function subscribeCoverEnrichmentProgress(
  listener: ProgressListener,
): () => void {
  listeners.add(listener);
  listener({ ...progress });
  return () => {
    listeners.delete(listener);
  };
}

export function getCoverEnrichmentProgress(): CoverEnrichmentProgress {
  return { ...progress };
}

export function startCoverEnrichment(total: number): void {
  progress = {
    active: true,
    total,
    completed: 0,
    currentTitle: undefined,
  };
  notify();
}

export function updateCoverEnrichment(
  patch: Partial<CoverEnrichmentProgress>,
): void {
  progress = { ...progress, ...patch };
  notify();
}

export function finishCoverEnrichment(): void {
  progress = { ...idleProgress };
  notify();
}
