// FIX: Removed reference to 'vite/client' which was causing a type resolution error.
// Switched to declaring process.env.API_KEY to align with @google/genai guidelines,
// which resolves the TypeScript errors.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
  }
}
