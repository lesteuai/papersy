import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSearch = vi.fn();

vi.mock('@tavily/core', () => ({
	tavily: vi.fn(() => ({ search: mockSearch }))
}));

const mockEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const { webSearch } = await import('./search');

function invokeWebSearch(query: string) {
	return webSearch.invoke({
		name: 'webSearch',
		args: { query },
		id: 'call-1',
		type: 'tool_call'
	});
}

describe('webSearch', () => {
	beforeEach(() => {
		mockSearch.mockReset();
		delete mockEnv.TAVILY_API_KEY;
	});

	it('returns serialized results and the raw artifact when Tavily finds results', async () => {
		mockEnv.TAVILY_API_KEY = 'test-key';
		const results = [
			{
				title: 'Result One',
				url: 'https://example.com/one',
				content: 'First result content',
				score: 0.9,
				publishedDate: '2026-01-01'
			},
			{
				title: 'Result Two',
				url: 'https://example.com/two',
				content: 'Second result content',
				score: 0.8,
				publishedDate: '2026-01-02'
			}
		];
		mockSearch.mockResolvedValue({ query: 'test', results, responseTime: 1 });

		const message = await invokeWebSearch('test');

		for (const result of results) {
			expect(message.content).toContain(result.title);
			expect(message.content).toContain(result.url);
			expect(message.content).toContain(result.content);
		}
		expect(message.artifact).toEqual(results);
	});

	it('returns a no-results message and an empty artifact when Tavily finds nothing', async () => {
		mockEnv.TAVILY_API_KEY = 'test-key';
		mockSearch.mockResolvedValue({ query: 'test', results: [], responseTime: 1 });

		const message = await invokeWebSearch('test');

		expect(message.content).toBe('No web results found for this query.');
		expect(message.artifact).toEqual([]);
	});

	it('fails quietly and skips Tavily entirely when TAVILY_API_KEY is missing', async () => {
		delete mockEnv.TAVILY_API_KEY;

		const message = await invokeWebSearch('test');

		expect(message.content).toBe('Web search is unavailable.');
		expect(message.artifact).toEqual([]);
		expect(mockSearch).not.toHaveBeenCalled();
	});

	it('fails quietly and does not throw when the Tavily client throws', async () => {
		mockEnv.TAVILY_API_KEY = 'test-key';
		mockSearch.mockRejectedValue(new Error('timeout'));

		const message = await invokeWebSearch('test');

		expect(message.content).toBe('Web search is unavailable.');
		expect(message.artifact).toEqual([]);
	});
});
