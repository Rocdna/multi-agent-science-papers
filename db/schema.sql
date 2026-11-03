-- One versioned snapshot makes batch edits atomic and prevents lost updates.
CREATE TABLE IF NOT EXISTS reading_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  statuses_json TEXT NOT NULL CHECK (json_valid(statuses_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
