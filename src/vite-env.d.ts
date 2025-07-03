/// <reference types="vite/client" />

declare global {
  interface Window {
    Buffer: typeof Buffer
  }
  const Buffer: typeof import('buffer').Buffer
}
