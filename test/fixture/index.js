'use strict';
const electron = require('electron');
const ipc = require('../..');

ipc.answerRenderer('test', async data => {
	console.log('test:main:data-from-renderer:', data);
	return 'test:main:answer';
});

function load(url) {
	const win = new electron.BrowserWindow();
	win.loadURL(url);
	return win;
}

electron.app.on('ready', () => {
	const win = load(`file://${__dirname}/index.html`);

	win.webContents.on('did-finish-load', () => {
		ipc.callRenderer(win, 'test', 'optional-data').then(answer => {
			console.log('test:main:answer-from-renderer:', answer);
		});
	});
});
