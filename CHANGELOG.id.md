# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), dan proyek ini menggunakan [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[English](CHANGELOG.md)

## [Unreleased]

## [0.0.8] - 2026-10-26

### Ditambahkan

- `loadSenderMessages(sender, limit?)` untuk mengambil pesan terbaru dari seorang pengirim di semua key yang tersimpan, dengan normalisasi suffix perangkat dan limit default 25.
- `updateMessage(key, id, update)` untuk memperbarui pesan tersimpan dengan objek atau fungsi updater. Field tingkat atas dan objek `key` di dalamnya digabungkan, lalu hasilnya dinormalisasi ke skema pesan yang disimpan.
- `updateNode(key, id, update)` untuk memperbarui node tersimpan dengan objek atau fungsi updater. Field tingkat atas dan `attrs` digabungkan.
- `cleanMessages(key?, options?)` untuk menghapus pesan berlebih atau lama dari satu key atau semua key. Mengembalikan jumlah record yang dihapus.
- `cleanNodes(key?, options?)` untuk menghapus node berlebih atau lama dari satu key atau semua key. Mengembalikan jumlah record yang dihapus.
- `CleanOptions` dengan opsi `keep` (default `max`) dan `maxAge` (milidetik).
- `UpdatePatch` untuk payload update bertipe objek atau fungsi.
- Catatan rilis dua bahasa dalam `CHANGELOG.md` dan `CHANGELOG.id.md`.

### Diubah

- README diperluas untuk mendokumentasikan update, pembersihan, pencarian pengirim, konfigurasi, dan perilaku backend.
- Memperjelas driver mana yang merupakan peer dependency opsional; client Redis dimuat secara dinamis.
- Instruksi pengembangan diperbaiki. Teks sebelumnya menyatakan bahwa `yarn build` membuat dokumentasi API dan merujuk ke script `yarn build:tsc` yang tidak ada.

## [0.0.7] - 2026-10-11

### Ditambahkan

- Rilis awal yang tercatat di repositori ini.
- Backend penyimpanan JSON, SQLite, Redis, MySQL, MongoDB, dan PostgreSQL yang dapat dipilih.
- Integrasi `bind()` untuk objek aplikasi apa pun yang dapat ditulis, serta `config()` untuk direktori penyimpanan, batas riwayat, URI koneksi, dan log debug.
- Helper pesan: `addMessage()`, `loadMessage()`, `loadMessages()`, `getAllMessages()`, `updateMessageWithReceipt()`, dan `updateMessageWithReaction()`.
- Helper node: `addNode()`, `loadNode()`, `loadNodes()`, dan `getAllNodes()`, dengan sanitasi `Buffer` dan `Uint8Array`.
- Helper state aplikasi untuk chat, kontak, metadata grup, story, presence, state koneksi, dan ID pesan yang telah diproses.
- Riwayat dengan batas melalui opsi `max` untuk pesan, node, dan story.
- Cache dalam memori dengan persistensi ke backend yang dipilih.
- Penulisan file sementara yang atomik untuk backend JSON.

[Unreleased]: https://github.com/neoxr/store/compare/v0.0.8...HEAD
[0.0.8]: https://github.com/neoxr/store/releases/tag/v0.0.8
[0.0.7]: https://github.com/neoxr/store/releases/tag/v0.0.7
