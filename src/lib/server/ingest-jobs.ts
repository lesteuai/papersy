// Module-level map tracking in-flight ingestions so a delete request can cancel one mid-run.
export const activeIngestions = new Map<string, AbortController>();
