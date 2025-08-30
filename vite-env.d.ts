/// <reference types="vite/client" />

// FIX: Add explicit type definitions for process.env to resolve TypeScript errors.
// This ensures that TypeScript recognizes the `process.env.API_KEY` property
// as required by the @google/genai SDK guidelines. This change fixes the original
// error related to environment variables and the error about vite/client types
// not being found by providing necessary type information directly.
declare var process: {
  env: {
    API_KEY: string;
  }
};
