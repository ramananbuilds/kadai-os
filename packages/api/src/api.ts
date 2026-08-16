/**
 * The facade apps consume. Screens import { api } or createKadaiApi from
 * '@kadai-os/api' and never see a driver, a supabase client, or a URL.
 * When the backend moves, only the driver argument at the app's single
 * composition point changes.
 */

import { billDraftSchema } from '@kadai-os/core'

import type { KadaiDriver } from './driver'

export interface KadaiApi extends KadaiDriver {
  /**
   * Draft validation at the boundary. The mobile outbox and the web checkout
   * both funnel through here so malformed payloads fail before they ever
   * reach a driver (and, in production, the network).
   */
  createBillValidated(shopId: string, draftJson: unknown): ReturnType<KadaiDriver['createBill']>
}

export function createKadaiApi(driver: KadaiDriver): KadaiApi {
  return {
    ...driver,
    createBillValidated(shopId, draftJson) {
      const draft = billDraftSchema.parse(draftJson)
      return driver.createBill(shopId, draft)
    },
  }
}
