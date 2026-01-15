import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Activity } from "../../lib/schema";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Code, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ActivitiesTimelineProps {
  sessionName: string;
  isActive: boolean;
}

export function ActivitiesTimeline({ sessionName, isActive }: ActivitiesTimelineProps) {
  const { apiKey } = useAuth();
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["activities", sessionName, pageToken],
    queryFn: () => api.activities.list(apiKey || "", sessionName, 50, pageToken),
    enabled: !!apiKey,
    refetchInterval: isActive ? 5000 : false, // Poll if active
  });

  const activities = data?.activities || [];
  const nextPageToken = data?.nextPageToken;

  if (isLoading && !activities.length) return <div className="text-center p-8 text-gray-500">Loading timeline...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-200 rounded">Error loading timeline: {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="text-lg font-semibold">Activity Timeline</h3>
         <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
             <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
         </Button>
      </div>
      
      <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
        {activities.map((activity: Activity) => (
          <div key={activity.name} className="mb-8 ml-6 relative">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-9 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
               {getActivityIcon(activity)}
            </span>
            <Card className="border shadow-none">
              <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">
                        {/* Try to extract a friendly title from name or type */}
                        {formatActivityTitle(activity)}
                    </CardTitle>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {activity.createTime ? formatDistanceToNow(new Date(activity.createTime), { addSuffix: true }) : ""}
                    </span>
                  </div>
              </CardHeader>
              <CardContent className="p-3 pt-2 text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
                 {/* Render content based on type or raw JSON drawer */}
                 <details>
                    <summary className="cursor-pointer text-xs text-blue-500 hover:text-blue-700 select-none">Show Raw Data</summary>
                    <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(activity, null, 2)}
                    </pre>
                 </details>
              </CardContent>
            </Card>
          </div>
        ))}
        {!activities.length && (
            <div className="ml-6 text-gray-500 italic">No activities yet.</div>
        )}
      </div>

       {nextPageToken && (
        <div className="flex justify-center pt-2 pl-6">
            <Button onClick={() => setPageToken(nextPageToken)} variant="outline" size="sm" disabled={isFetching}>
                Load Older Activities
            </Button>
        </div>
      )}
    </div>
  );
}

function getActivityIcon(activity: Activity) {
    // Determine icon based on type (if available) or parsing the name
    const type = activity.type || "";
    if (type.includes("message") || activity.name.includes("message")) return <MessageSquare className="w-3 h-3 text-blue-600" />;
    if (type.includes("tool") || activity.name.includes("tool")) return <Code className="w-3 h-3 text-purple-600" />;
    return <AlertCircle className="w-3 h-3 text-gray-600" />;
}

function formatActivityTitle(activity: Activity) {
    // The name is usually long like projects/.../activities/uuid
    // We can try to show the type or ID.
    const parts = activity.name.split("/");
    const id = parts[parts.length - 1];
    return activity.type || `Activity ${id.substring(0, 8)}`;
}
