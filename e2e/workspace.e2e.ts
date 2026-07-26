import { test, expect } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import postgres from 'postgres';

// Reads the PG_* connection vars straight out of .env, since the Playwright test
// process is separate from the SvelteKit server and does not inherit its env.
function readPgEnv() {
	const raw = readFileSync(path.resolve('.env'), 'utf-8');
	const vars: Record<string, string> = {};
	for (const line of raw.split('\n')) {
		const match = line.match(/^([A-Z_]+)=(.*)$/);
		if (match) vars[match[1]] = match[2];
	}
	return vars;
}

async function deleteTestUser(email: string) {
	const env = readPgEnv();
	const sql = postgres({
		host: env.PG_HOST,
		port: Number(env.PG_PORT),
		user: env.PG_USER,
		password: env.PG_PASSWORD,
		database: env.PG_DATABASE,
		ssl: 'require'
	});
	try {
		// Cascades to projects, sessions, messages, documents and chunks.
		await sql`DELETE FROM "user" WHERE email = ${email}`;
	} finally {
		await sql.end();
	}
}

const runId = `t18-${Date.now()}`;
const testEmail = `${runId}@example.com`;
const testPassword = 'workspace-e2e-password-1';
const testName = 'Workspace E2E';

const kbFixturePath = path.resolve('e2e/fixtures/kb.md');

// MAX_CHARS is operator configurable, so a fixture checked in at a fixed size stops being
// oversized the moment the limit is raised. Generate one that is always over whatever is set.
const maxChars = Number(readPgEnv().MAX_CHARS) || 500_000;
const oversizedFixturePath = path.join(
	mkdtempSync(path.join(os.tmpdir(), 'papersy-e2e-')),
	'oversized.txt'
);
writeFileSync(oversizedFixturePath, 'a'.repeat(maxChars + 1000));

test.describe.configure({ mode: 'serial' });

test.afterAll(async () => {
	await deleteTestUser(testEmail);
});

