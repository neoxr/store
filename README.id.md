# @neoxr/store

> Penyimpanan ringan dan dapat dipilih backend-nya untuk aplikasi yang perlu menyimpan pesan, record, event, kontak, dan state tanpa menahan semua data di memori.

[English](README.md) · [Changelog](CHANGELOG.id.md)

`@neoxr/store` menambahkan API penyimpanan ke objek JavaScript apa pun yang dapat ditulis. Paket ini tidak terikat pada SDK atau framework pesan tertentu; gunakan dengan event emitter, layanan web, worker, atau objek aplikasi Anda sendiri.

## Fitur

- **Backend yang dapat dipilih:** file JSON (default), SQLite, Redis, MySQL, MongoDB, dan PostgreSQL.
- **Riwayat dengan batas:** hanya menyimpan `max` pesan, node, atau story terbaru untuk setiap key.
- **Helper pembaruan:** memperbarui pesan dan node tersimpan dengan objek atau fungsi updater.
- **Pembersihan eksplisit:** menghapus record lama atau berlebih dengan `cleanMessages()` dan `cleanNodes()`.
- **Pencarian pengirim:** menemukan pesan terbaru dari seorang pengirim di semua key yang tersimpan.
- **Hemat memori:** data yang sering digunakan di-cache, sementara pesan dan record mirip chat disimpan ke backend.
- **Integrasi umum:** `bind()` dapat digunakan dengan objek apa pun yang bisa ditulis.
- **Helper state:** mengelola record, kontak, metadata grup, story, binary node, presence, state koneksi, dan ID pesan yang telah diproses.
- **Penyimpanan lebih aman:** backend JSON menulis melalui file sementara; backend database menggunakan mekanisme persistensi aslinya.

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

Driver SQLite, MongoDB, MySQL, dan PostgreSQL merupakan peer dependency opsional. Client Redis dimuat secara dinamis, jadi pasang `redis` hanya jika menggunakan backend tersebut.

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

store.config({
  dir: 'app-store',
  max: 300
})

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

Backend JSON dan SQLite bersifat sinkron. Redis, MySQL, MongoDB, dan PostgreSQL mengembalikan promise dari method yang melakukan I/O, sehingga `await` dapat digunakan pada semua backend tetapi hanya wajib untuk backend asinkron.

## Konfigurasi

`config()` menerima opsi berikut dan mengembalikan instance store:

```ts
interface StoreOptions {
  dir?: string
  max?: number
  uri?: string
  debug?: boolean
}
```

- `dir` adalah direktori penyimpanan untuk backend berbasis file dan data fallback lokal. JSON menyimpan file di `.cache/<dir>`. Nilai default-nya `stores`.
- `max` adalah jumlah maksimum pesan, node, atau story yang disimpan untuk setiap key. Nilai default-nya `250`. JSON, SQLite, dan Redis memangkas riwayat saat item baru ditulis. MySQL, MongoDB, dan PostgreSQL memangkas secara probabilistik saat penulisan, jadi panggil `cleanMessages()` atau `cleanNodes()` bila batas harus langsung diterapkan. Kedua helper pembersihan juga memakai `max` sebagai nilai `keep` default.
- `uri` adalah URI koneksi untuk Redis, MySQL, MongoDB, dan PostgreSQL. SQLite dan JSON tidak memakainya.
- `debug` mengaktifkan log store yang lebih rinci. Log juga dapat diaktifkan dengan `STORE_DEBUG=true` atau `DEBUG=true`.

Konfigurasikan store sebelum melakukan `bind()` atau operasi penyimpanan apa pun. Pada backend database, mengubah `uri` akan menginisialisasi ulang koneksi.

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

`store.bind(target)` menambahkan kemampuan berikut ke `target`. Tipe hasil dapat sinkron atau berbasis promise, tergantung backend. Method yang mengembalikan promise ditunjukkan dengan `await` pada contoh. Pada backend asinkron, method `.count()` dan `.clear()` dari koleksi semua hasil juga mengembalikan promise.

