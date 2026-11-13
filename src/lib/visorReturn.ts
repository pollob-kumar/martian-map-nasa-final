export function isMarswalkEntry(value: unknown): boolean {
  return value === true || value === "true";
}

export function visorReturnMarker(value: unknown): "marswalk" | undefined {
  return value === "marswalk" ? "marswalk" : undefined;
}