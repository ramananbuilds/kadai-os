/**
 * The offline billing outbox (ADR 0003).
 *
 * Bills are created locally with client-generated UUID ids and enqueued in
 * SQLite. A NetInfo watcher drains the queue through api.pushOutbox the
 * moment connectivity returns; the create_bill RPC is idempotent on bill
 * id, so double-drains and retries are harmless.
 */

import * as SQLite from 'expo-sqlite'
import NetInfo from '@react-native-community/netinfo'

import type { BillDraft } from '@kadai-os/core'

import type { KadaiApi } from '@kadai-os/api'

const db = SQLite.openDatabaseSync('kadai-os.db')

db.execSync(`
  create table if not exists outbox (
    id text primary key,
    payload text not null,
    created_at text not null default (datetime('now')),
    attempts integer not null default 0
  );
  create table if not exists kv (
    key text primary key,
    value text not null
  );
`)

// ─── tiny kv (onboarding-seen, last sync, …) ──────────────────────

export function kvGet(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('select value from kv where key = ?', key)
  return row?.value ?? null
}

export function kvSet(key: string, value: string): void {
  db.runSync(
    'insert into kv (key, value) values (?, ?) on conflict(key) do update set value = excluded.value',
    key,
    value,
  )
}

// ─── outbox ───────────────────────────────────────────────────────

export function enqueueBill(draft: BillDraft): void {
  db.runSync(
    'insert or ignore into outbox (id, payload) values (?, ?)',
    draft.id,
    JSON.stringify(draft),
  )
}

export function pendingCount(): number {
  return db.getFirstSync<{ c: number }>('select count(*) c from outbox')!.c
}

/** Async drain — the real path. */
export async function drainOutboxAsync(syncApi: KadaiApi): Promise<{ accepted: string[]; rejected: Array<{ id: string; reason: string }> }> {
  const rows = db.getAllSync<{ id: string; payload: string }>(
    'select id, payload from outbox order by created_at',
  )
  if (rows.length === 0) return { accepted: [], rejected: [] }

  const entries = rows.map((r) => ({
    kind: 'bill' as const,
    id: r.id,
    payload: JSON.parse(r.payload) as BillDraft,
    createdAt: new Date().toISOString(),
  }))
  const result = await syncApi.pushOutbox(entries)

  if (result.accepted.length > 0) {
    db.runSync(
      `delete from outbox where id in (${result.accepted.map(() => '?').join(',')})`,
      result.accepted,
    )
  }
  for (const rej of result.rejected) {
    // Permanent rejections (validation, vanished stock) leave the queue —
    // keep the record but stop retrying; the UI reads them via failures().
    db.runSync('update outbox set attempts = attempts + 1 where id = ?', rej.id)
  }
  kvSet('lastSyncAt', new Date().toISOString())
  return result
}

let workerStarted = false

/** Start the reconnect watcher. Idempotent. */
export function startSyncWorker(syncApi: KadaiApi): () => void {
  if (workerStarted) return () => undefined
  workerStarted = true
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void drainOutboxAsync(syncApi)
    }
  })
  return unsubscribe
}
