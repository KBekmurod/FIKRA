import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';
export const useJobStore = create()(persist((set, get) => ({
    jobs: {},
    startJob: (id, type, title) => {
        set((state) => ({
            jobs: {
                ...state.jobs,
                [id]: {
                    id,
                    type,
                    title,
                    status: 'running',
                    startTime: Date.now()
                }
            }
        }));
    },
    updateJob: (id, updates) => {
        set((state) => {
            const job = state.jobs[id];
            if (!job)
                return state;
            return {
                jobs: {
                    ...state.jobs,
                    [id]: { ...job, ...updates }
                }
            };
        });
    },
    removeJob: (id) => {
        set((state) => {
            const newJobs = { ...state.jobs };
            delete newJobs[id];
            return { jobs: newJobs };
        });
    },
    clearCompleted: () => {
        set((state) => {
            const newJobs = { ...state.jobs };
            Object.keys(newJobs).forEach(id => {
                if (newJobs[id].status === 'success' || newJobs[id].status === 'error') {
                    delete newJobs[id];
                }
            });
            return { jobs: newJobs };
        });
    },
    hasRunningJobs: () => {
        const { jobs } = get();
        return Object.values(jobs).some(j => j.status === 'running');
    }
}), {
    name: 'fikra-jobs-storage',
}));
// Global poller
let pollerInterval = null;
export function initJobPoller() {
    if (pollerInterval)
        clearInterval(pollerInterval);
    pollerInterval = setInterval(async () => {
        const { jobs, updateJob } = useJobStore.getState();
        for (const [id, job] of Object.entries(jobs)) {
            if (job.status !== 'running')
                continue;
            if (job.type === 'test_generation') {
                try {
                    const { data } = await api.get(`/api/personal-tests/${id}/status`);
                    if (data.status === 'ready') {
                        updateJob(id, {
                            status: 'success',
                            result: { testId: data.testId } // GlobalJobWatcher expects testId
                        });
                    }
                    else if (data.status === 'failed') {
                        updateJob(id, { status: 'error', error: data.error });
                    }
                }
                catch (e) {
                    if (e.response?.status === 404) {
                        updateJob(id, { status: 'error', error: 'Test topilmadi' });
                    }
                }
            }
        }
    }, 5000);
}
