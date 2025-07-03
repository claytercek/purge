import type { MiddlewareHandler } from "astro";
import { createPurge } from "@purge/core";
import { createPurgeContext, getCurrentPurgeContext } from "@purge/core/context";
import { purgeClientConfig } from "@purge/astro/client";

const purgeClient = createPurge(purgeClientConfig);

export const onRequest: MiddlewareHandler = (_context, next) => {
  return createPurgeContext(async () => {
    const res = await next();
    const tags = getCurrentPurgeContext();


    const cacheHeaders = purgeClient.getCacheHeaders({ tags: Array.from(tags) });

    for (const [key, value] of Object.entries(cacheHeaders)) {
      res.headers.set(key, value);
    }

    return res
  })
};