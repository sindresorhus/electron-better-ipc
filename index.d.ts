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

	The message is sent on the plain channel name, like `webContents.send()`. In the renderer process, use `ipcRenderer.on(channel, (event, data) => {})` to receive it. `ipcRenderer.answerMain` does not receive it.

	To get a reply from every window, use `ipcMain.callRenderer` for each window instead. The promise never settles if a window does not answer.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.

	@example
	```
	import {BrowserWindow} from 'electron';
	import {ipcMain as ipc} from 'electron-better-ipc';

	ipc.sendToRenderers('theme-changed', 'dark');

	const titles = await Promise.all(BrowserWindow.getAllWindows().map(browserWindow => ipc.callRenderer(browserWindow, 'get-title')));
	```
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
	This method listens for a message from `ipcMain.callRenderer` or `ipcMain.callFocusedRenderer` defined in the main process and replies back.

	It does not receive messages from `ipcMain.sendToRenderers`. Use `ipcRenderer.on` for those.

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

// Not `Parameters`, so that `ipcMain`/`ipcRenderer` stay assignable when a side has no channels.
type DataArguments<Handler> = Handler extends (...data: infer Arguments extends [data?: unknown]) => unknown ? Arguments : never;

type CallArguments<Schema> = {[Channel in keyof Schema & string]: [channel: Channel, ...data: DataArguments<Schema[Channel]>]}[keyof Schema & string];

type Channels<Schema> = {[Channel in keyof Schema]: (data: any) => unknown};

type Reply<Handler extends (data: any) => unknown> = Awaited<ReturnType<Handler>>;

type Answer<Handler extends (data: any) => unknown> = Reply<Handler> | PromiseLike<Reply<Handler>>;

type SingleChannel<Channel, AllChannels = Channel> = Channel extends unknown ? [AllChannels] extends [Channel] ? Channel : never : never;

declare const ipcSchema: unique symbol;

type Contracts<Schema extends Channels<Schema>> = {[Channel in keyof Schema & string]: [channel: Channel, data: DataArguments<Schema[Channel]>, reply: Reply<Schema[Channel]>]}[keyof Schema & string];

// Keep schemas invariant without requiring a runtime property on the untyped IPC objects.
type IpcSchema<Schema> = {
	readonly [ipcSchema]?: (schema: Schema) => Schema;
};

/**
A strictly typed version of `ipcMain`.

Describe each channel as a method that takes at most one parameter, the data. `MainChannels` are the channels the main process answers (`answerRenderer`/`callMain`). `RendererChannels` are the channels the renderer process answers (`answerMain`/`callRenderer`).

Use `Record<never, never>` for a side that answers no channels.

Answer registrations require a single channel key. Narrow union channels before registering a callback.

Typed IPC objects require matching channel contracts when assigned to each other.

The types are not checked at runtime. `sendToRenderers` is not strictly typed, since it sends a plain event that is not answered.

@example
```
import {ipcMain, type TypedMainProcessIpc} from 'electron-better-ipc';

type MainChannels = {
	'get-emoji'(name: string): string;
};

type RendererChannels = {
	'get-title'(): string;
};

const ipc: TypedMainProcessIpc<MainChannels, RendererChannels> = ipcMain;

ipc.answerRenderer('get-emoji', async emojiName => getEmoji(emojiName));

const title = await ipc.callFocusedRenderer('get-title');
```
*/
export type TypedMainProcessIpc<
	MainChannels extends Channels<MainChannels>,
	RendererChannels extends Channels<RendererChannels>,
> = {
	callRenderer<Arguments extends CallArguments<RendererChannels>>(
		browserWindow: BrowserWindow,
		...arguments_: Arguments
	): Promise<Reply<RendererChannels[Arguments[0]]>>;

	callFocusedRenderer<Arguments extends CallArguments<RendererChannels>>(
		...arguments_: Arguments
	): Promise<Reply<RendererChannels[Arguments[0]]>>;

	answerRenderer<Channel extends keyof MainChannels & string>(
		channel: Channel & SingleChannel<Channel>,
		callback: (
			data: Parameters<MainChannels[Channel]>[0],
			browserWindow: BrowserWindow,
		) => Answer<MainChannels[Channel]>
	): () => void;

	answerRenderer<Channel extends keyof MainChannels & string>(
		browserWindow: BrowserWindow,
		channel: Channel & SingleChannel<Channel>,
		callback: (
			data: Parameters<MainChannels[Channel]>[0],
			browserWindow: BrowserWindow,
		) => Answer<MainChannels[Channel]>
	): () => void;
} & IpcSchema<[Contracts<MainChannels>, Contracts<RendererChannels>]> & Pick<MainProcessIpc, 'sendToRenderers'> & IpcMain;

/**
A strictly typed version of `ipcRenderer`.

Describe each channel as a method that takes at most one parameter, the data. `MainChannels` are the channels the main process answers (`answerRenderer`/`callMain`). `RendererChannels` are the channels the renderer process answers (`answerMain`/`callRenderer`).

Use `Record<never, never>` for a side that answers no channels.

Answer registrations require a single channel key. Narrow union channels before registering a callback.

Typed IPC objects require matching channel contracts when assigned to each other.

The types are not checked at runtime.

@example
```
import {ipcRenderer, type TypedRendererProcessIpc} from 'electron-better-ipc';

type MainChannels = {
	'get-emoji'(name: string): string;
};

type RendererChannels = {
	'get-title'(): string;
};

const ipc: TypedRendererProcessIpc<MainChannels, RendererChannels> = ipcRenderer;

ipc.answerMain('get-title', () => document.title);

const emoji = await ipc.callMain('get-emoji', 'unicorn');
```
*/
export type TypedRendererProcessIpc<
	MainChannels extends Channels<MainChannels>,
	RendererChannels extends Channels<RendererChannels>,
> = {
	callMain<Arguments extends CallArguments<MainChannels>>(
		...arguments_: Arguments
	): Promise<Reply<MainChannels[Arguments[0]]>>;

	answerMain<Channel extends keyof RendererChannels & string>(
		channel: Channel & SingleChannel<Channel>,
		callback: (data: Parameters<RendererChannels[Channel]>[0]) => Answer<RendererChannels[Channel]>
	): () => void;
} & IpcSchema<[Contracts<MainChannels>, Contracts<RendererChannels>]> & IpcRenderer;

export const ipcMain: MainProcessIpc;
export const ipcRenderer: RendererProcessIpc;
