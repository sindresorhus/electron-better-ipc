'use strict';
const path = require('path');
const {app, BrowserWindow} = require('electron');
const {ipcMain: ipc} = require('../..');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

ipc.answerRenderer('test', async data => {
	console.log('test:main:data-from-renderer:', data);
	return 'test:main:answer';
});

let mainWindow;

(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow();
	await mainWindow.loadFile(path.join(__dirname, 'index.html'));

	const answer = await ipc.callRenderer(win, 'test', 'optional-data');
	console.log('test:main:answer-from-renderer:', answer);
})();
