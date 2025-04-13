import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ImageIcon } from 'lucide-react'
import useEventStore from '@/store/useEventStore'

const EventCover = () => {
  const { event } = useEventStore();

  if (!event) return null;
  return (
        <div className="relative w-full rounded-lg overflow-hidden">
        {event?.cover_image_url ? (
          <div className="w-full h-48 md:h-64 relative">
            <Image
              src={event.cover_image_url} 
              alt={event.name} 
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
            
            {/* Cover image overlay actions */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary">
                <Upload className="mr-2 h-4 w-4" />
                Change Cover
              </Button>
            </div>
            
            {/* Event title overlay */}
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold text-white">{event.name}</h1>
              {event.description && (
                <p className="text-white/80 max-w-2xl">{event.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-muted flex flex-col items-center justify-center relative">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No cover image</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Add Cover Image
            </Button>
            
            <div className="absolute bottom-4 left-4">
              <h1 className="text-3xl font-bold">{event?.name}</h1>
              {event?.description && (
                <p className="text-muted-foreground max-w-2xl">{event.description}</p>
              )}
            </div>
          </div>
        )}
        
      </div>
  )
}

export default EventCover