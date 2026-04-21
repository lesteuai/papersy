export type SummaryData = {
	summary: string;
	keyFindings: string[];
	methodology: string;
	limitations: string;
	references: string[];
};

export type PapersyFile = {
	id: string;
	name: string;
	summaryData?: SummaryData;
	jobId?: string;
	jobStatus?: string; // 'pending' | 'processing' | 'failed' | undefined (done)
	uploadError?: string;
};

export type ChatMessage = {
	role: 'user' | 'ai';
	text: string;
	loading?: boolean;
};

export type Mode = 'summary' | 'chat';
