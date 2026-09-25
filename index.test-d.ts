import {BrowserWindow} from 'electron';
import {expectType, expectError} from 'tsd';
import {ipcMain, ipcRenderer} from './index.js';

const browserWindow = BrowserWindow.getFocusedWindow()!;

// IpcMain

expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji'),
);
expectType<Promise<unknown>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<unknown>>(
	ipcMain.callRenderer<string>(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcMain.callRenderer<string, string>(browserWindow, 'get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcMain.callRenderer(browserWindow, 'get-emoji', 'unicorn'),
);

const detachListener = ipcMain.answerRenderer('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer('get-emoji', async emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string>('get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string, string>('get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcMain.answerRenderer<string, string>(browserWindow, 'get-emoji', async emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener);
detachListener();

ipcMain.sendToRenderers('get-emoji');
ipcMain.sendToRenderers('get-emoji', '🦄');
ipcMain.sendToRenderers<string>('get-emoji', '🦄');

expectError(ipcMain.callMain);

// IpcRenderer

expectType<Promise<unknown>>(
	ipcRenderer.callMain('get-emoji', 'unicorn'),
);
expectType<Promise<unknown>>(
	ipcRenderer.callMain<string>('get-emoji', 'unicorn'),
);
expectType<Promise<string>>(
	ipcRenderer.callMain<string, string>('get-emoji', 'unicorn'),
);

const detachListener2 = ipcRenderer.answerMain(
	'get-emoji',
	async emojiName => {
		expectType<unknown>(emojiName);
		return '🦄';
	},
);
ipcRenderer.answerMain('get-emoji', emojiName => {
	expectType<unknown>(emojiName);
	return '🦄';
});
ipcRenderer.answerMain<string>('get-emoji', emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});
ipcRenderer.answerMain<string, string>('get-emoji', emojiName => {
	expectType<string>(emojiName);
	return '🦄';
});

expectType<() => void>(detachListener2);
detachListener2();

expectError(ipcRenderer.callRenderer);
