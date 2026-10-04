let sourceId: string | undefined;

export function getTabSourceId() {
  return (sourceId ??= crypto.randomUUID());
}
