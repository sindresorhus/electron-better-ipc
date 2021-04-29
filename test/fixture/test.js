import electron from 'electron';
import test from 'ava';
import execa from 'execa';

const run = async file => {
	const {stdout} = await execa(electron, [file], {
		timeout: 10000
	});

	return stdout.trim();
};

test('main', async t => {
	const stdout = await run('index.js');

	const logs = [
		...stdout.split('\n')
	].filter(x =>
		x !== ''
	).sort();

	console.log(logs);

	t.deepEqual(logs, [
		'test-concurrency:main:data-from-renderer: data-1',
		'test-concurrency:main:data-from-renderer: data-2',
		'test-concurrency:renderer:answer-from-main-1: test-concurrency:main:answer:data-1',
		'test-concurrency:renderer:answer-from-main-2: test-concurrency:main:answer:data-2',
		'test-count-main-listeners: 0',
		'test-count-renderer-listeners: 0',
		'test-error:renderer:from-main:error-message test-error:main:answer',
		'test-error:renderer:from-main:is-error true',
		'test-focused:main:answer-from-renderer: test-focused:renderer:answer-data',
		'test-focused:main:data-from-renderer: optional-data',
		'test-focused:main:error-from-renderer: No browser window in focus',
		'test-focused:renderer:answer-from-main: test-focused:main:answer',
		'test-focused:renderer:data-from-main: optional-data',
		'test-specific-window:main:data-from-renderer: data-1',
		'test-specific-window:renderer:answer-from-main: test-specific-window:main:answer:data-1',
		'test:main:answer-from-renderer: test:renderer:answer-data',
		'test:main:data-from-renderer: optional-data',
		'test:main:error-from-renderer: Browser window required',
		'test:renderer:answer-from-main: test:main:answer',
		'test:renderer:data-from-main: optional-data'
	]);
});
