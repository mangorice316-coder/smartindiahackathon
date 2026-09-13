/**
 * Offline Cache & Synchronization Manager for LRIDS C2
 * Provides local geopackage persistence, action queueing, and network health tracking.
 */

export interface QueuedAction {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'lrids_offline_action_queue_v1';
const SNAPSHOT_STORAGE_KEY = 'lrids_offline_snapshot_v1';

export class OfflineCacheManager {
  private static loadQueue(): QueuedAction[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading offline action queue:', e);
    }
    return [];
  }

  private static saveQueue(queue: QueuedAction[]): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to persist offline action queue:', e);
    }
  }

  public static getQueuedActions(): QueuedAction[] {
    return this.loadQueue();
  }

  public static queueAction(type: string, payload: any): QueuedAction {
    const queue = this.loadQueue();
    const action: QueuedAction = {
      id: `QUE-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      type,
      payload,
      status: 'QUEUED',
      retryCount: 0,
    };
    queue.push(action);
    this.saveQueue(queue);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: queue }));
    }

    return action;
  }

  public static markActionSynced(id: string): void {
    const queue = this.loadQueue().filter(q => q.id !== id);
    this.saveQueue(queue);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: queue }));
    }
  }

  public static saveSnapshot(data: any): void {
    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify({
        data,
        cachedAt: new Date().toISOString(),
        version: 'v2.1',
      }));
    } catch (e) {
      console.warn('Failed to cache full snapshot to localStorage:', e);
    }
  }

  public static loadSnapshot(): { data: any; cachedAt: string } | null {
    try {
      const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load snapshot from localStorage:', e);
    }
    return null;
  }
}
