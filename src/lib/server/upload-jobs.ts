// Track active upload jobs by jobId for cancellation
export const activeJobs = new Map<string, AbortController>();
