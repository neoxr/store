# @neoxr/store

> Penyimpanan ringan dan dapat dipilih backend-nya untuk aplikasi yang perlu menyimpan pesan, record, event, kontak, dan state tanpa menahan semua data di memori.

[English](README.md)

`@neoxr/store` menambahkan API penyimpanan ke objek JavaScript apa pun yang dapat ditulis. Paket ini tidak terikat pada SDK atau framework pesan tertentu; gunakan dengan event emitter, layanan web, worker, atau objek aplikasi Anda sendiri.

## Fitur

- **Backend yang dapat dipilih:** file JSON (default), SQLite, Redis, MySQL, MongoDB, dan PostgreSQL.
- **Riwayat dengan batas:** hanya menyimpan `max` record terbaru untuk setiap key.
- **Hemat memori:** data yang sering digunakan di-cache, sementara pesan dan record mirip chat disimpan ke backend.
- **Integrasi umum:** `bind()` dapat digunakan dengan objek apa pun yang bisa ditulis.
- **Helper state:** mengelola record, kontak, metadata grup, story, binary node, presence, state koneksi, dan ID pesan yang telah diproses.

## Instalasi

```bash
npm install @neoxr/store
# atau: yarn add @neoxr/store
# atau: pnpm add @neoxr/store
```

Backend JSON tidak memerlukan paket tambahan. Untuk backend lain, pasang driver yang sesuai:

```bash
npm install better-sqlite3 # SQLite
npm install redis          # Redis
npm install mysql2         # MySQL
npm install mongodb        # MongoDB
npm install pg             # PostgreSQL
```

## Memilih backend

Ekspor default memilih backend dari `USE_STORE` saat pertama kali dipakai. Atur variabel tersebut sebelum menjalankan Node:

```bash
USE_STORE=sqlite node app.js
```

| Nilai `USE_STORE` | Backend |
| --- | --- |
| tidak diatur (default) | File JSON |
| `sqlite` | SQLite |
| `redis` | Redis |
| `mysql` | MySQL |
| `mongo` | MongoDB |
| `pgsql` atau `postgres` | PostgreSQL |

Anda juga dapat mengimpor backend secara langsung:

```js
import storeModule from '@neoxr/store/lib/core/store-json.js'

const store = storeModule.default ?? storeModule
// Pilihan lain: store-sqlite.js, store-redis.js, store-mysql.js,
// store-mongo.js, dan store-pgsql.js.
```

## Mulai cepat

Konfigurasikan store, ikat ke objek aplikasi biasa, lalu simpan atau ambil record. Contoh ini menggunakan ID umum dan field teks sederhana sehingga dapat disesuaikan dengan sumber event Anda.

```js
import storeModule from '@neoxr/store'

const store = storeModule.default ?? storeModule

store.config({ dir: 'app-store', max: 300 })

const app = {}
store.bind(app)

const channelId = 'orders:42'
const record = {
  key: { id: 'event-001' },
  text: 'Pesanan dibuat'
}

app.addMessage(channelId, record)

const saved = app.loadMessage(channelId, 'event-001')
const recent = app.loadMessages(channelId, 10)
```

Beberapa backend database melakukan I/O secara asinkron. Gunakan `await` pada method yang mengembalikan promise:

```js
await app.addMessage(channelId, record)
const saved = await app.loadMessage(channelId, 'event-001')
```

## Konfigurasi

```ts
interface StoreConfig {
  dir?: string
  max?: number
  uri?: string
}
```

- `dir` adalah direktori penyimpanan untuk backend berbasis file. JSON menyimpan file di `.cache/<dir>`.
- `max` adalah jumlah maksimum pesan atau node yang disimpan untuk setiap key.
- `uri` adalah URI koneksi untuk Redis, MySQL, MongoDB, dan PostgreSQL.

Contoh konfigurasi MongoDB:

```js
import storeModule from '@neoxr/store/lib/core/store-mongo.js'

const store = storeModule.default ?? storeModule

store.config({
  max: 300,
  uri: 'mongodb://127.0.0.1:27017/app_store'
})
```

## API setelah `bind()`

`store.bind(target)` menambahkan kemampuan berikut ke `target`. Tipe hasil dapat sinkron atau berbasis promise, tergantung backend.

### Record dan pesan

| Method | Keterangan |
| --- | --- |
| `addMessage(key, message)` | Menyimpan record mirip pesan. Record perlu memiliki `key.id` (atau `id`). |
| `loadMessage(key, id)` | Mengambil satu record, atau `null` bila tidak ada. |
| `loadMessages(key, count?)` | Mengambil record terbaru untuk sebuah key. |
| `getAllMessages(key, offset?)` | Mengambil semua record dari offset; koleksinya menyediakan `.count()` dan `.clear()`. |
| `updateMessageWithReceipt(message, receipt)` | Memperbarui metadata receipt pada record. |
| `updateMessageWithReaction(message, reaction)` | Memperbarui metadata reaction pada record. |

### State aplikasi

- `chats` dan `chatUpdate(updates)`: koleksi record persisten berbasis proxy untuk data chat atau sesi.
- `contacts`, `contactsUpsert(items)`, `contactUpdate(updates)`, `getContact(id)`, dan `getAllContacts(offset?)`: koleksi serta helper kontak dalam memori.
- `groupMetadata`, `loadGroupMetadata(id)`, `addGroupMetadata(id, value)`, `groupMetadataUpsert(items)`, dan `deleteGroupMetadata(id)`: cache dan helper metadata grup.
- `stories`, `addStory(key, story)`, `loadStory(key, id)`, `loadStories(key, count?)`, serta `getAllStories(key, offset?)`: helper untuk record mirip story.
- `presences`, `state`, dan `messageId`: state presence, koneksi, dan ID yang telah diproses.
- `recordMessageId(source, message)`: mencatat ID dan menghasilkan `false` apabila pesan sudah pernah dilihat.

### Binary node atau event

Gunakan helper node untuk payload event terstruktur yang ingin disimpan terpisah dari pesan:

```js
app.addNode({
  tag: 'event',
  attrs: { id: 'evt-002', from: channelId },
  content: [{ tag: 'data', attrs: { kind: 'example' }, content: [] }]
})

const event = app.loadNode(channelId, 'evt-002')
```

`addNode(node, customKey?)` mengambil key dari `node.attrs.from` atau `node.attrs.participant` jika key tidak diberikan. `loadNode`, `loadNodes`, dan `getAllNodes` menyediakan operasi pengambilan data yang setara. Nilai `Buffer` dan `Uint8Array` di payload node disanitasi sebelum disimpan.

## Pola integrasi

Panggil `bind()` sekali saat aplikasi dimulai, lalu panggil method yang ditambahkan dari handler Anda sendiri. Store tidak berlangganan ke event SDK eksternal secara otomatis; petakan event aplikasi Anda ke method yang sesuai dengan model data.

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

## Pengembangan

```bash
yarn build
```

Perintah tersebut mengompilasi TypeScript dan membuat dokumentasi API. Gunakan `yarn build:tsc` hanya untuk kompilasi TypeScript.

## Lisensi

ISC
