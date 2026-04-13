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
};

export type ChatMessage = {
	role: 'user' | 'ai';
	text: string;
	loading?: boolean;
};

export type Mode = 'summary' | 'chat';