### Record dan pesan

| Method | Keterangan |
| --- | --- |
| `addMessage(key, message)` | Menyimpan record mirip pesan. Record harus memiliki `key.id` (atau `id`). Juga menerima `addMessage(message, key)` atau `addMessage(message)` jika pesan memiliki `key.remoteJid`, `chat`, atau `jid`. |
| `loadMessage(key, id)` | Mengambil satu record, atau `null` bila tidak ada. Jika hanya ID yang diberikan, pencarian dilakukan di cache pesan dan penyimpanan yang mendukung. |
| `loadMessages(key, count?)` | Mengambil record terbaru untuk sebuah key, terbaru lebih dulu. Jumlah default `25`. |
| `loadSenderMessages(sender, limit?)` | Mengambil record terbaru yang dikirim oleh `sender` dari semua key, terbaru lebih dulu. Limit default `25`. |
| `getAllMessages(key, offset?)` | Mengambil semua record dari offset; koleksinya menyediakan `.count()` dan `.clear()`. |
| `updateMessage(key, id, update)` | Menggabungkan update ke record tersimpan dan mengembalikan record hasil update, atau `null` jika tidak ada. |
| `cleanMessages(key?, options?)` | Menghapus pesan berlebih atau lama dan mengembalikan jumlah yang dihapus. Hilangkan `key` untuk membersihkan semua key. |
| `updateMessageWithReceipt(message, receipt)` | Memperbarui metadata receipt pada record. |
| `updateMessageWithReaction(message, reaction)` | Memperbarui metadata reaction pada record. |

`loadSenderMessages()` mengembalikan `null` bila tidak ada record yang cocok. Method ini menormalisasi suffix perangkat dan dapat mencocokkan `sender`, `key.senderPn`, `key.participantPn`, `key.participant`, atau `key.remoteJid` untuk pesan langsung yang masuk.

```js
const recentFromSender = await app.loadSenderMessages('15551234567@s.whatsapp.net', 20)
```

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

| Method | Keterangan |
| --- | --- |
| `addNode(node, customKey?)` | Menyimpan node. Key diambil dari `node.attrs.from`, `node.attrs.to`, atau `node.attrs.participant` jika `customKey` tidak diberikan. |
| `loadNode(key, id)` | Mengambil satu node, atau `null` bila tidak ada. Jika hanya ID yang diberikan, pencarian dilakukan di semua key yang diketahui. |
| `loadNodes(key?, count?)` | Mengambil node terbaru, terbaru lebih dulu. Hilangkan key untuk membaca dari semua key. |
| `getAllNodes(key?, offset?)` | Mengambil semua node dari offset; koleksinya menyediakan `.count()` dan `.clear()`. |
| `updateNode(key, id, update)` | Menggabungkan update ke node tersimpan dan mengembalikan node hasil update, atau `null` jika tidak ada. |
| `cleanNodes(key?, options?)` | Menghapus node berlebih atau lama dan mengembalikan jumlah yang dihapus. Hilangkan `key` untuk membersihkan semua key. |

Nilai `Buffer` dan `Uint8Array` di payload node disanitasi sebelum disimpan.

### State aplikasi

| Properti atau method | Keterangan |
| --- | --- |
| `chats` | Koleksi record persisten berbasis proxy untuk data chat atau sesi. |
| `chatUpdate(updates)` | Menerapkan update ke `chats`. |
| `contacts`, `contactsUpsert(items)`, `contactUpdate(updates)` | Koleksi serta helper kontak berbasis proxy. |
| `getContact(id)` / `getAllContacts(offset?)` | Mengambil satu kontak atau menampilkan daftar kontak; hasil daftar mendukung `.count()` dan `.clear()`. |
| `groupMetadata`, `loadGroupMetadata(id)`, `addGroupMetadata(id, value)` | Cache dan helper metadata grup. |
| `groupMetadataUpsert(items)` / `deleteGroupMetadata(id)` | Memperbarui massal atau menghapus metadata grup. |
| `stories`, `addStory(key, story)`, `loadStory(key, id)` | Menyimpan dan mengambil record mirip story. |
| `loadStories(key, count?)` / `getAllStories(key, offset?)` | Menampilkan record mirip story; koleksi semua hasil mendukung `.count()` dan `.clear()`. |
| `presences`, `state`, `messageId` | State presence, koneksi, dan ID yang telah diproses. |
| `nodes` | Koleksi node berdasarkan JID yang didukung oleh store terpilih. |
| `recordMessageId(source, message)` | Mencatat ID dan menghasilkan `false` apabila pesan sudah pernah dilihat. |

