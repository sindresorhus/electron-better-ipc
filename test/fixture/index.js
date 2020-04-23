'use strict';
const path = require('path');
const {app, BrowserWindow} = require('electron');
const {ipcMain: ipc} = require('../..');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

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

let mainWindow;

(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow({
		// Why? See below:
		// https://github.com/electron-userland/spectron/issues/174#issuecomment-525540776
		webPreferences: {
			nodeIntegration: true
		}
	});
	await mainWindow.loadFile(path.join(__dirname, 'index.html'));

	ipc.answerRenderer(mainWindow, 'test-specific-window', async data => {
		console.log('test-specific-data:main:data-from-renderer', data);
		return `test-specific-window:main:answer:${data}`;
	})

	const answer = await ipc.callRenderer(mainWindow, 'test', 'optional-data');
	console.log('test:main:answer-from-renderer:', answer);

	const answerFromFocusedRenderer = await ipc.callFocusedRenderer('test-focused', 'optional-data');
	console.log('test-focused:main:answer-from-renderer:', answerFromFocusedRenderer);

	try {
		await ipc.callRenderer();
	} catch (error) {
		console.log('test:main:error-from-renderer:', error.message);
	}

	try {
		mainWindow.hide();
		await ipc.callFocusedRenderer();
	} catch (error) {
		console.log('test-focused:main:error-from-renderer:', error.message);
	}
})();
