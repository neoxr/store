# @neoxr/store

> A lightweight, pluggable store for applications that need to retain messages, records, events, contacts, and application state without keeping every item in memory.

[Bahasa Indonesia](README.id.md)

`@neoxr/store` attaches a small storage API to any mutable JavaScript object. It is not tied to a particular messaging SDK or framework: use it with an event emitter, a web service, a worker, or your own application object.

## Features

- **Pluggable storage backends:** JSON files (default), SQLite, Redis, MySQL, MongoDB, and PostgreSQL.
- **Bounded message history:** keeps only the most recent `max` records per key.
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

### Backend configuration

`config()` accepts the following options:

```ts
interface StoreConfig {
  dir?: string
  max?: number
  uri?: string
}
```

- `dir` is the storage directory for file-based backends. JSON stores its files under `.cache/<dir>`.
- `max` is the maximum number of messages or nodes retained for a key.
- `uri` is the connection URI for Redis, MySQL, MongoDB, and PostgreSQL.

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

`store.bind(target)` adds the following capabilities to `target`. The exact return type may be synchronous or promise-based, depending on the backend.

### Records and messages

| Method | Description |
| --- | --- |
| `addMessage(key, message)` | Stores a message-like record. The record should include `key.id` (or `id`). |
| `loadMessage(key, id)` | Returns one stored record, or `null` when absent. It can also look up by ID where supported. |
| `loadMessages(key, count?)` | Returns the most recent records for a key. |
| `getAllMessages(key, offset?)` | Returns all records from an offset; the returned collection provides `.count()` and `.clear()`. |
| `updateMessageWithReceipt(message, receipt)` | Updates receipt-style metadata on a stored record. |
| `updateMessageWithReaction(message, reaction)` | Updates reaction-style metadata on a stored record. |

### Application state

| Property or method | Description |
| --- | --- |
| `chats` | Persistent, proxy-backed record collection for chat- or session-like data. |
| `chatUpdate(updates)` | Applies updates to `chats`. |
| `contacts`, `contactsUpsert(items)`, `contactUpdate(updates)` | In-memory contact collection and update helpers. |
| `getContact(id)` / `getAllContacts(offset?)` | Looks up one contact or lists contacts; the latter supports `.count()` and `.clear()`. |
| `groupMetadata`, `loadGroupMetadata(id)`, `addGroupMetadata(id, value)` | Group metadata cache and access helpers. |
| `groupMetadataUpsert(items)` / `deleteGroupMetadata(id)` | Bulk update or remove group metadata. |
| `stories`, `addStory(key, story)`, `loadStory(key, id)` | Store and retrieve story-like records. |
| `loadStories(key, count?)` / `getAllStories(key, offset?)` | List story-like records; all-results collections support `.count()` and `.clear()`. |
| `presences`, `state`, `messageId` | Mutable presence, connection-state, and processed-ID state. |
| `recordMessageId(source, message)` | Records an ID and returns `false` when the message was already seen. |

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

`addNode(node, customKey?)` derives the key from `node.attrs.from` or `node.attrs.participant` when no key is provided. `loadNode`, `loadNodes`, and `getAllNodes` provide the equivalent retrieval operations. Binary `Buffer` and `Uint8Array` values in node payloads are sanitized before persistence.

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

## Development

```bash
yarn build
```

This compiles TypeScript and generates API documentation. Use `yarn build:tsc` to run only the TypeScript compilation.

## License

ISC
