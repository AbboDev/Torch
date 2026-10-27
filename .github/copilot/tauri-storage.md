# Tauri & Persistence Guidelines

- **Dual-Storage Strategy:**
  - **Desktop (Tauri):** Asynchronous read/write to OS native File System (`appDataDir`).
  - **Browser Mode:** Fallback to **IndexedDB**. Never use `localStorage`.
- **Global Settings (`settings.json`):** Holds global preferences (Graphics, Audio, Controls, i18n). All options can be active concurrently.
- **Save Slots (`save_slot_[1-3].json`):** Holds progression, unlocked abilities, visited rooms, and collected pickup IDs. Dynamic stats (`maxHp`, `maxBattery`, `maxAmmo`) must be computed at boot based on collected items, never statically saved.
