/**
 * This module provides a Cloudflare provider for the `@purge/core` package, 
 * providing a simple interface to purge cache using Cloudflare's API.
 * It's a fairly simple wrapper around the Cloudflare TS SDK.
 *
 * @example
 * ```ts
 * import { createPurge } from "@purge/core";
 * import { cloudflare } from "@purge/cloudflare";
 *
 * const purgeClient = createPurge({
 *   provider: cloudflare({
 *     zoneId: "your-zone-id",
 *     apiToken: "your-api-token"
 *   })
 * });
 *
 * // Purge cache tags
 * await purgeClient.purgeCache({ tags: ["tag1", "tag2"] });
 *
 * // Get cache headers for tags
 * const headers = purgeClient.getCacheHeaders({ tags: ["tag1", "tag2"] });
 * ```
 *
 * @module
 */

import type { PurgeProvider } from "@purge/core";
import { okAsync, ResultAsync } from "neverthrow";
import Cloudflare, { type ClientOptions } from 'cloudflare';
import { PurgeProviderError } from "@purge/core/errors";

/**
 * Options for the Cloudflare provider. With the exception of `zoneId`,
 * all options are passed directly to the Cloudflare client.
 */
type CloudflareProviderOptions = ClientOptions & {
  zoneId: string;
}

/**
 * Creates a Cloudflare provider for purging cache, to be used with the `@purge/core` package.
 * Uses the Cloudflare TS SDK to interact with the Cloudflare API.
 */
export function cloudflare({
  zoneId,
  ...cloudflareOptions
}: CloudflareProviderOptions): PurgeProvider {
  const cloudflareClient = new Cloudflare(cloudflareOptions);

  return {
    purgeCache: ({ tags }) => {
      return ResultAsync.fromPromise(
        cloudflareClient.cache.purge({ zone_id: zoneId, tags }),
        (e) => {
          return new PurgeProviderError({
            message: `Cloudflare provider failed to purge cache for tags: ${tags.join(", ")} in zone ${zoneId}`,
            cause: e instanceof Error ? e : undefined,
          });
        }
      ).andThen(() => {
        // return void
        return okAsync();
      });
    },
    getCacheHeaders: (params) => {
      return {
        "Cache-Tag": params.tags.join(", "),
      };
    },
  };
}