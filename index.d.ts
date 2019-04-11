import {JsonValue} from 'type-fest';
import {BrowserWindow, BrowserView, IpcMain, IpcRenderer} from 'electron';

declare namespace ipc {
	interface MainProcessIpc extends IpcMain {
		/**
		Send a message to the given window.

		In the renderer process, use `ipc.answerMain` to reply to this message.

		@param window - The window to send the message to.
		@param channel - The channel to send the message on.
		@param data - Data to send to the receiver.

		@example
		```
		import {BrowserWindow} from 'electron';
		import * as betterIpc from 'electron-better-ipc';

		const ipc: betterIpc.MainProcessIpc = betterIpc;
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
		): Promise<JsonValue>;

		/**
		This method listens for a message from `ipc.callMain` defined in a renderer process and replies back.

		@param channel - The channel to send the message on.
		@param callback - The return value is sent back to the `ipc.callMain` in the renderer process.
		@returns A function, that when called, removes the listener.

		@example
		```
		import * as betterIpc from 'electron-better-ipc';

		const ipc: betterIpc.MainProcessIpc = betterIpc;

		ipc.answerRenderer('get-emoji', async emojiName => {
			const emoji = await getEmoji(emojiName);
			return emoji;
		});
		```
		*/
		answerRenderer(
			channel: string,
			callback: (
				data: JsonValue | undefined,
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

	interface RendererProcessIpc extends IpcRenderer {
		/**
		Send a message to the main process. Returns a Promise for the response.

		In the main process, use `ipc.answerRenderer` to reply to this message.

		@param channel - The channel to send the message on.
		@param data - Data to send to the receiver.

		@example
		```
		import * as betterIpc from 'electron-better-ipc';

		const ipc: betterIpc.RendererProcessIpc = betterIpc;

		(async () => {
			const emoji = await ipc.callMain('get-emoji', 'unicorn');
			console.log(emoji);
			//=> '🦄'
		})();
		```
		*/
		callMain(channel: string, data?: JsonValue): Promise<JsonValue>;

		/**
		This method listens for a message from `ipc.callRenderer` defined in the main process and replies back.

		@param channel - The channel to send the message on.
		@param callback - The return value is sent back to the `ipc.callRenderer` in the main process.
		@returns A function, that when called, removes the listener.

		@example
		```
		import * as betterIpc from 'electron-better-ipc';

		const ipc: betterIpc.RendererProcessIpc = betterIpc;

		ipc.answerMain('get-emoji', async emojiName => {
			const emoji = await getEmoji(emojiName);
			return emoji;
		});
		```
		*/
		answerMain(
			channel: string,
			callback: (data?: JsonValue) => JsonValue | PromiseLike<JsonValue>
		): () => void;
	}
}

declare const ipc: ipc.MainProcessIpc & ipc.RendererProcessIpc;

export = ipc;
