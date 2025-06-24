import { assertEquals, assertObjectMatch } from "@std/assert";
import { assertSpyCallArg, assertSpyCalls, spy } from "@std/testing/mock";
import { okAsync } from "neverthrow";
import {
  createPurge,
  type PurgeClientConfig,
  type PurgeProvider,
} from "./mod.ts";

function createMockProvider() {
  const purgeCacheSpy = spy(() => okAsync(undefined));
  const getCacheHeadersSpy = spy(() => ({
    "X-Provider-Header": "provider-value",
  }));

  return {
    provider: {
      purgeCache: purgeCacheSpy,
      getCacheHeaders: getCacheHeadersSpy,
    } as PurgeProvider,
    purgeCacheSpy,
    getCacheHeadersSpy,
  };
}

function createTestClient(config: Partial<PurgeClientConfig> = {}) {
  const { provider, purgeCacheSpy, getCacheHeadersSpy } = createMockProvider();
  return {
    client: createPurge({ provider, ...config }),
    purgeCacheSpy,
    getCacheHeadersSpy,
  };
}

Deno.test("createPurge - basic functionality", async (t) => {
  await t.step("creates a purge client with correct methods", () => {
    const { client } = createTestClient();

    assertEquals(typeof client.purgeCache, "function");
    assertEquals(typeof client.getCacheHeaders, "function");
  });

  await t.step("delegates purgeCache to provider", async () => {
    const { client, purgeCacheSpy } = createTestClient();
    const params = { tags: ["tag1", "tag2"] };

    await client.purgeCache(params);

    assertSpyCalls(purgeCacheSpy, 1);
    assertSpyCallArg(purgeCacheSpy, 0, 0, params);
  });

  await t.step("merges provider headers with common headers", () => {
    const { client, getCacheHeadersSpy } = createTestClient();
    const params = { tags: ["tag1"] };

    const headers = client.getCacheHeaders(params);

    assertSpyCalls(getCacheHeadersSpy, 1);
    assertSpyCallArg(getCacheHeadersSpy, 0, 0, params);
    assertEquals(headers, {
      "Cache-Control": "s-maxage=3153536000, must-revalidate, public",
      "Vary": "Accept-Encoding",
      "X-Provider-Header": "provider-value",
    });
  });
});

Deno.test("createPurge - configuration override", async (t) => {
  await t.step("overrides defaults with config values", () => {
    const { client } = createTestClient({
      maxAgeCDN: 86400,
      maxAgeBrowser: 3600,
      vary: ["Accept-Language", "User-Agent"],
      private: false,
    });

    const headers = client.getCacheHeaders({ tags: ["tag1"] });

    assertObjectMatch(headers, {
      "Cache-Control": "s-maxage=86400, max-age=3600, must-revalidate, public",
      "Vary": "Accept-Language, User-Agent",
    });
  });

  await t.step("overrides config with params values", () => {
    const { client } = createTestClient({
      maxAgeCDN: 86400,
      maxAgeBrowser: 3600,
    });

    const headers = client.getCacheHeaders({
      tags: ["tag1"],
      maxAgeCDN: 7200,
      maxAgeBrowser: 1800,
      vary: "Accept-Language",
    });

    assertObjectMatch(headers, {
      "Cache-Control": "s-maxage=7200, max-age=1800, must-revalidate, public",
      "Vary": "Accept-Language",
    });
  });
});

Deno.test("createPurge - cache control generation", async (t) => {
  const testCases = [
    {
      name: "private cache",
      params: {
        tags: ["tag1"],
        private: true,
        maxAgeCDN: 86400,
        maxAgeBrowser: 3600,
      },
      expected: "max-age=3600, must-revalidate, private",
    },
    {
      name: "zero max ages",
      params: { tags: ["tag1"], maxAgeCDN: 0, maxAgeBrowser: 0 },
      expected: "must-revalidate, public",
    },
    {
      name: "browser cache only",
      params: { tags: ["tag1"], maxAgeCDN: 0, maxAgeBrowser: 3600 },
      expected: "max-age=3600, must-revalidate, public",
    },
    {
      name: "CDN cache only",
      params: { tags: ["tag1"], maxAgeCDN: 86400, maxAgeBrowser: 0 },
      expected: "s-maxage=86400, must-revalidate, public",
    },
  ];

  for (const { name, params, expected } of testCases) {
    await t.step(name, () => {
      const { client } = createTestClient();
      const headers = client.getCacheHeaders(params);
      assertEquals(headers["Cache-Control"], expected);
    });
  }
});

Deno.test("createPurge - vary header handling", async (t) => {
  const testCases = [
    {
      name: "single vary header as string",
      vary: "Accept-Language",
      expected: "Accept-Language",
    },
    {
      name: "multiple vary headers as array",
      vary: ["Accept-Language", "User-Agent", "Accept-Encoding"],
      expected: "Accept-Language, User-Agent, Accept-Encoding",
    },
  ];

  for (const { name, vary, expected } of testCases) {
    await t.step(name, () => {
      const { client } = createTestClient();
      const headers = client.getCacheHeaders({ tags: ["tag1"], vary });
      assertEquals(headers["Vary"], expected);
    });
  }

  await t.step("no vary header when undefined", () => {
    const { client } = createTestClient({ vary: undefined });
    const headers = client.getCacheHeaders({ tags: ["tag1"], vary: undefined });
    assertEquals(Object.hasOwn(headers, "Vary"), false);
  });
});
