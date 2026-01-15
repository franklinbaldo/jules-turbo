import { SourcesList } from "../features/sources/SourcesList";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
        <p className="text-muted-foreground">
          Manage your connected repositories and start new sessions.
        </p>
      </div>
      <SourcesList />
    </div>
  );
}
