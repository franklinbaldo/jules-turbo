import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ActivitiesTimeline } from "../features/activities/ActivitiesTimeline";
import { ArrowLeft, Send, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { Session, SessionState } from "../lib/schema";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "QUEUED": "secondary",
  "PLANNING": "secondary",
  "AWAITING_PLAN_APPROVAL": "default", 
  "IN_PROGRESS": "secondary",
  "COMPLETED": "outline", 
  "FAILED": "destructive",
  "CANCELLED": "outline",
  "STATE_UNSPECIFIED": "outline"
};

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  // Decode the encoded name passed in URL
  const sessionName = decodeURIComponent(sessionId || "");

  const { apiKey } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: session, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["session", sessionName],
    queryFn: () => api.sessions.get(apiKey || "", sessionName),
    enabled: !!apiKey && !!sessionName,
    refetchInterval: (query: any) => {
        const data = query.state.data as Session | undefined;
        if (data && ["QUEUED", "PLANNING", "IN_PROGRESS", "AWAITING_PLAN_APPROVAL"].includes(data.state || "")) return 3000;
        return false;
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => api.sessions.sendMessage(apiKey || "", sessionName, msg),
    onSuccess: () => {
        setMessage("");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["activities", sessionName] });
    },
    onError: (err: Error) => alert("Failed to send message: " + err.message)
  });

  const approvePlanMutation = useMutation({
    mutationFn: () => api.sessions.approvePlan(apiKey || "", sessionName),
    onSuccess: () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["activities", sessionName] });
    },
    onError: (err: Error) => alert("Failed to approve plan: " + err.message)
  });

  if (isLoading) return <div className="p-8 text-center">Loading session...</div>;
  if (error) return (
      <div className="p-8 space-y-4">
          <div className="text-red-500">Error: {(error as Error).message}</div>
          <Button onClick={() => navigate("/sessions")}>Back to Sessions</Button>
      </div>
  );
  if (!session) return <div>Session not found</div>;

  const isActive = ["QUEUED", "PLANNING", "IN_PROGRESS", "AWAITING_PLAN_APPROVAL"].includes(session.state || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={() => navigate("/sessions")} className="pl-0 hover:bg-transparent">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sessions
         </Button>
         <div className="flex items-center space-x-2">
             <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                 <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
             </Button>
             {session.url && (
                 <a href={session.url} target="_blank" rel="noreferrer">
                     <Button variant="outline" size="sm">
                         Open in Jules <ExternalLink className="ml-2 h-4 w-4" />
                     </Button>
                 </a>
             )}
         </div>
      </div>

      <Card>
          <CardHeader>
              <div className="flex justify-between items-start">
                  <div className="space-y-1">
                      <CardTitle className="text-xl">{session.prompt || "Untitled Session"}</CardTitle>
                      <CardDescription className="font-mono text-xs">{session.name}</CardDescription>
                  </div>
                  <Badge variant={statusColors[session.state as string] || "outline"} className="text-sm px-3 py-1">
                      {session.state}
                  </Badge>
              </div>
          </CardHeader>
          <CardContent className="space-y-4">
              {session.state === "AWAITING_PLAN_APPROVAL" && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                          <CheckCircle className="h-5 w-5" />
                          <span>This session is waiting for your approval to proceed with the plan.</span>
                      </div>
                      <Button 
                        onClick={() => approvePlanMutation.mutate()} 
                        disabled={approvePlanMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                          {approvePlanMutation.isPending ? "Approving..." : "Approve Plan"}
                      </Button>
                  </div>
              )}

              {isActive && (
                  <div className="flex gap-2 items-end pt-4">
                      <div className="flex-1">
                          <Input 
                              placeholder="Send a message to Jules..." 
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && message.trim() && sendMessageMutation.mutate(message)}
                              disabled={sendMessageMutation.isPending}
                          />
                      </div>
                      <Button 
                          onClick={() => sendMessageMutation.mutate(message)} 
                          disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                          {sendMessageMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                  </div>
              )}
          </CardContent>
      </Card>

      <ActivitiesTimeline sessionName={sessionName} isActive={isActive} />
    </div>
  );
}
