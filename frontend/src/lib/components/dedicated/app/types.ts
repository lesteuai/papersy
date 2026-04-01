export type PapersyFile = {
	id: string;
	name: string;
};

export type ChatMessage = {
	role: 'user' | 'ai';
	text: string;
};

export type Mode = 'summary' | 'chat';
