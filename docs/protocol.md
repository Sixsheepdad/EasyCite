# CiteBridge Protocol

MVP communication uses a payload file plus an optional URI notification.

Zotero writes:

```text
{project.inboxDir}/{requestId}.json
```

Payload shape:

```json
{
  "protocolVersion": 1,
  "requestId": "20260626-103000-ABCD1234",
  "action": "importItems",
  "source": "zotero",
  "createdAt": "2026-06-26T10:30:00.000Z",
  "targetProjectId": "paper-project-0f3a7e9c",
  "projectToken": "random-token",
  "items": []
}
```

Cursor validates protocol version, action, source, target project id, project token, non-empty items, and each item `itemKey`.

The URI notification is advisory:

```text
{project.cursorUri}?projectId={projectId}&requestId={requestId}
```

If URI launch fails, Cursor can still import from the file watcher or the manual inbox command.
