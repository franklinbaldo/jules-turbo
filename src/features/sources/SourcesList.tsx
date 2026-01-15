import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Search, GitBranch } from "lucide-react";
import { Source } from "../../lib/schema";
import { CreateSessionDialog } from "../sessions/CreateSessionDialog";

export function SourcesList() {
  const { apiKey } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sources"],
    queryFn: () => api.sources.list(apiKey || ""),
    enabled: !!apiKey,
  });

  const filteredSources = data?.sources?.filter((source) => 
    source.githubRepo?.repo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    source.githubRepo?.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="text-center p-8">Loading sources...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading sources: {(error as Error).message}</div>;

  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => refetch()} variant="outline">Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources?.map((source: Source) => (
          <Card key={source.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                 <CardTitle className="text-lg font-bold truncate" title={source.githubRepo?.repo}>
                    {source.githubRepo?.owner}/{source.githubRepo?.repo}
                 </CardTitle>
                 {/* Placeholder for private badge if available in future */}
              </div>
              <CardDescription className="truncate">
                {source.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                   <GitBranch className="mr-2 h-4 w-4" />
                   {source.githubRepo?.defaultBranch || "main"}
                </div>
                {source.githubRepo?.branches && source.githubRepo.branches.length > 0 && (
                   <div className="flex flex-wrap gap-1 mt-2">
                      {source.githubRepo.branches.slice(0, 3).map((b, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {b.name || b.displayName}
                        </Badge>
                      ))}
                      {source.githubRepo.branches.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{source.githubRepo.branches.length - 3}
                        </Badge>
                      )}
                   </div>
                )}
                <div className="pt-4">
                    <Button className="w-full" onClick={() => setSelectedSource(source)}>Create Session</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!filteredSources || filteredSources.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-500">
                No sources found.
            </div>
        )}
      </div>

      {selectedSource && (
        <CreateSessionDialog 
            open={!!selectedSource} 
            onOpenChange={(open) => !open && setSelectedSource(null)}
            source={selectedSource}
        />
      )}
    </div>
  );
}
