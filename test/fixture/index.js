import path from 'node:path';
import {getEventListeners} from 'node:events';
import {
	app,
	BaseWindow,
	BrowserWindow,
	WebContentsView,
	ipcMain,
} from 'electron';
import {ipcMain as ipc} from '../../index.js';

const htmlPath = path.join(import.meta.dirname, 'index.html');

const webPreferences = preload => ({
	preload: path.join(import.meta.dirname, preload),
	sandbox: false,
});

const createWindow = async (preload, options) => {
	const browserWindow = new BrowserWindow({...options, webPreferences: webPreferences(preload)});
	await browserWindow.loadFile(htmlPath);
	return browserWindow;
};

const logError = async (name, promise) => {
	try {
		console.log(`${name}:main:unexpected-answer:`, await promise);
	} catch (error) {
		console.log(`${name}:main:error:`, error.message);
	}
};

app.on('window-all-closed', () => {});

// Log to stdout, so that the test fails on an uncaught exception.
process.on('uncaughtException', error => {
	console.log('main:uncaught-exception:', error.message);
});

ipcMain.on('log', (_event, log) => {
	console.log(log);
});

ipc.answerRenderer('test', async data => {
	console.log('test:main:data-from-renderer:', data);
	return 'test:main:answer';
});

ipc.answerRenderer('test-focused', async data => {
	console.log('test-focused:main:data-from-renderer:', data);
	return 'test-focused:main:answer';
});

ipc.answerRenderer('test-error', async () => {
	throw new Error('test-error:main:answer');
});

ipc.answerRenderer('test-concurrency', async data => {
	console.log('test-concurrency:main:data-from-renderer:', data);
	return `test-concurrency:main:answer:${data}`;
});

// Top-level `await app.whenReady()` never resolves in an ES module main script.
app.whenReady().then(async () => {
	const mainWindow = await createWindow('renderer.mjs');

	const answer = await ipc.callRenderer(mainWindow, 'test', 'optional-data');
	console.log('test:main:answer-from-renderer:', answer);

	const answerFromFocusedRenderer = await ipc.callFocusedRenderer('test-focused', 'optional-data');
	console.log('test-focused:main:answer-from-renderer:', answerFromFocusedRenderer);

	try {
		await ipc.callRenderer(mainWindow, 'test-never', undefined, {signal: AbortSignal.timeout(100)});
	} catch (error) {
		console.log('test-signal:main:error:', error.name);
	}

	// Not `callFocusedRenderer`, so that the result does not depend on which app has the focus.
	await logError('test-signal-aborted', ipc.callRenderer(mainWindow, 'test-never', undefined, {signal: AbortSignal.abort(new Error('test-signal-aborted:main:reason'))}));

	const controller = new AbortController();
	const answerWithSignal = await ipc.callRenderer(mainWindow, 'test-signal-answered', undefined, {signal: controller.signal});
	console.log('test-signal-answered:main:answer-from-renderer:', answerWithSignal);
	console.log('test-signal-answered:main:abort-listeners:', getEventListeners(controller.signal, 'abort').length);

	await logError('test-missing-handler', ipc.callRenderer(mainWindow, 'test-missing'));
	await logError('test-removed-handler', ipc.callRenderer(mainWindow, 'test-removed'));
	console.log('test-reregistered:main:answer:', await ipc.callRenderer(mainWindow, 'test-reregistered'));
	console.log('test-copy:main:answer:', await ipc.callRenderer(mainWindow, 'test-copy', 'optional-data'));

	try {
		await ipc.callRenderer(mainWindow, 'test-not-cloneable');
	} catch (error) {
		console.log('test-not-cloneable:main:error:', error.name);
	}

	await logError('test-no-window', ipc.callRenderer());
	await logError('test-no-channel', ipc.callRenderer(mainWindow, ''));

	mainWindow.blur();
	mainWindow.hide();
	await logError('test-no-focus', ipc.callFocusedRenderer());

	// Windows created after the focus tests, so they do not take the focus.
	const peerWindow = await createWindow('peer.mjs', {show: false});

	console.log('test-hostile-reply:main:answer:', await ipc.callRenderer(peerWindow, 'test-hostile-reply'));

	// `answerRenderer` handlers are not reachable from the main process.
	await logError('test-renderer-only', ipc.callRenderer(peerWindow, 'test-peer'));

	const reloadedCall = ipc.callRenderer(peerWindow, 'test-never');
	peerWindow.reload();
	await logError('test-target-reloaded', reloadedCall);
	await new Promise(resolve => {
		peerWindow.webContents.once('did-finish-load', resolve);
	});

	const closedWindow = await createWindow('peer.mjs', {show: false});
	const closedCall = ipc.callRenderer(closedWindow, 'test-never');
	closedWindow.destroy();
	await logError('test-target-closed', closedCall);
	await logError('test-target-destroyed', ipc.callRenderer(closedWindow, 'test-never'));

	const viewWindow = new BaseWindow({show: false});
	const view = new WebContentsView({webPreferences: webPreferences('peer.mjs')});
	viewWindow.contentView.addChildView(view);
	await view.webContents.loadFile(htmlPath);
	console.log('test-view:main:answer:', await ipc.callRenderer(view.webContents, 'test-peer-main-only'));

	ipc.answerRenderer('get-sender-window', (_data, browserWindow) => String(browserWindow?.constructor.name ?? browserWindow));
	console.log('test-view-sender-window:main:answer:', await ipc.callRenderer(view.webContents, 'call-main', 'get-sender-window'));

	const windowlessView = new WebContentsView({webPreferences: webPreferences('peer.mjs')});
	await windowlessView.webContents.loadFile(htmlPath);
	console.log('test-windowless-sender-window:main:answer:', await ipc.callRenderer(windowlessView.webContents, 'call-main', 'get-sender-window'));

	// The sender ID of a view is the ID of its own web contents, not of the window that contains it.
	const answerToView = await ipc.callRenderer(view.webContents, 'call-peer', peerWindow.webContents.id);
	console.log('test-view-sender:main:answer:', answerToView.replace(`:${view.webContents.id}`, ':<view-id>'));

	const peerToCloseWindow = await createWindow('peer.mjs', {show: false});

	ipc.answerRenderer('get-web-contents-ids', () => ({
		mainId: mainWindow.webContents.id,
		peerId: peerWindow.webContents.id,
		peerToCloseId: peerToCloseWindow.webContents.id,
		viewId: view.webContents.id,
	}));

	ipc.answerRenderer('reload-peer-window', () => {
		peerWindow.reload();
	});

	ipc.answerRenderer('close-peer-window', () => {
		peerToCloseWindow.destroy();
	});

	ipcMain.once('done', () => {
		app.quit();
	});

	mainWindow.webContents.send('test-peer');
}).catch(error => {
	console.error(error);
	app.exit(1);
});