## Memperbarui record

`updateMessage()` dan `updateNode()` menerima objek atau fungsi yang menerima record saat ini. Update adalah penggabungan dangkal: field tingkat atas digabung, dan objek `key` (pesan) atau `attrs` (node) juga digabung. ID yang tidak ditemukan menghasilkan `null`.

Update pesan dinormalisasi ke skema pesan yang disimpan, sehingga field tingkat atas kustom tidak dipertahankan. Gunakan field yang didukung seperti `text`, `status`, `message`, atau `key`.

```js
await app.updateMessage(channelId, 'event-001', {
  text: 'Pesanan dikonfirmasi',
  status: 'confirmed'
})

await app.updateMessage(channelId, 'event-001', current => ({
  text: `${current.text} (ditinjau)`
}))

await app.updateNode(channelId, 'evt-002', {
  attrs: { status: 'processed' }
})
```

Bentuk fungsi dievaluasi sebelum penggabungan. Kembalikan objek untuk menerapkannya, atau kembalikan nilai falsy untuk melewati update.

## Membersihkan data tersimpan

Gunakan pembersihan ketika Anda perlu mengurangi riwayat di bawah batas `max` otomatis atau menghapus record yang sudah lama. JSON, SQLite, dan Redis memangkas riwayat saat item baru ditulis. MySQL, MongoDB, dan PostgreSQL memangkas secara probabilistik, jadi panggil helper pembersihan bila batas harus langsung diterapkan. Tidak ada backend yang menghapus record berdasarkan umur secara otomatis.

```js
await app.cleanMessages(channelId)                          // pertahankan `max` record terbaru
await app.cleanMessages(channelId, { keep: 100 })            // pertahankan 100 terbaru
await app.cleanMessages(channelId, { maxAge: 7 * 24 * 60 * 60 * 1000 })
await app.cleanMessages()                                    // bersihkan semua key
const removedNodes = await app.cleanNodes(channelId, { keep: 50 })
```

`CleanOptions` memiliki dua field:

| Opsi | Keterangan |
| --- | --- |
| `keep` | Jumlah record terbaru yang dipertahankan. Default-nya `max` yang dikonfigurasi. Gunakan `0` untuk menghapus semua record yang cocok. |
| `maxAge` | Umur maksimum dalam milidetik. Record yang lebih lama akan dihapus. Record tanpa timestamp yang dapat dipakai tetap dipertahankan kecuali dihapus karena `keep`. |

Untuk record JSON/Redis dan fallback dalam memori, `maxAge` dihitung dari `messageTimestamp` untuk pesan dan `attrs.t` untuk node. Record yang disimpan di database (SQLite, MySQL, MongoDB, dan PostgreSQL) memakai kolom `created_at`. Kedua method pembersihan mengembalikan jumlah record yang dihapus, termasuk `0` jika tidak ada yang cocok.

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

## Changelog

Riwayat rilis dan catatan pembaruan tersedia di [CHANGELOG.id.md](CHANGELOG.id.md).

## Pengembangan

```bash
npm install
npm run build
```

`npm run build` menjalankan compiler TypeScript (`tsc`). Repositori ini tidak menyertakan file test; `npm test` menjalankan `npx ts-node ./test.ts`, jadi tambahkan `test.ts` lokal sebelum menggunakannya.

## Lisensi

ISC
