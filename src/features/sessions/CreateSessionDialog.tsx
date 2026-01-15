import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useNavigate } from "react-router-dom";
import { Source } from "../../lib/schema";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: Source;
}

export function CreateSessionDialog({ open, onOpenChange, source }: CreateSessionDialogProps) {
  const { apiKey } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [prompt, setPrompt] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(source.githubRepo?.defaultBranch || "main");
  // Optional features not yet fully implemented in UI but useful for API
  const [requirePlanApproval, setRequirePlanApproval] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: any) => api.sessions.create(apiKey || "", payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      navigate(`/sessions/${encodeURIComponent(data.name)}`);
    },
    onError: (error: Error) => {
        alert("Failed to create session: " + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const payload = {
      prompt,
      sourceContext: {
        source: source.name,
      },
      githubRepoContext: {
        startingBranch: selectedBranch,
      },
      requirePlanApproval,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Session</DialogTitle>
          <DialogDescription>
            Create a new coding task for {source.githubRepo?.repo}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch" className="text-right">
              Branch
            </Label>
            <select
              id="branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                {source.githubRepo?.branches?.map(b => (
                    <option key={b.name} value={b.name}>{b.name || b.displayName}</option>
                ))}
                {!source.githubRepo?.branches?.length && <option value="main">main</option>}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="prompt" className="text-right">
              Prompt
            </Label>
            <div className="col-span-3">
                 <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the task..."
                    required
                />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <div className="col-start-2 col-span-3 flex items-center space-x-2">
                 <input
                    type="checkbox"
                    id="approval"
                    checked={requirePlanApproval}
                    onChange={(e) => setRequirePlanApproval(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                 />
                 <Label htmlFor="approval" className="font-normal">Require Plan Approval</Label>
             </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
