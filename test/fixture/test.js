import electron from 'electron';
import {serial as test} from 'ava';
import {Application} from 'spectron';

test.beforeEach(async t => {
	t.context.app = new Application({
		path: electron,
		args: ['.']
	});
});

test.afterEach(t => {
	return t.context.app.stop();
});

test('main', async t => {
	const {app} = t.context;
	await app.start();
	await app.client.waitUntilWindowLoaded();

	const [mainLogs, rendererLogs] = await Promise.all([
		app.client.getMainProcessLogs(),
		app.client.getRenderProcessLogs()
	]);

	let logs = [
		...mainLogs,
		// TODO: We have to clean the message because of:
		// https://github.com/electron/spectron/issues/283
		...rendererLogs.map(x => x.message.replace(/[^"]+/, ''))
	].sort();

	// More useless cleanup because Spectron sucks
	logs = logs.filter(x =>
		!x.startsWith('DevTools listening') &&
		!x.includes(':CONSOLE(') &&
		// Cannot match like this one: [79915:0924/100744.171411:INFO:CONSOLE(14)]
		// !/^\[.*:CONSOLE\(\d\)\]/.test(x) &&
		x !== '' &&
		x !== 'Please protect ports used by ChromeDriver and related test frameworks to prevent access by malicious code.'
	);

	console.log(logs);

	t.deepEqual(logs, [
		// TODO: The value is missing as Spectron only captures the first argument to `console.log`:
		// https://github.com/electron/spectron/issues/282
		'"test-error:renderer:from-main:error-message" "test-error:main:answer"',
		'"test-error:renderer:from-main:is-error" true',
		'"test-focused:renderer:answer-from-main:" "test-focused:main:answer"',
		'"test-focused:renderer:data-from-main:" "optional-data"',
		'"test:renderer:answer-from-main:" "test:main:answer"',
		'"test:renderer:data-from-main:" "optional-data"',
		'test-focused:main:answer-from-renderer: test-focused:renderer:answer-data',
		'test-focused:main:data-from-renderer: optional-data',
		'test-focused:main:error-from-renderer: No browser window in focus',
		'test:main:answer-from-renderer: test:renderer:answer-data',
		'test:main:data-from-renderer: optional-data',
		'test:main:error-from-renderer: Browser window required'
	]);
});
