# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Bahasa Indonesia](CHANGELOG.id.md)

## [Unreleased]

## [0.0.8] - 2026-10-26

### Added

- `loadSenderMessages(sender, limit?)` for retrieving recent messages from a sender across all stored keys, with device-suffix normalization and a default limit of 25.
- `updateMessage(key, id, update)` for patching a stored message with an object or an updater function. The top-level fields and the nested `key` object are merged, then the result is normalized to the stored message schema.
- `updateNode(key, id, update)` for patching a stored node with an object or an updater function. The top-level fields and `attrs` are merged.
- `cleanMessages(key?, options?)` for removing excess or old messages from one key or all keys. Returns the number of removed records.
- `cleanNodes(key?, options?)` for removing excess or old nodes from one key or all keys. Returns the number of removed records.
- `CleanOptions` with `keep` (defaults to `max`) and `maxAge` (milliseconds) options.
- `UpdatePatch` for typed object or function update payloads.
- Bilingual release notes in `CHANGELOG.md` and `CHANGELOG.id.md`.

### Changed

- Expanded the README files to document update, cleanup, sender lookup, configuration, and backend behavior.
- Clarified which drivers are optional peer dependencies; the Redis client is loaded dynamically.
- Corrected the development instructions. The previous text claimed that `yarn build` generated API documentation and referenced a non-existent `yarn build:tsc` script.

## [0.0.7] - 2026-10-11

### Added

- Initial release tracked in this repository.
- Pluggable JSON, SQLite, Redis, MySQL, MongoDB, and PostgreSQL storage backends.
- `bind()` integration for any writable application object, plus `config()` for storage directory, history limit, connection URI, and debug logging.
- Message helpers: `addMessage()`, `loadMessage()`, `loadMessages()`, `getAllMessages()`, `updateMessageWithReceipt()`, and `updateMessageWithReaction()`.
- Node helpers: `addNode()`, `loadNode()`, `loadNodes()`, and `getAllNodes()`, with `Buffer` and `Uint8Array` sanitization.
- Application state helpers for chats, contacts, group metadata, stories, presences, connection state, and processed message IDs.
- Bounded history through the `max` option for messages, nodes, and stories.
- In-memory caching with persistence to the selected backend.
- Atomic temporary-file writes for the JSON backend.

[Unreleased]: https://github.com/neoxr/store/compare/v0.0.8...HEAD
[0.0.8]: https://github.com/neoxr/store/releases/tag/v0.0.8
[0.0.7]: https://github.com/neoxr/store/releases/tag/v0.0.7
