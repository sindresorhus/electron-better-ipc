import {
	type BrowserWindow,
	type IpcMain,
	type IpcRenderer,
	type WebContents,
} from 'electron';

export type CallRendererOptions = {
	/**
	An [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to cancel the call.

	When the signal aborts, the promise rejects with `signal.reason`. The target renderer still runs its answer callback, but the reply is ignored.

	Use [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) to stop waiting after some time. Pass `undefined` as `data` if the channel takes no data.

	@example
	```
	import {ipcMain as ipc} from 'electron-better-ipc';

	const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn', {signal: AbortSignal.timeout(5000)});
	```
	*/
	readonly signal?: AbortSignal;
};

export type MainProcessIpc = {
	/**
	Send a message to the given window or web contents.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	Rejects with `Browser window required` when `target` is not given.

	Rejects with `Browser window is destroyed` when the target is destroyed.

	Rejects with `Channel required` when `channel` is not a non-empty string.

	Rejects with `No handler registered for '…'` when the renderer has no `ipcRenderer.answerMain` handler for the channel.

	Rejects with `Page closed, reloaded, or crashed before answering` when the page goes away during the call.

	The promise might never settle if the renderer never loaded this module or the handler never returns. Use the `signal` option to stop waiting.

	@param target - The window to send the message to, or its web contents. Pass the web contents of a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view) to call a view.
	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@param options - Options for the call. See `CallRendererOptions`.
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
		target: BrowserWindow | WebContents,
		channel: string,
		data?: DataType,
		options?: CallRendererOptions
	): Promise<ReturnType>;

	/**
	Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

	In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

	Rejects with `No browser window in focus` when no window is focused. Use `ipcMain.callRenderer(target, channel, data?)` to target a window directly instead.

	Rejects with `Channel required` when `channel` is not a non-empty string.

	Rejects with `No handler registered for '…'` when the renderer has no `ipcRenderer.answerMain` handler for the channel.

	Rejects with `Page closed, reloaded, or crashed before answering` when the page goes away during the call.

	The promise might never settle if the renderer never loaded this module or the handler never returns. Use the `signal` option to stop waiting.

	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@param options - Options for the call. See `CallRendererOptions`.
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
		data?: DataType,
		options?: CallRendererOptions
	): Promise<ReturnType>;

	/**
	This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

	Registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel. Registering the same channel twice throws.

	@param channel - The channel to answer on.
	@param callback - The return value is sent back to the `ipcRenderer.callMain` in the renderer process. The second parameter is the window of the sender. For a sender in a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view), it is the window that contains the view, which is a `BaseWindow` when the view is in a `BaseWindow`. It is `undefined` when the sender is not in a window.
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
			browserWindow: BrowserWindow | undefined,
		) => ReturnType | PromiseLike<ReturnType>
	): () => void;

	/**
	Send a message to all renderer processes (windows).

	This is fire-and-forget: there is no reply and no error when there are no windows.

	The message is sent on the plain channel name, like `webContents.send()`. In the renderer process, use `ipcRenderer.on(channel, (event, data) => {})` to receive it. `ipcRenderer.answerMain` does not receive it.

	Pages in a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view) do not receive it. Use `view.webContents.send()` for those.

	To get a reply from every window, use `ipcMain.callRenderer` for each window instead.

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

	Rejects when no handler is registered for the channel.

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

	Only one handler can exist per channel. Registering the same channel twice throws.

	It does not receive messages from `ipcMain.sendToRenderers`. Use `ipcRenderer.on` for those.

	@param channel - The channel to answer on.
	@param callback - The return value is sent back to the `ipcMain.callRenderer` in the main process.
	@returns A function that, when called, removes the handler.

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

	/**
	Send a message to the page with the given web contents ID.

	In the target renderer process, use `ipcRenderer.answerRenderer` to reply to this message. `ipcRenderer.answerMain` does not receive it.

	The main process forwards the message, so it must import this module.

	Rejects with `Web contents ID required` when `webContentsId` is not a safe integer, with `No web contents with ID …` when no page has the given ID, and with `Channel required` when `channel` is not a non-empty string.

	Rejects with `No handler registered for '…'` when the target renderer has no `ipcRenderer.answerRenderer` handler for the channel.

	Rejects with `Page closed, reloaded, or crashed before answering` when the target page goes away during the call.

	The promise might never settle if the main process or the target renderer never loaded this module, or the handler never returns. Use the `signal` option to stop waiting.

	@param webContentsId - The [`WebContents#id`](https://www.electronjs.org/docs/latest/api/web-contents#contentsid-readonly) of the page to send the message to, for example `browserWindow.webContents.id` or `view.webContents.id`. It is not the `BrowserWindow#id`.
	@param channel - The channel to send the message on.
	@param data - The data to send to the receiver.
	@param options - Options for the call. See `CallRendererOptions`.
	@returns The reply from the target renderer process.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	const editorId = await ipc.callMain('get-editor-id');

	const text = await ipc.callRenderer(editorId, 'get-selected-text');
	```
	*/
	callRenderer<DataType, ReturnType = unknown>(
		webContentsId: number,
		channel: string,
		data?: DataType,
		options?: CallRendererOptions
	): Promise<ReturnType>;

	/**
	This method listens for a message from `ipcRenderer.callRenderer` defined in another renderer process and replies back.

	Any renderer process that uses this module can call the channel. Use the `webContentsId` callback parameter to check the sender if that matters.

	Only one handler can exist per channel. Registering the same channel twice throws. The channels are separate from the `ipcRenderer.answerMain` channels.

	@param channel - The channel to answer on.
	@param callback - The return value is sent back to the `ipcRenderer.callRenderer` in the other renderer process. The second parameter is the web contents ID of the sender, which you can pass to `ipcRenderer.callRenderer` to call it back.
	@returns A function that, when called, removes the handler.

	@example
	```
	import {ipcRenderer as ipc} from 'electron-better-ipc';

	ipc.answerRenderer('get-selected-text', (data, webContentsId) => {
		return document.getSelection().toString();
	});
	```
	*/
	answerRenderer<DataType, ReturnType = unknown>(
		channel: string,
		callback: (
			data: DataType,
			webContentsId: number,
		) => ReturnType | PromiseLike<ReturnType>
	): () => void;
} & IpcRenderer;

