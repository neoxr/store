# @neoxr/store

> A lightweight, pluggable store for applications that need to retain messages, records, events, contacts, and application state without keeping every item in memory.

[Bahasa Indonesia](README.id.md) · [Changelog](CHANGELOG.md)

`@neoxr/store` attaches a small storage API to any mutable JavaScript object. It is not tied to a particular messaging SDK or framework: use it with an event emitter, a web service, a worker, or your own application object.

## Features

- **Pluggable storage backends:** JSON files (default), SQLite, Redis, MySQL, MongoDB, and PostgreSQL.
- **Bounded history:** keeps only the most recent `max` messages, nodes, or stories per key.
- **Update helpers:** patch stored messages and nodes with an object or an updater function.
- **Explicit cleanup:** remove old or excess records with `cleanMessages()` and `cleanNodes()`.
- **Sender lookup:** find recent messages from a sender across all stored keys.
- **Memory-aware access:** caches hot data while persisting messages and chat-like records to the selected backend.
- **Generic integration:** `bind()` works with any writable object; no framework-specific client is required.
- **State helpers:** manages records, contacts, group metadata, stories, binary nodes, presences, connection state, and processed message IDs.
- **Safer persistence:** the JSON backend writes through temporary files; database backends use their native persistence mechanisms.

## Installation

Install the package with your preferred package manager:

```bash
npm install @neoxr/store
# or: yarn add @neoxr/store
# or: pnpm add @neoxr/store
```

The JSON backend requires no additional package. For another backend, install its driver in your application:

```bash
npm install better-sqlite3 # SQLite
npm install redis          # Redis
npm install mysql2         # MySQL
npm install mongodb        # MongoDB
npm install pg             # PostgreSQL
```

The SQLite, MongoDB, MySQL, and PostgreSQL drivers are optional peer dependencies. The Redis client is loaded dynamically, so install `redis` only when using that backend.

## Choose a backend

The default export selects a backend from `USE_STORE` **when it is first used**. Set the variable before starting Node:

```bash
USE_STORE=sqlite node app.js
```

| `USE_STORE` value | Backend |
| --- | --- |
| unset (default) | JSON files |
| `sqlite` | SQLite |
| `redis` | Redis |
| `mysql` | MySQL |
| `mongo` | MongoDB |
| `pgsql` or `postgres` | PostgreSQL |

Alternatively, import a backend directly when you prefer an explicit dependency:

```js
import storeModule from '@neoxr/store/lib/core/store-json.js'

const store = storeModule.default ?? storeModule
// Other options: store-sqlite.js, store-redis.js, store-mysql.js,
// store-mongo.js, and store-pgsql.js.
```

## Quick start

Configure the store, bind it to an ordinary application object, and save or retrieve records. The example uses generic IDs and a simple text field so it can be adapted to your own event source.

```js
import storeModule from '@neoxr/store'

const store = storeModule.default ?? storeModule

store.config({
  dir: 'app-store',
  max: 300
})

const app = {}
store.bind(app)

const channelId = 'orders:42'
const record = {
  key: { id: 'event-001' },
  text: 'Order created'
}

app.addMessage(channelId, record)

const saved = app.loadMessage(channelId, 'event-001')
const recent = app.loadMessages(channelId, 10)
```

Some database backends perform I/O asynchronously. Use `await` with methods that return a promise:

```js
await app.addMessage(channelId, record)
const saved = await app.loadMessage(channelId, 'event-001')
```

The JSON and SQLite backends are synchronous. Redis, MySQL, MongoDB, and PostgreSQL return promises from methods that perform I/O, so `await` works with every backend but is only required for the asynchronous ones.

## Configuration

`config()` accepts the following options and returns the store instance:

```ts
interface StoreOptions {
  dir?: string
  max?: number
  uri?: string
  debug?: boolean
}
```

