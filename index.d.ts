import {type BrowserWindow, type IpcMain, type IpcRenderer} from 'electron';

export type MainProcessIpc = {
	/**
	Send a message to the given window.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	Rejects with `Browser window required` when `browserWindow` is not given.

	Rejects with `Browser window is destroyed` when the given window is destroyed or has no usable web contents.

	Rejects with `Channel required` when `channel` is not a non-empty string.

	The promise never settles if the renderer does not answer.

	@param browserWindow - The window to send the message to.
	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns The reply from the renderer process.

	@example
	```
	import {BrowserWindow} from 'electron';
	import {ipcMain as ipc} from 'electron-better-ipc';

	const browserWindow = BrowserWindow.getFocusedWindow();

	const emoji = await ipc.callRenderer(browserWindow!, 'get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
	```
	*/
	callRenderer<DataType, ReturnType = unknown>(
		browserWindow: BrowserWindow,
		channel: string,
		data?: DataType
	): Promise<ReturnType>;

	/**
	Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	Rejects with `No browser window in focus` when no window is focused. Use `ipcMain.callRenderer(browserWindow, channel, data?)` to target a window directly instead.

	It also rejects with `Browser window is destroyed` when the focused window is destroyed or has no usable web contents, and with `Channel required` when `channel` is not a non-empty string.

	The promise never settles if the renderer does not answer.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns The reply from the renderer process.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
	```
	*/
	callFocusedRenderer<DataType, ReturnType = unknown>(
		channel: string,
		data?: DataType
	): Promise<ReturnType>;

	/**
	This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

	Registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel. Registering the same channel twice throws.

	@param channel - The channel to send the message on.
	@param callback - The return value is sent back to the `ipcRenderer.callMain` in the renderer process.
	@returns A function that, when called, removes the handler.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	ipc.answerRenderer('get-emoji', async emojiName => {
		const emoji = await getEmoji(emojiName);
		return emoji;
	});
	```
	*/
	answerRenderer<DataType, ReturnType = unknown>(
		channel: string,
		callback: (
			data: DataType,
			browserWindow: BrowserWindow,
		) => ReturnType | PromiseLike<ReturnType>
	): () => void;

	/**
	This method listens for a message from `ipcRenderer.callMain` defined in the given BrowserWindow's renderer process and replies back.

	The `ipcRenderer.callMain` promise rejects with `Message received for a different window` when a renderer other than the given window calls the channel.

	Throws with `Browser window required` when `browserWindow` is not given.

	@param browserWindow - The window for which to expect the message.
	@param channel - The channel to send the message on.
	@param callback - The return value is sent back to the `ipcRenderer.callMain` in the renderer process.
	@returns A function that, when called, removes the handler.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	ipc.answerRenderer(browserWindow, 'get-emoji', async emojiName => {
		const emoji = await getEmoji(emojiName);
		return emoji;
	});
	```
	*/
	answerRenderer<DataType, ReturnType = unknown>(
		browserWindow: BrowserWindow,
		channel: string,
		callback: (
			data: DataType,
			browserWindow: BrowserWindow,
		) => ReturnType | PromiseLike<ReturnType>
	): () => void;

	/**
	Send a message to all renderer processes (windows).

	This is fire-and-forget: there is no reply and no error when there are no windows.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	*/
	sendToRenderers<DataType>(channel: string, data?: DataType): void;
} & IpcMain;

export type RendererProcessIpc = {
	/**
	Send a message to the main process.

	In the main process, use `ipcMain.answerRenderer` to reply to this message.

	Rejects when no handler is registered for the channel, and when a window-scoped handler is called by a different window.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@returns The reply from the main process.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	const emoji = await ipc.callMain('get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
	```
	*/
	callMain<DataType, ReturnType = unknown>(channel: string, data?: DataType): Promise<ReturnType>;

	/**
	This method listens for a message from `ipcMain.callRenderer` defined in the main process and replies back.

	@param channel - The channel to send the message on.
	@param callback - The return value is sent back to the `ipcMain.callRenderer` in the main process.
	@returns A function that, when called, removes the listener.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	ipc.answerMain('get-emoji', async emojiName => {
		const emoji = await getEmoji(emojiName);
		return emoji;
	});
	```
	*/
	answerMain<DataType, ReturnType = unknown>(
		channel: string,
		callback: (data: DataType) => ReturnType | PromiseLike<ReturnType>
	): () => void;
} & IpcRenderer;

export const ipcMain: MainProcessIpc;
export const ipcRenderer: RendererProcessIpc;