// Not `Parameters`, so that `ipcMain`/`ipcRenderer` stay assignable when a side has no channels.
type DataArguments<Handler> = Handler extends (...data: infer Arguments extends [data?: unknown]) => unknown ? Arguments : never;

type CallArguments<Schema> = {[Channel in keyof Schema & string]: [channel: Channel, ...data: DataArguments<Schema[Channel]>]}[keyof Schema & string];

type Data<Handler> = DataArguments<Handler>[0];

// The options come after the data, so channels without data take `undefined` in its place.
type CallRendererArguments<Schema> = CallArguments<Schema> | {
	[Channel in keyof Schema & string]: [channel: Channel, data: Data<Schema[Channel]>, options?: CallRendererOptions];
}[keyof Schema & string];

type Channels<Schema> = {[Channel in keyof Schema]: (data: any) => unknown};

type Reply<Handler> = Handler extends (data: any) => infer Value ? Awaited<Value> : never;

type Answer<Handler> = Reply<Handler> | PromiseLike<Reply<Handler>>;

type SingleChannel<Channel, AllChannels = Channel> = Channel extends unknown ? [AllChannels] extends [Channel] ? Channel : never : never;

type ChannelGroupName = 'main' | 'renderer' | 'rendererToRenderer';

type ChannelGroup<Schema, Group extends ChannelGroupName> = Group extends keyof Schema ? Exclude<Schema[Group], undefined> : Record<never, never>;

// Refers to `Schema` itself, so that every channel must take at most one parameter. Unknown group names are rejected to catch typos.
type ChannelSchema<Schema> = {
	[Group in ChannelGroupName]?: Channels<ChannelGroup<Schema, Group>>;
} & Record<Exclude<keyof Schema, ChannelGroupName>, never>;

declare const ipcSchema: unique symbol;

type Contracts<Schema> = {[Channel in keyof Schema & string]: [channel: Channel, data: DataArguments<Schema[Channel]>, reply: Reply<Schema[Channel]>]}[keyof Schema & string];

// Keep schemas invariant without requiring a runtime property on the untyped IPC objects.
type IpcSchema<Schema> = {
	readonly [ipcSchema]?: (schema: Schema) => Schema;
};

type SchemaContracts<Schema> = IpcSchema<[
	Contracts<ChannelGroup<Schema, 'main'>>,
	Contracts<ChannelGroup<Schema, 'renderer'>>,
	Contracts<ChannelGroup<Schema, 'rendererToRenderer'>>,
]>;

type TypedMainMethods<MainChannels, RendererChannels> = {
	callRenderer<Arguments extends CallRendererArguments<RendererChannels>>(
		target: BrowserWindow | WebContents,
		...arguments_: Arguments
	): Promise<Reply<RendererChannels[Arguments[0] & keyof RendererChannels]>>;

	callFocusedRenderer<Arguments extends CallRendererArguments<RendererChannels>>(
		...arguments_: Arguments
	): Promise<Reply<RendererChannels[Arguments[0] & keyof RendererChannels]>>;

	answerRenderer<Channel extends keyof MainChannels & string>(
		channel: Channel & SingleChannel<Channel>,
		callback: (
			data: Data<MainChannels[Channel]>,
			browserWindow: BrowserWindow | undefined,
		) => Answer<MainChannels[Channel]>
	): () => void;
};

