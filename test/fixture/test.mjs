import electron from 'electron';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execa} from 'execa';

const run = async file => {
	const {stdout} = await execa(electron, [file], {
		timeout: 10000
	});

	return stdout.trim();
};

test('main', async () => {
	const stdout = await run('index.js');

	const logs = stdout.split('\n').filter(line => line !== '').sort();

	console.log(logs);

	assert.deepEqual(logs, [
		'test-concurrency:main:data-from-renderer: data-1',
		'test-concurrency:main:data-from-renderer: data-2',
		'test-concurrency:renderer:answer-from-main-1: test-concurrency:main:answer:data-1',
		'test-concurrency:renderer:answer-from-main-2: test-concurrency:main:answer:data-2',
		"test-copy-duplicate:renderer:error: Attempted to register a second handler for 'test'",
		'test-copy:main:answer: test-copy:renderer:answer',
		'test-copy:renderer:data-from-main: optional-data',
		"test-duplicate-renderer:renderer:error: Attempted to register a second handler for 'test-duplicate-renderer'",
		"test-duplicate:renderer:error: Attempted to register a second handler for 'test'",
		'test-error:renderer:from-main:error-message test-error:main:answer',
		'test-error:renderer:from-main:is-error true',
		'test-focused:main:answer-from-renderer: test-focused:renderer:answer-data',
		'test-focused:main:data-from-renderer: optional-data',
		'test-focused:renderer:answer-from-main: test-focused:main:answer',
		'test-focused:renderer:data-from-main: optional-data',
		'test-hostile-reply:main:answer: undefined',
		"test-missing-handler:main:error: No handler registered for 'test-missing'",
		'test-no-channel:main:error: Channel required',
		'test-no-focus:main:error: No browser window in focus',
		'test-no-window:main:error: Browser window required',
		'test-not-cloneable:main:error: DataCloneError',
		'test-peer-channel:renderer:error: Channel required',
		'test-peer-close:renderer:error: Page closed, reloaded, or crashed before answering',
		'test-peer-concurrency:renderer:answer: first,second',
		'test-peer-error:renderer:error: true test-peer-error:peer:message test-peer-error:peer:code',
		'test-peer-invalid-id:renderer:error: Web contents ID required',
		"test-peer-main-only:renderer:error: No handler registered for 'test-peer-main-only'",
		'test-peer-malformed:renderer:answer: still-works',
		'test-peer-missing-id:renderer:error: No web contents with ID 999',
		'test-peer-reload:renderer:error: Page closed, reloaded, or crashed before answering',
		'test-peer-signal-aborted:renderer:error: test-peer-signal-aborted:renderer:reason',
		'test-peer-signal:renderer:error: TimeoutError',
		'test-peer-spoofed-sender:renderer:answer: test-peer:peer:answer:spoofed:<main-id>',
		'test-peer-view:renderer:answer: test-peer:peer:answer:data-2:<main-id>',
		'test-peer:renderer:answer: test-peer:peer:answer:data-1:<main-id>',
		"test-removed-handler:main:error: No handler registered for 'test-removed'",
		"test-renderer-only:main:error: No handler registered for 'test-peer'",
		'test-reregistered:main:answer: test-reregistered:renderer:answer',
		'test-signal-aborted:main:error: test-signal-aborted:main:reason',
		'test-signal-answered:main:abort-listeners: 0',
		'test-signal-answered:main:answer-from-renderer: test-signal-answered:renderer:answer-data',
		'test-signal:main:error: TimeoutError',
		'test-target-closed:main:error: Page closed, reloaded, or crashed before answering',
		'test-target-destroyed:main:error: Browser window is destroyed',
		'test-target-reloaded:main:error: Page closed, reloaded, or crashed before answering',
		'test-view-sender-window:main:answer: BaseWindow',
		'test-view-sender:main:answer: test-peer:peer:answer:from-peer:<view-id>',
		'test-view:main:answer: test-peer-main-only:peer:answer',
		'test-windowless-sender-window:main:answer: undefined',
		'test:main:answer-from-renderer: test:renderer:answer-data',
		'test:main:data-from-renderer: optional-data',
		'test:renderer:answer-from-main: test:main:answer',
		'test:renderer:data-from-main: optional-data'
	]);
});
