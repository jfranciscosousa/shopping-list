export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
        <div className="size-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm">Preparing your list...</p>
      </div>
    </div>
  );
}
