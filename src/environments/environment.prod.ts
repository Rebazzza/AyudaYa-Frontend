type RuntimeConfig = { apiUrl?: string; storageUrl?: string };

const runtimeConfig = (globalThis as typeof globalThis & {
  __AYUDAYA_RUNTIME_CONFIG__?: RuntimeConfig;
}).__AYUDAYA_RUNTIME_CONFIG__;

export const environment = {
  production: true,
  apiUrl: runtimeConfig?.apiUrl ?? 'http://localhost:8080/api/v1',
  storageUrl: runtimeConfig?.storageUrl ?? 'http://localhost:8080',
};
