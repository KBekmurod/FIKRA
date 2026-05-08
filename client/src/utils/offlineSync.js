import { api, getStoredAuth } from '../api/client';
const OFFLINE_RESULT_QUEUE_KEY = 'fikra_offline_result_queue_v1';
function readQueue() {
    try {
        return JSON.parse(localStorage.getItem(OFFLINE_RESULT_QUEUE_KEY) || '[]');
    }
    catch {
        return [];
    }
}
function writeQueue(queue) {
    localStorage.setItem(OFFLINE_RESULT_QUEUE_KEY, JSON.stringify(queue));
}
export function enqueueOfflineResult(payload) {
    const queue = readQueue();
    queue.push({
        id: `offline-result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        payload,
    });
    writeQueue(queue);
}
export async function flushOfflineResultQueue() {
    const auth = getStoredAuth();
    if (!auth?.access)
        return { synced: 0, remaining: readQueue().length };
    const queue = readQueue();
    if (!queue.length)
        return { synced: 0, remaining: 0 };
    const remaining = [];
    let synced = 0;
    for (const item of queue) {
        try {
            await api.post('/api/games/test/result', item.payload);
            synced += 1;
        }
        catch {
            remaining.push(item);
        }
    }
    writeQueue(remaining);
    return { synced, remaining: remaining.length };
}
export function hasOfflineResultQueue() {
    return readQueue().length > 0;
}
