export enum JobStatus {
	Pending = 'pending',
	Processing = 'processing',
	Storing = 'storing',
	Done = 'done',
	Failed = 'failed',
	Cancelled = 'cancelled'
}

export type Project = {
	id: string;
	name: string;
	createdAt?: string;
};

export type Session = {
	id: string;
	projectId: string;
	name: string | null;
	label: string;
	createdAt?: string;
};

export type Document = {
	id: string;
	name: string;
	kind: 'pdf' | 'markdown' | 'text';
	status: JobStatus;
	error?: string | null;
};

export type ChatMessage = {
	role: 'user' | 'assistant';
	text: string;
	loading?: boolean;
};
