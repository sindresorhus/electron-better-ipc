# electron-better-ipc [![Build Status](https://travis-ci.org/sindresorhus/electron-better-ipc.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-better-ipc)

> Simplified IPC communication for Electron apps

The biggest benefit of this module over the [built-in IPC](https://electronjs.org/docs/api/ipc-main) is that it enables you to send a message and get the response back in the same call. This would usually require multiple IPC subscriptions.

You can use this module directly in both the main and renderer process.


## Install

```
$ npm install electron-better-ipc
```

<a href="https://www.patreon.com/sindresorhus">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>


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
const ipc = require('electron-better-ipc');

ipc.answerRenderer('get-emoji', async emojiName => {
	const emoji = await getEmoji(emojiName);
	return emoji;
});
```

###### Renderer

```js
const ipc = require('electron-better-ipc');

(async () => {
	const emoji = await ipc.callMain('get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
})();
```

Here we do the inverse of the above, we get an emoji by name in the main process from the renderer process:

###### Renderer

```js
const ipc = require('electron-better-ipc');

ipc.answerMain('get-emoji', async emojiName => {
	const emoji = await getEmoji(emojiName);
	return emoji;
});
```

###### Main

```js
const electron = require('electron');
const ipc = require('electron-better-ipc');

const win = electron.BrowserWindow.getFocusedWindow();

(async () => {
	const emoji = await ipc.callRenderer(win, 'get-emoji', 'unicorn');
	console.log(emoji);
	//=> '🦄'
})();
```


## API

The export is just the built-in `ipc` module with some added methods, so you can use it as a replacement for `electron.ipcMain`/`electron.ipcRenderer`.

The API is different in the main and renderer process.

## Main process

### ipc.callRenderer(window, channel, [data])

Send a message to the given window. Returns a Promise for the response.

In the renderer process, use `ipc.answerMain` to reply to this message.

#### window

Type: `BrowserWindow`

The window to send the message to.

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `any`

Data to send to the receiver.

### ipc.answerRenderer(channel, callback)

This method listens for a message from `ipc.callMain` defined in a renderer process and replies back.

#### channel

Type: `string`

The channel to send the message on.

#### callback([data], window)

Type: `Function` `AsyncFunction`

The return value is sent back to the `ipc.callMain` in the renderer process.

### ipc.sendToRenderers(channel, [data])

Send a message to all renderer processes (windows).

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `any`

Data to send to the receiver.

## Renderer process

### ipc.callMain(channel, [data])

Send a message to the main process. Returns a Promise for the response.

In the main process, use `ipc.answerRenderer` to reply to this message.

#### channel

Type: `string`

The channel to send the message on.

#### data

Type: `any`

Data to send to the receiver.

### ipc.answerMain(channel, callback)

This method listens for a message from `ipc.callRenderer` defined in the main process and replies back.

#### channel

Type: `string`

The channel to send the message on.

#### callback([data])

Type: `Function` `AsyncFunction`

The return value is sent back to the `ipc.callRenderer` in the main process.


## Related

- [electron-store](https://github.com/sindresorhus/electron-store) - Simple data persistence for your Electron app
- [electron-timber](https://github.com/sindresorhus/electron-timber) - Pretty logger for Electron apps
- [electron-serve](https://github.com/sindresorhus/electron-serve) - Static file serving for Electron apps
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
