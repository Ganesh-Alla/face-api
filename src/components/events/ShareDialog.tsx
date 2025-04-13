// components/events/ShareDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import useEventStore from "@/store/useEventStore";

export default function ShareDialog() {
  const { 
    shareDialogOpen,
    selectedEventId,
    shareLink,
    requiresFaceAuth,
    setShareDialogOpen,
    setRequiresFaceAuth,
    createShareableLink,
    resetShareState
  } = useEventStore();
  
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLink = async () => {
    if (!selectedEventId) return;
    
    setIsCreating(true);
    try {
      await createShareableLink(selectedEventId, requiresFaceAuth);
    } catch (error) {
      console.error("Error creating share link:", error);
      toast.error("Failed to create shareable link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleClose = () => {
    setShareDialogOpen(false);
    // Reset the share state when dialog closes
    setTimeout(() => {
      resetShareState();
    }, 300);
  };

  return (
    <Dialog open={shareDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
          <DialogDescription>
            Create a shareable link to let others view this event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!shareLink ? (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="face-auth"
                  checked={requiresFaceAuth}
                  onCheckedChange={setRequiresFaceAuth}
                />
                <Label htmlFor="face-auth">
                  Require face authentication
                </Label>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {requiresFaceAuth 
                  ? "Viewers will need to upload a selfie to access photos that have their face in them."
                  : "Anyone with the link can view all photos in this event."}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyShareLink}
                >
                  Copy
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {requiresFaceAuth 
                  ? "This link will require face authentication for photo access."
                  : "Anyone with this link can view all photos in this event."}
              </p>
            </>
          )}
        </div>
        
        <DialogFooter>
          {!shareLink ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLink}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Link"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}