import {JsonValue} from 'type-fest';
import {BrowserWindow, BrowserView, IpcMain, IpcRenderer} from 'electron';

export interface MainProcessIpc extends IpcMain {
	/**
	Send a message to the given window.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	@param window - The window to send the message to.
	@param channel - The channel to send the message on.
	@param data - Data to send to the receiver.

	@example
	```
	import {BrowserWindow} from 'electron';
	import {ipcMain as ipc} from 'electron-better-ipc';

	const window = BrowserWindow.getFocusedWindow();

	(async () => {
		const emoji = await ipc.callRenderer(window!, 'get-emoji', 'unicorn');
		console.log(emoji);
		//=> '🦄'
	})();
	```
	*/
	callRenderer(
		window: BrowserWindow,
		channel: string,
		data?: JsonValue
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
	answerRenderer(
		channel: string,
		callback: (
			data: unknown,
			window: BrowserView
		) => JsonValue | PromiseLike<JsonValue>
	): () => void;

	/**
	Send a message to all renderer processes (windows).

	@param channel - The channel to send the message on.
	@param data - Data to send to the receiver.
	*/
	sendToRenderers(channel: string, data?: JsonValue): void;
}

export interface RendererProcessIpc extends IpcRenderer {
	/**
	Send a message to the main process. Returns a Promise for the response.

	In the main process, use `ipcMain.answerRenderer` to reply to this message.

	@param channel - The channel to send the message on.
	@param data - Data to send to the receiver.

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
	callMain(channel: string, data?: JsonValue): Promise<unknown>;

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
	answerMain(
		channel: string,
		callback: (data?: unknown) => JsonValue | PromiseLike<JsonValue>
	): () => void;
}

export const ipcMain: MainProcessIpc;
export const ipcRenderer: RendererProcessIpc;
