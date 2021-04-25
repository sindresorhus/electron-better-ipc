'use strict';
const path = require('path');
const {app, BrowserWindow, ipcMain} = require('electron');
const {ipcMain: ipc} = require('../..');
const {countDataAndErrorListeners} = require('./util');

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
			nodeIntegration: true
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

	// Get the count of listeners from rednerer
	mainWindow.webContents.send('count');

	console.log('test-count-main-listeners:', countDataAndErrorListeners(ipcMain));

	// Wait to get all logs from renderer and then quit the app
	setInterval(() => {
		if (countOfLogs === 10) {
			app.quit();
		}
	}, 100);
})();
