export function assertNever(value: never, context?: string): never {
  const suffix = context ? ` in ${context}` : "";
  throw new Error(`Unhandled case${suffix}: ${String(value)}`);
}