type TypedRendererMethods<MainChannels, RendererChannels, RendererToRendererChannels> = {
	callMain<Arguments extends CallArguments<MainChannels>>(
		...arguments_: Arguments
	): Promise<Reply<MainChannels[Arguments[0] & keyof MainChannels]>>;

	answerMain<Channel extends keyof RendererChannels & string>(
		channel: Channel & SingleChannel<Channel>,
		callback: (data: Data<RendererChannels[Channel]>) => Answer<RendererChannels[Channel]>
	): () => void;

	callRenderer<Arguments extends CallRendererArguments<RendererToRendererChannels>>(
		webContentsId: number,
		...arguments_: Arguments
	): Promise<Reply<RendererToRendererChannels[Arguments[0] & keyof RendererToRendererChannels]>>;

	answerRenderer<Channel extends keyof RendererToRendererChannels & string>(
		channel: Channel & SingleChannel<Channel>,
		callback: (
			data: Data<RendererToRendererChannels[Channel]>,
			webContentsId: number,
		) => Answer<RendererToRendererChannels[Channel]>
	): () => void;
};

/**
A strictly typed version of `ipcMain`.

`Schema` describes all channels in up to three groups. Share it between the main and renderer code. Describe each channel as a method that takes at most one parameter, the data.

- `main`: The channels the main process answers (`ipcMain.answerRenderer`/`ipcRenderer.callMain`).
- `renderer`: The channels a renderer process answers for the main process (`ipcRenderer.answerMain`/`ipcMain.callRenderer`).
- `rendererToRenderer`: The channels a renderer process answers for other renderer processes (`ipcRenderer.answerRenderer`/`ipcRenderer.callRenderer`).

Leave out a group that has no channels.

Answer registrations require a single channel key. Narrow union channels before registering a callback.

Typed IPC objects require matching schemas when assigned to each other.

The types are not checked at runtime. `sendToRenderers` is not strictly typed, since it sends a plain event that is not answered.

@example
```
import {ipcMain, type TypedMainProcessIpc} from 'electron-better-ipc';

type Channels = {
	main: {
		'get-emoji'(name: string): string;
		'get-editor-id'(): number;
	};
	renderer: {
		'get-title'(): string;
	};
	rendererToRenderer: {
		'get-selected-text'(): string;
	};
};

const ipc: TypedMainProcessIpc<Channels> = ipcMain;

ipc.answerRenderer('get-emoji', async emojiName => getEmoji(emojiName));

ipc.answerRenderer('get-editor-id', () => editorWindow.webContents.id);

const title = await ipc.callFocusedRenderer('get-title');
```
*/
export type TypedMainProcessIpc<Schema extends ChannelSchema<Schema>> = TypedMainMethods<
	ChannelGroup<Schema, 'main'>,
	ChannelGroup<Schema, 'renderer'>
> & SchemaContracts<Schema> & Pick<MainProcessIpc, 'sendToRenderers'> & IpcMain;

/**
A strictly typed version of `ipcRenderer`.

`Schema` describes all channels in up to three groups. Share it between the main and renderer code. Describe each channel as a method that takes at most one parameter, the data.

- `main`: The channels the main process answers (`ipcMain.answerRenderer`/`ipcRenderer.callMain`).
- `renderer`: The channels a renderer process answers for the main process (`ipcRenderer.answerMain`/`ipcMain.callRenderer`).
- `rendererToRenderer`: The channels a renderer process answers for other renderer processes (`ipcRenderer.answerRenderer`/`ipcRenderer.callRenderer`).

Leave out a group that has no channels.

Answer registrations require a single channel key. Narrow union channels before registering a callback.

Typed IPC objects require matching schemas when assigned to each other.

The types are not checked at runtime.

@example
```
import {ipcRenderer, type TypedRendererProcessIpc} from 'electron-better-ipc';

type Channels = {
	main: {
		'get-emoji'(name: string): string;
		'get-editor-id'(): number;
	};
	renderer: {
		'get-title'(): string;
	};
	rendererToRenderer: {
		'get-selected-text'(): string;
	};
};

const ipc: TypedRendererProcessIpc<Channels> = ipcRenderer;

ipc.answerMain('get-title', () => document.title);

const emoji = await ipc.callMain('get-emoji', 'unicorn');

const editorId = await ipc.callMain('get-editor-id');

const text = await ipc.callRenderer(editorId, 'get-selected-text');
```
*/
export type TypedRendererProcessIpc<Schema extends ChannelSchema<Schema>> = TypedRendererMethods<
	ChannelGroup<Schema, 'main'>,
	ChannelGroup<Schema, 'renderer'>,
	ChannelGroup<Schema, 'rendererToRenderer'>
> & SchemaContracts<Schema> & IpcRenderer;

export const ipcMain: MainProcessIpc;
export const ipcRenderer: RendererProcessIpc;