test('agent workspace end-to-end flow', async ({ page }) => {
	test.setTimeout(480_000);

	await test.step('1. sign up and log in with no verification step', async () => {
		await page.goto('/');

		// Switch the login card into sign-up mode.
		await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
		await page.getByLabel('Name').fill(testName);
		await page.getByLabel('Email').fill(testEmail);
		await page.getByLabel('Password').fill(testPassword);

		const signUpResponse = page.waitForResponse(
			(res) => res.url().includes('/api/auth/sign-up/email') && res.request().method() === 'POST'
		);
		await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
		const signUpRes = await signUpResponse;
		expect(signUpRes.status()).toBe(200);
		await expect(page.locator('.error')).toHaveCount(0);

		// Switching back to sign-in clears the fields, so refill them.
		await page.getByRole('button', { name: 'Sign In', exact: true }).click();
		await page.getByLabel('Email').fill(testEmail);
		await page.getByLabel('Password').fill(testPassword);

		const signInResponse = page.waitForResponse(
			(res) => res.url().includes('/api/auth/sign-in/email') && res.request().method() === 'POST'
		);
		await page.getByRole('button', { name: 'Login', exact: true }).click();
		const signInRes = await signInResponse;
		expect(signInRes.status()).toBe(200);

		// Logging in worked immediately: no verification route was ever visited.
		expect(page.url()).not.toContain('verify-email');
		await expect(page.getByPlaceholder('New project name')).toBeVisible();
	});

	const projectName = `Project ${runId}`;
	const renamedProjectName = `Renamed Project ${runId}`;

	await test.step('2. create a project, rename it, and confirm the rename survives reload', async () => {
		await page.getByPlaceholder('New project name').fill(projectName);
		await page.getByRole('button', { name: 'Create project' }).click();
		await expect(page.getByRole('button', { name: projectName })).toBeVisible();

		await page.getByRole('button', { name: 'Project actions' }).click();
		await page.getByRole('button', { name: 'Rename' }).click();
		const renameInput = page.locator('.dialog input[type="text"]');
		await renameInput.fill(renamedProjectName);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: renamedProjectName })).toBeVisible();

		await page.getByRole('button', { name: renamedProjectName }).click();
		await expect(page).toHaveURL(/\/p\/[^/]+$/);
		await expect(page.locator('.project-header h1')).toHaveText(renamedProjectName);

		await page.reload();
		await expect(page.locator('.project-header h1')).toHaveText(renamedProjectName);
	});

	await test.step('3. upload kb.md and wait for it to reach done', async () => {
		await page.getByRole('button', { name: 'Docs', exact: true }).click();
		await page.locator('input[type="file"]').setInputFiles(kbFixturePath);

		const docRow = page.locator('.document-item').filter({ hasText: 'kb.md' });
		await expect(docRow).toBeVisible();
		await expect(docRow.locator('.document-status')).toHaveText('done', { timeout: 120_000 });
	});

	await test.step('4. ask a question answerable only from kb.md and expect the source named', async () => {
		await page.getByRole('button', { name: 'Chats', exact: true }).click();
		await page.getByLabel('New chat').click();
		await expect(page).toHaveURL(/\/p\/[^/]+\/c\/[^/]+$/);

		await page
			.getByPlaceholder("Ask about your project's documents")
			.fill('What is the peak operating voltage of QZX-88214-Nimbus?');
		await page.getByRole('button', { name: 'Send message' }).click();

		const assistantReplies = page.locator('.message.assistant .markdown-content');
		await expect(assistantReplies).toHaveCount(1, { timeout: 150_000 });
		const replyText = (await assistantReplies.nth(0).innerText()).toLowerCase();
		expect(replyText).toContain('kb.md');
	});

	await test.step('5. ask an unrelated question and expect a web-search fallback with a cited source', async () => {
		await page
			.getByPlaceholder("Ask about your project's documents")
			.fill('In what year did the Berlin Wall fall?');
		await page.getByRole('button', { name: 'Send message' }).click();

		const assistantReplies = page.locator('.message.assistant .markdown-content');
		await expect(assistantReplies).toHaveCount(2, { timeout: 150_000 });
		const replyText = (await assistantReplies.nth(1).innerText()).toLowerCase();
		expect(replyText).toContain('http');
		expect(replyText).toContain('1989');
	});

	await test.step('5b. explicitly ask to search the web and expect a cited web source', async () => {
		await page
			.getByPlaceholder("Ask about your project's documents")
			.fill('Search the web for the current version of the SvelteKit framework.');
		await page.getByRole('button', { name: 'Send message' }).click();

		const assistantReplies = page.locator('.message.assistant .markdown-content');
		await expect(assistantReplies).toHaveCount(3, { timeout: 150_000 });
		const replyText = (await assistantReplies.nth(2).innerText()).toLowerCase();
		expect(replyText).toContain('http');
	});

	const renamedSessionName = `Renamed Chat ${runId}`;

	await test.step('6. rename the auto-labelled session and confirm the label holds after another message', async () => {
		await page.getByRole('button', { name: 'Chats', exact: true }).click();
		await page.getByRole('button', { name: 'Session actions' }).click();
		await page.getByRole('button', { name: 'Rename' }).click();
		const renameInput = page.locator('.dialog input[type="text"]');
		await renameInput.fill(renamedSessionName);
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: renamedSessionName })).toBeVisible();

		await page.getByPlaceholder("Ask about your project's documents").fill('ok');
		await page.getByRole('button', { name: 'Send message' }).click();
		const assistantReplies = page.locator('.message.assistant .markdown-content');
		await expect(assistantReplies).toHaveCount(4, { timeout: 150_000 });

		// Reload to confirm the name persisted server-side and was not overwritten.
		await page.reload();
		await page.getByRole('button', { name: 'Chats', exact: true }).click();
		await expect(page.getByRole('button', { name: renamedSessionName })).toBeVisible();
	});

	await test.step('7. reject an oversized upload naming the character limit', async () => {
		await page.getByRole('button', { name: 'Docs', exact: true }).click();
		await page.locator('input[type="file"]').setInputFiles(oversizedFixturePath);

		const uploadError = page.locator('.upload-error');
		await expect(uploadError).toBeVisible();
		const errorText = await uploadError.innerText();
		expect(errorText).toContain(String(maxChars));

		// The message must name the document's real size, not just the limit.
		const reportedCount = Number(errorText.match(/Document has (\d+) characters/)?.[1]);
		expect(reportedCount).toBeGreaterThan(maxChars);

		// Rejected upload must not have created a document row.
		await expect(page.locator('.document-item').filter({ hasText: 'oversized.txt' })).toHaveCount(0);
	});
});
