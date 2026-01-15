import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Calendar, MessageSquare, ArrowRight, RefreshCw } from "lucide-react";
import { Session, SessionState } from "../../lib/schema";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "QUEUED": "secondary",
  "PLANNING": "secondary",
  "AWAITING_PLAN_APPROVAL": "default", // Attention needed
  "IN_PROGRESS": "secondary",
  "COMPLETED": "outline", // Done
  "FAILED": "destructive",
  "CANCELLED": "outline",
  "STATE_UNSPECIFIED": "outline"
};

export function SessionsList() {
  const { apiKey } = useAuth();
  const navigate = useNavigate();
  // Simple pagination logic for now (load more style)
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  // Note: standard useQuery is for single page. useInfiniteQuery is better for "load more"
  // But for simplicity in this iteration I'll stick to a simple list or just fetching one page.
  // Let's do useQuery with manual state management for "appending" if we wanted infinite scroll,
  // but for MVP, just paginating pages or showing the first page is okay. 
  // Let's try to support simple "Next Page" for now.

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["sessions", pageToken],
    queryFn: () => api.sessions.list(apiKey || "", 30, pageToken),
    enabled: !!apiKey,
  });

  if (isLoading && !data) return <div className="text-center p-8">Loading sessions...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading sessions: {(error as Error).message}</div>;

  const sessions = data?.sessions || [];
  const nextPageToken = data?.nextPageToken;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
             <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
             Refresh
          </Button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session: Session) => (
          <Card key={session.name} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/sessions/${encodeURIComponent(session.name)}`)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <CardTitle className="text-lg">
                        {/* Title is optional, prompt is required. Use prompt snippet if no title */}
                        {session.prompt ? (session.prompt.length > 60 ? session.prompt.substring(0, 60) + "..." : session.prompt) : "Untitled Session"}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-gray-400">
                        {session.name}
                    </CardDescription>
                 </div>
                 <Badge variant={statusColors[session.state as string] || "outline"}>
                    {session.state}
                 </Badge>
              </div>
            </CardHeader>
            <CardContent>
               <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {session.createTime ? formatDistanceToNow(new Date(session.createTime), { addSuffix: true }) : "Unknown date"}
                  </div>
                  {/* Add more metadata here if available */}
               </div>
            </CardContent>
            <CardFooter className="pt-0">
               <div className="w-full flex justify-end">
                   <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                       View Details <ArrowRight className="ml-1 h-4 w-4" />
                   </Button>
               </div>
            </CardFooter>
          </Card>
        ))}
        {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                No sessions found. Start a new one from the Sources page!
            </div>
        )}
      </div>

      {nextPageToken && (
        <div className="flex justify-center pt-4">
            <Button onClick={() => setPageToken(nextPageToken)} disabled={isFetching}>
                Load More
            </Button>
        </div>
      )}
    </div>
  );
}
