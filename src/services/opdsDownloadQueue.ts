export type DownloadQueueItem = {
  id: string;
  title: string;
  status: 'queued' | 'downloading' | 'done' | 'error';
  progress: number;
  error?: string;
};

type QueueListener = (items: DownloadQueueItem[]) => void;

let queue: DownloadQueueItem[] = [];
const listeners = new Set<QueueListener>();

function notify() {
  const snapshot = [...queue];
  listeners.forEach(listener => listener(snapshot));
}

export function subscribeDownloadQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener([...queue]);
  return () => {
    listeners.delete(listener);
  };
}

export function getDownloadQueue(): DownloadQueueItem[] {
  return [...queue];
}

export function enqueueDownload(title: string): string {
  const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue = [...queue, { id, title, status: 'queued', progress: 0 }];
  notify();
  return id;
}

export function updateDownloadItem(
  id: string,
  patch: Partial<DownloadQueueItem>,
): void {
  queue = queue.map(item => (item.id === id ? { ...item, ...patch } : item));
  notify();
}

export function removeDownloadItem(id: string): void {
  queue = queue.filter(item => item.id !== id);
  notify();
}

export function clearFinishedDownloads(): void {
  queue = queue.filter(
    item => item.status === 'queued' || item.status === 'downloading',
  );
  notify();
}