- `dir` is the storage directory for file-based backends and local fallback data. JSON stores its files under `.cache/<dir>`. The default is `stores`.
- `max` is the maximum number of messages, nodes, or stories retained for a key. The default is `250`. JSON, SQLite, and Redis trim history as new items are written. MySQL, MongoDB, and PostgreSQL trim probabilistically during writes, so call `cleanMessages()` or `cleanNodes()` when the limit must be applied immediately. The cleanup helpers also use `max` as their default `keep` value.
- `uri` is the connection URI for Redis, MySQL, MongoDB, and PostgreSQL. SQLite and JSON do not use it.
- `debug` enables verbose store logging. It can also be enabled with `STORE_DEBUG=true` or `DEBUG=true`.

Configure the store before binding it or performing any storage operation. For database backends, changing `uri` reinitializes the connection.

For example, configure MongoDB with a URI:

```js
import storeModule from '@neoxr/store/lib/core/store-mongo.js'

const store = storeModule.default ?? storeModule

store.config({
  max: 300,
  uri: 'mongodb://127.0.0.1:27017/app_store'
})
```

## Bound API

`store.bind(target)` adds the following capabilities to `target`. The exact return type may be synchronous or promise-based, depending on the backend. Methods that return a promise are shown with `await` in the examples. On asynchronous backends, the `.count()` and `.clear()` methods of all-results collections also return promises.

### Records and messages

| Method | Description |
| --- | --- |
| `addMessage(key, message)` | Stores a message-like record. The record must include `key.id` (or `id`). Also accepts `addMessage(message, key)` or `addMessage(message)` when the message contains `key.remoteJid`, `chat`, or `jid`. |
| `loadMessage(key, id)` | Returns one stored record, or `null` when absent. Passing only an ID searches the known message cache and storage where supported. |
| `loadMessages(key, count?)` | Returns the most recent records for a key, newest first. The default count is `25`. |
| `loadSenderMessages(sender, limit?)` | Returns the most recent records sent by `sender` across all keys, newest first. The default limit is `25`. |
| `getAllMessages(key, offset?)` | Returns all records from an offset; the returned collection provides `.count()` and `.clear()`. |
| `updateMessage(key, id, update)` | Merges an update into a stored record and returns the updated record, or `null` when it does not exist. |
| `cleanMessages(key?, options?)` | Removes excess or old messages and returns the number removed. Omit `key` to clean every stored key. |
| `updateMessageWithReceipt(message, receipt)` | Updates receipt-style metadata on a stored record. |
| `updateMessageWithReaction(message, reaction)` | Updates reaction-style metadata on a stored record. |

`loadSenderMessages()` returns `null` when no records match. It normalizes device suffixes and can match `sender`, `key.senderPn`, `key.participantPn`, `key.participant`, or `key.remoteJid` for incoming direct messages.

```js
const recentFromSender = await app.loadSenderMessages('15551234567@s.whatsapp.net', 20)
```

### Binary nodes or events

Use node helpers for structured event payloads that should be stored separately from messages:

```js
app.addNode({
  tag: 'event',
  attrs: { id: 'evt-002', from: channelId },
  content: [{ tag: 'data', attrs: { kind: 'example' }, content: [] }]
})

const event = app.loadNode(channelId, 'evt-002')
```

| Method | Description |
| --- | --- |
| `addNode(node, customKey?)` | Stores a node. The key is derived from `node.attrs.from`, `node.attrs.to`, or `node.attrs.participant` when `customKey` is omitted. |
| `loadNode(key, id)` | Returns one node, or `null` when absent. Passing only an ID searches all known keys. |
| `loadNodes(key?, count?)` | Returns recent nodes, newest first. Omit the key to read across all keys. |
| `getAllNodes(key?, offset?)` | Returns all nodes from an offset; the returned collection provides `.count()` and `.clear()`. |
| `updateNode(key, id, update)` | Merges an update into a stored node and returns the updated node, or `null` when it does not exist. |
| `cleanNodes(key?, options?)` | Removes excess or old nodes and returns the number removed. Omit `key` to clean every stored key. |

Binary `Buffer` and `Uint8Array` values in node payloads are sanitized before persistence.

### Application state

