export type NoUndefinedField<T> = {
	[P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>
};

export type SparkleType = {
	id: string;
	createdAt: number;
	color: string;
	size: number;
	style: any; // { top: string, left: string }
};

export type TagType = {
	label: string;
	color?: 'primary' | 'secondary';
};

export type SocialLink = {};

export type Feature = {
	name: string;
	description: string;
	image: string;
	tags: TagType[];
};

export type BlogPost = {
	tags: string[];
	keywords: string[];
	hidden: boolean;
	slug: string;
	title: string;
	date: string;
	updated: string;
	excerpt: string;
	html: string | undefined;
	readingTime: string;
	relatedPosts: BlogPost[];
	coverImage: string | undefined;
};

// App-specific types (moved from src/lib/components/dedicated/app/types.ts)
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
};

export type ChatMessage = {
	role: 'user' | 'ai';
	text: string;
	loading?: boolean;
};

export type Mode = 'summary' | 'chat';
