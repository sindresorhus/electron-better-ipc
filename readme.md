# electron-better-ipc

> Simplified IPC communication for Electron apps

## Do you need this module?

The built-in [`ipcMain.handle()`](https://www.electronjs.org/docs/latest/api/ipc-main#ipcmainhandlechannel-listener) and [`ipcRenderer.invoke()`](https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args) already send a message and get the response back in the same call. Use them for the renderer to main direction.

Use this module for what the built-in IPC does not do:

- **Main to renderer.** Send a message from the main process to a renderer and `await` the reply. `webContents.send()` cannot do this. Without this module you would need multiple IPC subscriptions and two extra channels to build it by hand.
- **Complete errors.** When a `handle` listener throws, the renderer gets an error with only the `message` property preserved ([electron#24427](https://github.com/electron/electron/issues/24427)). This module uses [`serialize-error`](https://github.com/sindresorhus/serialize-error), so the whole error object survives in both directions.
- **The `BrowserWindow` that sent the message** is passed to your callback, and the answer methods return a function that removes the handler/listener.

You can use this module in both the main and renderer process. On the renderer side, load it from a preload script that uses [`sandbox: false`](https://www.electronjs.org/docs/latest/tutorial/sandbox) and has the `.mjs` extension. A sandboxed preload cannot load npm modules, and preload scripts ignore `"type": "module"`, so an ES module preload must be `.mjs`.

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

`answerRenderer` registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel and registering the same channel twice throws. Call the function it returns to remove the handler. `callMain` rejects when no handler is registered, and when a window-scoped handler is called by a different window.

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

Use `ipcMain.callRenderer(browserWindow, channel, data?)` to target one specific window instead of the focused one.

## API

The module exports `ipcMain` and `ipcRenderer` objects which enhance the built-in `ipc` module with some added methods, so you can use them as a replacement for `electron.ipcMain`/`electron.ipcRenderer`.

### Main process

#### ipcMain.callRenderer(browserWindow, channel, data?)

Send a message to the given window.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Rejects with `Browser window required` when `browserWindow` is not given.

Rejects with `Browser window is destroyed` when the given window is destroyed or has no usable web contents.

Rejects with `Channel required` when `channel` is not a non-empty string.

The promise never settles if the renderer does not answer.

Returns a `Promise<unknown>` with the reply from the renderer process.

##### browserWindow

Type: `BrowserWindow`

The window to send the message to.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

#### ipcMain.callFocusedRenderer(channel, data?)

Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Rejects with `No browser window in focus` when no window is focused. Use `ipcMain.callRenderer(browserWindow, channel, data?)` to target a window directly instead.

It also rejects with `Browser window is destroyed` when the focused window is destroyed or has no usable web contents, and with `Channel required` when `channel` is not a non-empty string.

The promise never settles if the renderer does not answer.

Returns a `Promise<unknown>` with the reply from the renderer process.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

#### ipcMain.answerRenderer(channel, callback)

This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

Registers an `ipcMain.handle()` handler on the plain channel name, so only one handler can exist per channel. Registering the same channel twice throws.

Returns a function that, when called, removes the handler.

##### channel

Type: `string`

The channel to send the message on.

##### callback(data?, browserWindow)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callMain` in the renderer process.

#### ipcMain.answerRenderer(browserWindow, channel, callback)

This method listens for a message from `ipcRenderer.callMain` defined in the given BrowserWindow's renderer process and replies back.

The `ipcRenderer.callMain` promise rejects with `Message received for a different window` when a renderer other than the given window calls the channel.

Throws with `Browser window required` when `browserWindow` is not given.

Returns a function that, when called, removes the handler.

##### browserWindow

Type: `BrowserWindow`

The window for which to expect the message.

##### channel

Type: `string`

The channel to send the message on.

##### callback(data?, browserWindow)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callMain` in the renderer process.

#### ipcMain.sendToRenderers(channel, data?)

Send a message to all renderer processes (windows).

This is fire-and-forget: there is no reply and no error when there are no windows.

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

Rejects when no handler is registered for the channel, and when a window-scoped handler is called by a different window.

Returns a `Promise<unknown>` with the reply from the main process.

##### channel

Type: `string`

The channel to send the message on.

##### data

Type: `unknown`

The data to send to the receiver.

#### ipcRenderer.answerMain(channel, callback)

This method listens for a message from `ipcMain.callRenderer` defined in the main process and replies back.

Returns a function that, when called, removes the listener.

##### channel

Type: `string`

The channel to send the message on.

##### callback(data?)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcMain.callRenderer` in the main process.

## Related

- [electron-store](https://github.com/sindresorhus/electron-store) - Simple data persistence for your Electron app
- [electron-timber](https://github.com/sindresorhus/electron-timber) - Pretty logger for Electron apps
- [electron-serve](https://github.com/sindresorhus/electron-serve) - Static file serving for Electron apps
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
