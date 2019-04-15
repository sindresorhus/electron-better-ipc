/// <reference lib="dom"/>
import {expectType, expectError} from 'tsd';
import {BrowserWindow} from 'electron';
import {ipcMain, ipcRenderer} from '.';

const window = BrowserWindow.getFocusedWindow();

// ipcMain

expectType<Promise<unknown>>(
	ipcMain.callRenderer(window!, 'get-emoji')
);
expectType<Promise<unknown>>(
	ipcMain.callRenderer(window!, 'get-emoji', 'unicorn')
);

const detachListener = ipcMain.answerRenderer('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer('get-emoji', async emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener);
detachListener();

ipcMain.sendToRenderers('get-emoji');
ipcMain.sendToRenderers('get-emoji', '🦄');

expectError(ipcMain.callMain);

// ipcRenderer

expectType<Promise<unknown>>(
	ipcRenderer.callMain('get-emoji', 'unicorn')
);

const detachListener2 = ipcRenderer.answerMain(
	'get-emoji',
	async emojiName => {
		expectType<unknown>(emojiName);
		return '🦄';
	}
);
ipcRenderer.answerMain('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener2);
detachListener();

expectError(ipcRenderer.callRenderer);