| Property or method | Description |
| --- | --- |
| `chats` | Persistent, proxy-backed record collection for chat- or session-like data. |
| `chatUpdate(updates)` | Applies updates to `chats`. |
| `contacts`, `contactsUpsert(items)`, `contactUpdate(updates)` | Proxy-backed contact collection and update helpers. |
| `getContact(id)` / `getAllContacts(offset?)` | Looks up one contact or lists contacts; the latter supports `.count()` and `.clear()`. |
| `groupMetadata`, `loadGroupMetadata(id)`, `addGroupMetadata(id, value)` | Group metadata cache and access helpers. |
| `groupMetadataUpsert(items)` / `deleteGroupMetadata(id)` | Bulk update or remove group metadata. |
| `stories`, `addStory(key, story)`, `loadStory(key, id)` | Store and retrieve story-like records. |
| `loadStories(key, count?)` / `getAllStories(key, offset?)` | List story-like records; all-results collections support `.count()` and `.clear()`. |
| `presences`, `state`, `messageId` | Mutable presence, connection-state, and processed-ID state. |
| `nodes` | Node collection keyed by JID, backed by the configured store. |
| `recordMessageId(source, message)` | Records an ID and returns `false` when the message was already seen. |

## Updating records

`updateMessage()` and `updateNode()` accept either an object or a function that receives the current record. Updates are shallow merges: the top-level fields are merged, and the nested `key` (messages) or `attrs` (nodes) object is merged as well. Unknown IDs return `null`.

Message updates are normalized to the stored message schema, so custom top-level fields are not retained. Use supported fields such as `text`, `status`, `message`, or `key`.

```js
await app.updateMessage(channelId, 'event-001', {
  text: 'Order confirmed',
  status: 'confirmed'
})

await app.updateMessage(channelId, 'event-001', current => ({
  text: `${current.text} (reviewed)`
}))

await app.updateNode(channelId, 'evt-002', {
  attrs: { status: 'processed' }
})
```

The function form is evaluated before the merge. Return an object to apply it, or return a falsy value to skip the update.

## Cleaning stored data

Use cleanup when you need to reduce history below the automatic `max` limit or remove stale records. JSON, SQLite, and Redis trim history as new items are written. MySQL, MongoDB, and PostgreSQL trim probabilistically, so call the cleanup helpers when you need the limit applied immediately. None of the backends removes records by age automatically.

```js
await app.cleanMessages(channelId)                          // keep the newest `max` records
await app.cleanMessages(channelId, { keep: 100 })            // keep the newest 100
await app.cleanMessages(channelId, { maxAge: 7 * 24 * 60 * 60 * 1000 })
await app.cleanMessages()                                    // clean every stored key
const removedNodes = await app.cleanNodes(channelId, { keep: 50 })
```

`CleanOptions` has two fields:

| Option | Description |
| --- | --- |
| `keep` | Number of newest records to retain. Defaults to the configured `max`. Use `0` to remove all matching records. |
| `maxAge` | Maximum age in milliseconds. Older records are removed. Records without a usable timestamp are retained unless removed by `keep`. |

For JSON/Redis records and in-memory fallbacks, `maxAge` is based on `messageTimestamp` for messages and `attrs.t` for nodes. Database-backed records (SQLite, MySQL, MongoDB, and PostgreSQL) use their `created_at` column. Both cleanup methods return the number of records removed, including `0` when nothing matched.

## Integration pattern

Bind once during application startup, then call the attached methods from your own handlers. For an event emitter, a minimal pattern looks like this:

```js
import { EventEmitter } from 'node:events'
import storeModule from '@neoxr/store'

const store = storeModule.default ?? storeModule

store.config({ dir: 'events', max: 100 })

const app = new EventEmitter()
store.bind(app)

app.on('record', async ({ stream, record }) => {
  await app.addMessage(stream, record)
})
```

The store does not subscribe to external SDK events for you. Map events from your application to the bound methods that match your data model.

## Changelog

Release history and upgrade notes are available in [CHANGELOG.md](CHANGELOG.md).

## Development

```bash
npm install
npm run build
```

`npm run build` runs the TypeScript compiler (`tsc`). The repository does not include a test file; `npm test` runs `npx ts-node ./test.ts`, so add a local `test.ts` before using it.

## License

ISC
