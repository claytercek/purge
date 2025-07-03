import type { AstroIntegration } from 'astro';
import type { PurgeClientConfig } from "@purge/core";
export { cacheTags, getCurrentPurgeContext } from "@purge/core/context";

const purge = ({ ...clientConfig }: PurgeClientConfig): AstroIntegration => {
  return {
    name: "@purge/astro",
    hooks: {
      "astro:config:setup": ({ addMiddleware, updateConfig }) => {
        addMiddleware({
          entrypoint: "@purge/astro/middleware",
          order: 'pre'
        });

        updateConfig({
          vite: {
            plugins: [{
              name: '@purge/astro',
              resolveId(id) {
                if (id === '@purge/astro/client') {
                  return id;
                }
              },
              load(id) {
                if (id === '@purge/astro/client') {
                  return `
                    export const purgeClientConfig = ${JSON.stringify(clientConfig)};`;
                }
              }
            }]
          }
        });

      },
    },
  }
}

export default purge;