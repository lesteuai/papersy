export enum JobStatus {
	Pending = 'pending',
	Processing = 'processing',
	Storing = 'storing',
	Done = 'done',
	Failed = 'failed',
	Cancelled = 'cancelled'
}

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
	jobStatus?: JobStatus;
	uploadError?: string | undefined;
};

export type ChatMessage = {
	role: 'user' | 'ai';
	text: string;
	loading?: boolean;
};

export type Mode = 'summary' | 'chat';
