const UUID_BYTES = 16;

/**
 * Generates a RFC 4122 version 4 UUID without depending on randomUUID being
 * exposed by the current browser context. `getRandomValues` remains available
 * in the supported secure browser contexts and provides the required entropy.
 */
export function createUuid(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== "function") {
    throw new Error("Este navegador não disponibiliza Web Crypto para gerar um identificador seguro.");
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(UUID_BYTES));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
