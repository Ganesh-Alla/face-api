import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, MapPin, ImageIcon, User, MoreHorizontal, Share, Download, Edit, Trash } from 'lucide-react'
import  useEventStore  from '@/store/useEventStore'
import { ChevronLeft } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// import { Switch } from '@/components/ui/switch'
// import { Label } from '@/components/ui/label'
// import { Input } from '@/components/ui/input'
// import { useState } from 'react';

const EventHeader = () => {
  const router = useRouter();
  const { event } = useEventStore();
  // const [shareDialogOpen, setShareDialogOpen] = useState(false);
  if (!event) return null;
  return (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/events")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-wrap gap-4">
              {event?.date && (
                <Badge variant="outline" className="flex items-center">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {format(new Date(event.date), "PPP")}
                </Badge>
              )}
              
              {event?.location && (
                <Badge variant="outline" className="flex items-center">
                  <MapPin className="mr-1 h-3 w-3" />
                  {event.location}
                </Badge>
              )}
              
              <Badge variant="outline" className="flex items-center">
                <ImageIcon className="mr-1 h-3 w-3" />
                {event?.photo_count || 0} {(event?.photo_count || 0) === 1 ? "photo" : "photos"}
              </Badge>
              
              {event?.is_public && (
                <Badge variant="outline" className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  Public event
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem 
                // onClick={handleEventDelete} 
                className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline"
              // onClick={() => setShareDialogOpen(true)}
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="default"
            //   onClick={handleDownloadAll}
            //   disabled={downloadingZip || (photos?.length || 0) === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
              {/* {downloadingZip ? "Preparing..." : "Download All"} */}
            </Button>
          </div>
                  {/* Share Dialog */}
         {/* <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
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
                    className="flex-1 rounded-md border px-3 py-2"
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
                  onClick={() => setShareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateShareLink}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? "Creating..." : "Create Link"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setShareDialogOpen(false)}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
   */}
        </div>
    
  )
}

export default EventHeader