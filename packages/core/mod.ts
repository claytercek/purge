/**
 * This module provides a CDN agnostic client for purging cache tags and generating CDN specific cache control headers.
 *
 * @example
 * ```ts
 * import { createPurge } from "@purge/core";
 * import { MyCDNProvider } from "@purge/my-cdn";
 * 
 * const purgeClient = createPurge({
 *  provider: new MyCDNProvider()
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

import type { ResultAsync } from "neverthrow";
import type { PurgeError } from "./errors.ts";

export type PurgeCacheParams = {
  /**
   * The tags to purge from the CDN.
   * This should be an array of strings representing the tags.
   */
  tags: string[];
};

export type GetCacheHeadersParams = {
  /**
   * The tags to generate CDN cache headers for.
   * This should be an array of strings representing the tags.
   */
  tags: string[];
  /**
   * How long the CDN should cache the content before it expires.
   * This is used to set the `s-maxage` directive in the cache control header.
   * @default 3153536000 (1 year)
   */
  maxAgeCDN?: number;

  /**
   * How long the browser should cache the content before it expires.
   * This is used to set the `max-age` directive in the cache control header.
   * @default 0 (no caching)
   */
  maxAgeBrowser?: number;
  /**
   * Add the specified headers to the cache key for the resource. Applies the `vary` header.
   * This can be used to vary the cache based on certain request headers.
   * @example
   * ```ts
   * // To vary the cache based on the `Accept-Language` header:
   * vary: ['Accept-Language']
   * // To vary the cache based on multiple headers:
   * vary: ['Accept-Language', 'Accept-Encoding']
   * ```
   * @default 'Accept-Encoding'
   */
  vary?: string | string[];
  /**
   * Set to true if resource is private and should not be cached by shared caches.
   * This will set the `Cache-Control` header to `private`, and will not include the `s-maxage` directive.
   * This is useful for resources that should only be cached by the browser and not by CDNs.
   * @default false
   */
  private?: boolean;
};

/**
 * The interface for a CDN provider that can purge tags and generate CDN specific headers.
 * This is used to abstract away the details of the CDN provider so that the client can
 * work with any CDN provider that implements this interface.
 */
export type PurgeProvider = {
  /**
   * Purge the specified tags from the CDN.
   * @param tags - The tags to purge.
   * @returns A neverthrow `ResultAsync` that resolves to void on success, or rejects with a `PurgeError`.
   */
  purgeCache: (
    params: PurgeCacheParams,
  ) => ResultAsync<void, PurgeError>;
  /**
   * Generate CDN specific headers based on tags.
   * @returns An object containing the headers, where keys are header names and values are header values.
   */
  getCacheHeaders: (
    params: Pick<GetCacheHeadersParams, "tags">,
  ) => Record<string, string>;
};

/**
 * Configuration for the PurgeClient.
 */
export type PurgeClientConfig = Omit<GetCacheHeadersParams, "tags"> & {
  /**
   * The CDN provider to use for purging tags and generating CDN specific headers.
   * This should be an object that implements the `PurgeProvider` interface.
   */
  provider: PurgeProvider;
};

/**
 * CDN agnostic client for generating CDN cache control headers and purging tags.
 */
export type PurgeClient = {
  /**
   * Purge the specified tags from the CDN.
   * @param params - The parameters for purging the cache.
   * @returns A neverthrow `ResultAsync` that resolves to void on success, or rejects with a `PurgeError`.
   */
  purgeCache: (
    params: PurgeCacheParams,
  ) => ResultAsync<void, PurgeError>;

  /**
   * Get the cache headers for the specified tags.
   * This will generate the appropriate headers based on the configuration and tags.
   * @param params - The parameters for generating cache headers.
   * @returns An object containing the cache headers, where keys are header names and values are header values.
   */
  getCacheHeaders: (params: GetCacheHeadersParams) => Record<string, string>;
};

const defaultConfig: Omit<GetCacheHeadersParams, "tags"> = {
  maxAgeCDN: 3153536000, // 1 year
  maxAgeBrowser: 0, // no browser caching
  vary: "Accept-Encoding",
  private: false,
};

export function createPurge(config: PurgeClientConfig): PurgeClient {
  return {
    purgeCache: (params) => {
      return config.provider.purgeCache(params);
    },
    getCacheHeaders: ({ tags, ...params }) => {
      const providerHeaders = config.provider.getCacheHeaders({ tags });
      return {
        ...buildCommonHeaders({
          ...defaultConfig,
          ...config,
          ...params,
        }),
        ...providerHeaders,
      };
    },
  };
}

/**
 * Builds common cache headers based on the provided parameters.
 * This function constructs the `Cache-Control` and `Vary` headers
 * based on the specified max ages and vary headers.
 * @returns An object containing the constructed headers.
 */
export function buildCommonHeaders(
  params: Omit<GetCacheHeadersParams, "tags">,
): Record<string, string> {
  const headers: Record<string, string> = {};

  headers["Cache-Control"] = [
    (params.maxAgeCDN && !params.private) &&
    `s-maxage=${params.maxAgeCDN || 0}`,
    params.maxAgeBrowser && `max-age=${params.maxAgeBrowser || 0}`,
    "must-revalidate",
    params.private ? "private" : "public",
  ].filter(Boolean).join(", ");

  if (params.vary) {
    const varyHeaders = Array.isArray(params.vary)
      ? params.vary
      : [params.vary];
    headers["Vary"] = varyHeaders.join(", ");
  }

  return headers;
}
