'use strict';
const path = require('path');
const {getEventListeners} = require('events');
const {app, BrowserWindow, ipcMain} = require('electron');
const {ipcMain: ipc} = require('../../index.js');
const {countDataAndErrorListeners} = require('./util.js');

let countOfLogs = 0;

ipcMain.on('log', (_event, log) => {
	console.log(log);
	countOfLogs++;
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

(async () => {
	await app.whenReady();

	const mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	ipc.answerRenderer(mainWindow, 'test-specific-window', async data => {
		console.log('test-specific-window:main:data-from-renderer:', data);
		return `test-specific-window:main:answer:${data}`;
	});

	await mainWindow.loadFile(path.join(__dirname, 'index.html'));

	const answer = await ipc.callRenderer(mainWindow, 'test', 'optional-data');
	console.log('test:main:answer-from-renderer:', answer);

	const answerFromFocusedRenderer = await ipc.callFocusedRenderer('test-focused', 'optional-data');
	console.log('test-focused:main:answer-from-renderer:', answerFromFocusedRenderer);

	try {
		await ipc.callRenderer(mainWindow, 'test-unanswered', undefined, {signal: AbortSignal.timeout(100)});
	} catch (error) {
		console.log('test-signal:main:error:', error.name);
	}

	try {
		await ipc.callFocusedRenderer('test-unanswered', undefined, {signal: AbortSignal.abort(new Error('test-signal-aborted:main:reason'))});
	} catch (error) {
		console.log('test-signal-aborted:main:error:', error.message);
	}

	const controller = new AbortController();
	const answerWithSignal = await ipc.callRenderer(mainWindow, 'test-signal-answered', undefined, {signal: controller.signal});
	console.log('test-signal-answered:main:answer-from-renderer:', answerWithSignal);
	console.log('test-signal-answered:main:abort-listeners:', getEventListeners(controller.signal, 'abort').length);

	try {
		await ipc.callRenderer();
	} catch (error) {
		console.log('test:main:error-from-renderer:', error.message);
	}

	try {
		mainWindow.blur();
		mainWindow.hide();
		await ipc.callFocusedRenderer();
	} catch (error) {
		console.log('test-focused:main:error-from-renderer:', error.message);
	}

	// Get the count of listeners from the renderer.
	mainWindow.webContents.send('count');

	console.log('test-count-main-listeners:', countDataAndErrorListeners(ipcMain));

	// Wait to get all logs from the renderer and then quit the app.
	setInterval(() => {
		if (countOfLogs === 10) {
			app.quit();
		}
	}, 100);
})();
