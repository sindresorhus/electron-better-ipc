# electron-better-ipc

> Simplified IPC communication for Electron apps

## Do you need this module?

The built-in [`ipcMain.handle()`](https://www.electronjs.org/docs/latest/api/ipc-main#ipcmainhandlechannel-listener) and [`ipcRenderer.invoke()`](https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args) already send a message and get the response back in the same call. Use them for the renderer to main direction.

Use this module for what the built-in IPC does not do:

- **Main to renderer.** Send a message from the main process to a renderer and `await` the reply. `webContents.send()` cannot do this. The call rejects when the renderer has no handler for the channel, or when the page closes, reloads, or crashes before it answers.
- **Renderer to renderer.** Send a message from one page to another by web contents ID and `await` the reply. This works for windows and [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view) pages.
- **Complete errors.** When a `handle` listener throws, the renderer gets an error with only the `message` property preserved ([electron#24427](https://github.com/electron/electron/issues/24427)). This module uses [`serialize-error`](https://github.com/sindresorhus/serialize-error), so the whole error object survives in both directions.
- **The `BrowserWindow` that sent the message** is passed to your callback, and the answer methods return a function that removes the handler.

Import this module in the main process and in the preload script of each window that uses it.

If you bundle the preload script (for example with [electron-vite](https://electron-vite.org) or webpack), it works with the default [sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox). Without a bundler, the preload script must use `sandbox: false`, since a sandboxed preload cannot load npm modules, and it must have the `.mjs` extension, since preload scripts ignore `"type": "module"`.

## Install

```sh
npm install electron-better-ipc
```

*Requires Electron 44 or later.*

This package is an ES module, so load it with `import`.

## Usage

### Renderer to main

#### Built-in IPC

Use the built-in IPC for this direction.

##### Main (built-in)

```js
import {ipcMain} from 'electron';

ipcMain.handle('get-emoji', async (event, emojiName) => {
	return getEmoji(emojiName);
});
```

##### Renderer (built-in)

```js
import {ipcRenderer} from 'electron';

const emoji = await ipcRenderer.invoke('get-emoji', 'unicorn');
console.log(emoji);
//=> '🦄'
```

#### This module (renderer to main)

Use `ipcMain.answerRenderer` and `ipcRenderer.callMain` if you want the complete error object or the `BrowserWindow` in the callback.

`answerRenderer` registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel and registering the same channel twice throws. Call the function it returns to remove the handler. `callMain` rejects when no handler is registered.

##### Main (answerRenderer)

```js
import {ipcMain as ipc} from 'electron-better-ipc';

ipc.answerRenderer('get-emoji', async (emojiName, browserWindow) => {
	return getEmoji(emojiName);
});
```

##### Renderer (callMain)

```js
import {ipcRenderer as ipc} from 'electron-better-ipc';

const emoji = await ipc.callMain('get-emoji', 'unicorn');
console.log(emoji);
//=> '🦄'
```

### Main to renderer

The built-in IPC has no equal for this direction, since `webContents.send()` cannot wait for a reply.

#### This module (main to renderer)

`ipcMain.callRenderer`, `ipcMain.callFocusedRenderer`, and `ipcRenderer.answerMain` cover it.

##### Main (callFocusedRenderer)

```js
import {ipcMain as ipc} from 'electron-better-ipc';

const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn');
console.log(emoji);
//=> '🦄'
```

##### Renderer (answerMain)

```js
import {ipcRenderer as ipc} from 'electron-better-ipc';

ipc.answerMain('get-emoji', async emojiName => {
	return getEmoji(emojiName);
});
```

Use `ipcMain.callRenderer(target, channel, data?)` to target one specific window, or the web contents of a `WebContentsView`, instead of the focused one.

### Renderer to renderer

`ipcRenderer.callRenderer` and `ipcRenderer.answerRenderer` cover it. The main process passes the call on to the target page, so it must import this module. The target page then replies to the caller directly.

Pages are identified by their [`WebContents#id`](https://www.electronjs.org/docs/latest/api/web-contents#contentsid-readonly), for example `browserWindow.webContents.id` or `view.webContents.id`. This is not the `BrowserWindow#id`. A renderer cannot get these IDs by itself, so get them from the main process.

##### Main

```js
import {ipcMain as ipc} from 'electron-better-ipc';

ipc.answerRenderer('get-editor-id', () => editorWindow.webContents.id);
```

##### Renderer (callRenderer)

```js
import {ipcRenderer as ipc} from 'electron-better-ipc';

const editorId = await ipc.callMain('get-editor-id');

const text = await ipc.callRenderer(editorId, 'get-selected-text');
```

##### Renderer (answerRenderer)

```js
import {ipcRenderer as ipc} from 'electron-better-ipc';

ipc.answerRenderer('get-selected-text', (data, webContentsId) => {
	return document.getSelection().toString();
});
```

`answerRenderer` and `answerMain` use separate channels, so a renderer cannot call an `answerMain` handler in another page.

### Context isolation

With [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) (the default), the web page cannot import this module. Use it in the preload script, and expose only the functions the page needs with [`contextBridge`](https://www.electronjs.org/docs/latest/api/context-bridge). Do not expose the IPC objects themselves, since the page could then call any channel.

```js
// preload.mjs
import {contextBridge} from 'electron';
import {ipcRenderer as ipc} from 'electron-better-ipc';

contextBridge.exposeInMainWorld('app', {
	getEmoji: emojiName => ipc.callMain('get-emoji', emojiName),
});

ipc.answerMain('get-title', () => document.title);
```

```js
// In the web page
const emoji = await window.app.getEmoji('unicorn');
```

### TypeScript

Use `TypedMainProcessIpc` and `TypedRendererProcessIpc` to get strictly typed channels. Describe all channels in one type, in up to three groups, and share it between the main and renderer code. Describe each channel as a method that takes at most one parameter, the data.

- `main`: The channels the main process answers (`ipcMain.answerRenderer`/`ipcRenderer.callMain`).
- `renderer`: The channels a renderer process answers for the main process (`ipcRenderer.answerMain`/`ipcMain.callRenderer`).
- `rendererToRenderer`: The channels a renderer process answers for other renderer processes (`ipcRenderer.answerRenderer`/`ipcRenderer.callRenderer`).

Leave out a group that has no channels.

Answer registrations require a single channel key. Narrow union channels before registering a callback.

Typed IPC objects require matching schemas when assigned to each other.

The types are not checked at runtime.

#### Shared (channels.ts)

```ts
export type Channels = {
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
```

#### Main (TypedMainProcessIpc)

```ts
import {ipcMain, type TypedMainProcessIpc} from 'electron-better-ipc';
import type {Channels} from './channels.js';

const ipc: TypedMainProcessIpc<Channels> = ipcMain;

ipc.answerRenderer('get-emoji', async emojiName => getEmoji(emojiName));

ipc.answerRenderer('get-editor-id', () => editorWindow.webContents.id);

const title = await ipc.callFocusedRenderer('get-title');
```

`sendToRenderers` is not strictly typed, since it sends a plain event that is not answered.

#### Renderer (TypedRendererProcessIpc)

```ts
import {ipcRenderer, type TypedRendererProcessIpc} from 'electron-better-ipc';
import type {Channels} from './channels.js';

const ipc: TypedRendererProcessIpc<Channels> = ipcRenderer;

ipc.answerMain('get-title', () => document.title);

const emoji = await ipc.callMain('get-emoji', 'unicorn');

const editorId = await ipc.callMain('get-editor-id');

const text = await ipc.callRenderer(editorId, 'get-selected-text');
```

## API

The module exports `ipcMain` and `ipcRenderer` objects which enhance the built-in ones with some added methods, so you can use them as a replacement for `electron.ipcMain`/`electron.ipcRenderer`.

### Main process

#### ipcMain.callRenderer(target, channel, data?, options?)

Send a message to the given window or web contents.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Rejects with `Browser window required` when `target` is not given.

Rejects with `Browser window is destroyed` when the target is destroyed.

Rejects with `Channel required` when `channel` is not a non-empty string.

Rejects with `No handler registered for '…'` when the renderer has no `ipcRenderer.answerMain` handler for the channel.

Rejects with `Page closed, reloaded, or crashed before answering` when the page goes away during the call.

The promise might never settle if the renderer never loaded this module or the handler never returns. Use the [`signal`](#signal) option to stop waiting.

Returns a `Promise<unknown>` with the reply from the renderer process.

##### target

Type: `BrowserWindow | WebContents`

The window to send the message to, or its web contents. Pass the web contents of a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view) to call a view.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

##### options

Type: `object`

###### signal

Type: [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

Cancel the call.

When the signal aborts, the promise rejects with `signal.reason`. The target renderer still runs its answer callback, but the reply is ignored.

Use [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) to stop waiting after some time. Pass `undefined` as `data` if the channel takes no data.

```js
import {ipcMain as ipc} from 'electron-better-ipc';

const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn', {signal: AbortSignal.timeout(5000)});
```

#### ipcMain.callFocusedRenderer(channel, data?, options?)

Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Rejects with `No browser window in focus` when no window is focused. Use `ipcMain.callRenderer(target, channel, data?)` to target a window directly instead.

Rejects with `Channel required` when `channel` is not a non-empty string.

Rejects with `No handler registered for '…'` when the renderer has no `ipcRenderer.answerMain` handler for the channel.

Rejects with `Page closed, reloaded, or crashed before answering` when the page goes away during the call.

The promise might never settle if the renderer never loaded this module or the handler never returns. Use the [`signal`](#signal) option to stop waiting.

Returns a `Promise<unknown>` with the reply from the renderer process.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

##### options

Type: `object`

The same options as [`ipcMain.callRenderer`](#options).

#### ipcMain.answerRenderer(channel, callback)

This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

Registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel. Registering the same channel twice throws.

Returns a function that, when called, removes the handler.

##### channel

Type: `string`

The channel to answer on.

##### callback(data?, browserWindow)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callMain` in the renderer process.

`browserWindow` is the window of the sender. For a sender in a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view), it is the window that contains the view, which is a `BaseWindow` when the view is in a `BaseWindow`. It is `undefined` when the sender is not in a window.

#### ipcMain.sendToRenderers(channel, data?)

Send a message to all renderer processes (windows).

This is fire-and-forget: there is no reply and no error when there are no windows.

The message is sent on the plain channel name, like `webContents.send()`. In the renderer process, use `ipcRenderer.on(channel, (event, data) => {})` to receive it. `ipcRenderer.answerMain` does not receive it.

Pages in a [`WebContentsView`](https://www.electronjs.org/docs/latest/api/web-contents-view) do not receive it. Use `view.webContents.send()` for those.

To get a reply from every window, use `ipcMain.callRenderer` for each window instead.

```js
import {BrowserWindow} from 'electron';
import {ipcMain as ipc} from 'electron-better-ipc';

ipc.sendToRenderers('theme-changed', 'dark');

const titles = await Promise.all(BrowserWindow.getAllWindows().map(browserWindow => ipc.callRenderer(browserWindow, 'get-title')));
```

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

### Renderer process

#### ipcRenderer.callMain(channel, data?)

Send a message to the main process.

In the main process, use `ipcMain.answerRenderer` to reply to this message.

Rejects when no handler is registered for the channel.

Returns a `Promise<unknown>` with the reply from the main process.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

#### ipcRenderer.answerMain(channel, callback)

This method listens for a message from `ipcMain.callRenderer` or `ipcMain.callFocusedRenderer` defined in the main process and replies back.

Only one handler can exist per channel. Registering the same channel twice throws.

It does not receive messages from `ipcMain.sendToRenderers`. Use `ipcRenderer.on` for those.

Returns a function that, when called, removes the handler.

##### channel

Type: `string`

The channel to answer on.

##### callback(data?)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcMain.callRenderer` in the main process.

#### ipcRenderer.callRenderer(webContentsId, channel, data?, options?)

Send a message to the page with the given web contents ID.

In the target renderer process, use `ipcRenderer.answerRenderer` to reply to this message. `ipcRenderer.answerMain` does not receive it.

The main process forwards the message, so it must import this module.

Rejects with `Web contents ID required` when `webContentsId` is not a safe integer, with `No web contents with ID …` when no page has the given ID, and with `Channel required` when `channel` is not a non-empty string.

Rejects with `No handler registered for '…'` when the target renderer has no `ipcRenderer.answerRenderer` handler for the channel.

Rejects with `Page closed, reloaded, or crashed before answering` when the target page goes away during the call.

The promise might never settle if the main process or the target renderer never loaded this module, or the handler never returns. Use the [`signal`](#signal) option to stop waiting.

Returns a `Promise<unknown>` with the reply from the target renderer process.

##### webContentsId

Type: `number`

The [`WebContents#id`](https://www.electronjs.org/docs/latest/api/web-contents#contentsid-readonly) of the page to send the message to, for example `browserWindow.webContents.id` or `view.webContents.id`. It is not the `BrowserWindow#id`.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

##### options

Type: `object`

The same options as [`ipcMain.callRenderer`](#options).

#### ipcRenderer.answerRenderer(channel, callback)

This method listens for a message from `ipcRenderer.callRenderer` defined in another renderer process and replies back.

Any renderer process that uses this module can call the channel. Use the `webContentsId` callback parameter to check the sender if that matters.

Only one handler can exist per channel. Registering the same channel twice throws. The channels are separate from the `ipcRenderer.answerMain` channels.

Returns a function that, when called, removes the handler.

##### channel

Type: `string`

The channel to answer on.

##### callback(data?, webContentsId)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callRenderer` in the other renderer process. `webContentsId` is the web contents ID of the sender, which you can pass to `ipcRenderer.callRenderer` to call it back.

## Related

- [electron-store](https://github.com/sindresorhus/electron-store) - Simple data persistence for your Electron app
- [electron-timber](https://github.com/sindresorhus/electron-timber) - Pretty logger for Electron apps
- [electron-serve](https://github.com/sindresorhus/electron-serve) - Static file serving for Electron apps
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
