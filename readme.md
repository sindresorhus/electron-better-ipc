# electron-better-ipc [![Build Status](https://travis-ci.org/sindresorhus/electron-better-ipc.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-better-ipc)

> Simplified IPC communication for Electron apps

The biggest benefit of this module over the [built-in IPC](https://electronjs.org/docs/api/ipc-main) is that it enables you to send a message and get the response back in the same call. This would usually require multiple IPC subscriptions.

You can use this module directly in both the main and renderer process.

## Install

```
$ npm install electron-better-ipc
```

*Requires Electron 5 or later.*

## Usage

### Using the built-in IPC

Here, as an example, we use the built-in IPC to get an emoji by name in the renderer process from the main process. Notice how it requires coordinating multiple IPC subscriptions.

###### Main

```js
const {ipcMain: ipc} = require('electron');

ipc.on('get-emoji', async (event, emojiName) => {
	const emoji = await getEmoji(emojiName);
	event.sender.send('get-emoji-response', emoji);
});
```

###### Renderer

```js
const {ipcRenderer: ipc} = require('electron');

ipc.on('get-emoji-response', (event, emoji) => {
	console.log(emoji);
	//=> '🦄'
});

ipc.send('get-emoji', 'unicorn');
```

### Using this module

As you can see below, this module makes it much simpler to handle the communication. You no longer need multiple IPC subscriptions and you can just `await` the response in the same call.

###### Main

```js
const {ipcMain: ipc} = require('electron-better-ipc');

ipc.answerRenderer('get-emoji', async emojiName => {
	const emoji = await getEmoji(emojiName);
	return emoji;
});
```

###### Renderer

```js
const {ipcRenderer: ipc} = require('electron-better-ipc');

(async () => {
	const emoji = await ipc.callMain('get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
})();
```

Here we do the inverse of the above, we get an emoji by name in the main process from the renderer process:

###### Renderer

```js
const {ipcRenderer: ipc} = require('electron-better-ipc');

ipc.answerMain('get-emoji', async emojiName => {
	const emoji = await getEmoji(emojiName);
	return emoji;
});
```

###### Main

```js
const {ipcMain: ipc} = require('electron-better-ipc');

(async () => {
	const emoji = await ipc.callFocusedRenderer('get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
})();
```

## API

The module exports `ipcMain` and `ipcRenderer` objects which enhance the built-in `ipc` module with some added methods, so you can use them as a replacement for `electron.ipcMain`/`electron.ipcRenderer`.

## Main process

### ipcMain.callRenderer(browserWindow, channel, data?)

Send a message to the given window.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Returns a `Promise<unknown>` with the reply from the renderer process.

#### browserWindow

Type: `BrowserWindow`

The window to send the message to.

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `unknown`

The data to send to the receiver.

### ipcMain.callFocusedRenderer(channel, data?)

Send a message to the focused window, as determined by `electron.BrowserWindow.getFocusedWindow`.

In the renderer process, use `ipcRenderer.answerMain` to reply to this message.

Returns a `Promise<unknown>` with the reply from the renderer process.

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `unknown`

The data to send to the receiver.

### ipcMain.answerRenderer(channel, callback)

This method listens for a message from `ipcRenderer.callMain` defined in a renderer process and replies back.

Returns a function, that when called, removes the listener.

#### channel

Type: `string`

The channel to send the message on.

#### callback(data?, browserWindow)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callMain` in the renderer process.

### ipcMain.answerRenderer(browserWindow, channel, callback)

This method listens for a message from `ipcRenderer.callMain` defined in the given BrowserWindow's renderer process and replies back.

Returns a function, that when called, removes the listener.

#### browserWindow

Type: `BrowserWindow`

The window for which to expect the message.

#### channel

Type: `string`

The channel to send the message on.

#### callback(data?, browserWindow)

Type: `Function | AsyncFunction`

The return value is sent back to the `ipcRenderer.callMain` in the renderer process.

### ipcMain.sendToRenderers(channel, data?)

Send a message to all renderer processes (windows).

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `unknown`

The data to send to the receiver.

## Renderer process

### ipcRenderer.callMain(channel, data?)

Send a message to the main process.

In the main process, use `ipcMain.answerRenderer` to reply to this message.

Returns a `Promise<unknown>` with the reply from the main process.

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `unknown`

The data to send to the receiver.

### ipcRenderer.answerMain(channel, callback)

This method listens for a message from `ipcMain.callRenderer` defined in the main process and replies back.

Returns a function, that when called, removes the listener.

#### channel

Type: `string`

The channel to send the message on.

#### callback(data?)

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
