import {BrowserWindow, BrowserView, IpcMain, IpcRenderer} from 'electron';

export interface MainProcessIpc extends IpcMain {
	/**
	Send a message to the given window.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	@param browserWindow - The window to send the message to.
	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns - The reply from the renderer process.

	@example
	```
	import {BrowserWindow} from 'electron';
	import {ipcMain as ipc} from 'electron-better-ipc';

	const browserWindow = BrowserWindow.getFocusedWindow();

	(async () => {
		const emoji = await ipc.callRenderer(browserWindow!, 'get-emoji', 'unicorn');
		console.log(emoji);
		//=> '🦄'
	})();
	```
	*/
	callRenderer<DataType, ReturnType>(
		browserWindow: BrowserWindow,
		channel: string,
		data?: DataType
	): Promise<ReturnType>;

	/**
	Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns - The reply from the renderer process.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	(async () => {
		const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn');
		console.log(emoji);
		//=> '🦄'
	})();
	```
	*/
	callFocusedRenderer<T>(
		channel: string,
		data?: T
	): Promise<unknown>;

	/**
	This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

	@param channel - The channel to send the message on.
	@param callback - The return value is sent back to the `ipcRenderer.callMain` in the renderer process.
	@returns A function, that when called, removes the listener.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	ipc.answerRenderer('get-emoji', async emojiName => {
		const emoji = await getEmoji(emojiName);
		return emoji;
	});
	```
	*/
	answerRenderer<DataType, ReturnType>(
		channel: string,
		callback: (
			data: DataType,
			browserWindow: BrowserView
		) => ReturnType | PromiseLike<ReturnType>
	): () => void;

	/**
	Send a message to all renderer processes (windows).

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	*/
	sendToRenderers<DataType>(channel: string, data?: DataType): void;
}

export interface RendererProcessIpc extends IpcRenderer {
	/**
	Send a message to the main process.

	In the main process, use `ipcMain.answerRenderer` to reply to this message.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns The reply from the main process.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	(async () => {
		const emoji = await ipc.callMain('get-emoji', 'unicorn');
		console.log(emoji);
		//=> '🦄'
	})();
	```
	*/
	callMain<DataType, ReturnType>(channel: string, data?: DataType): Promise<ReturnType>;

	/**
	This method listens for a message from `ipcMain.callRenderer` defined in the main process and replies back.

	@param channel - The channel to send the message on.
	@param callback - The return value is sent back to the `ipcMain.callRenderer` in the main process.
	@returns A function, that when called, removes the listener.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	ipc.answerMain('get-emoji', async emojiName => {
		const emoji = await getEmoji(emojiName);
		return emoji;
	});
	```
	*/
	answerMain<DataType, ReturnType>(
		channel: string,
		callback: (data?: DataType) => ReturnType | PromiseLike<ReturnType>
	): () => void;
}

export const ipcMain: MainProcessIpc;
export const ipcRenderer: RendererProcessIpc;
