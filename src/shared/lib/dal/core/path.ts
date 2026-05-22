export function interpolatePath(
  path: string,
  pathParams?: Record<string, string | number>,
): string {
  if (!pathParams) {
    return path;
  }
  let out = path;
  for (const [key, value] of Object.entries(pathParams)) {
    out = out.replaceAll(`{${key}}`, encodeURIComponent(String(value)));
  }
  return out;
}
