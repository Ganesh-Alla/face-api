"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, User, Text, Download, Eye, Tag, Sparkles } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import usePhotoStore, {type Photo } from "@/store/usePhotoStore";
import { Badge } from "@/components/ui/badge";

const Search = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("prompt");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const [faceProfileName, setFaceProfileName] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<string[]>([
    "wedding", "party", "beach", "mountain", "family", 
    "friends", "sunset", "food", "travel", "birthday",
    "ceremony", "dancing", "group photo", "children", "pets"
  ]);

  // Get photo store functions
  const { 
    searchPhotosByText,
    isLoading 
  } = usePhotoStore();

  // Handle text search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchPhotosByText(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching photos. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle keyword selection
  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(prev => prev.filter(k => k !== keyword));
    } else {
      setSelectedKeywords(prev => [...prev, keyword]);
    }
  };

  // Update search query when keywords change
  useEffect(() => {
    if (selectedKeywords.length > 0) {
      setSearchQuery(selectedKeywords.join(' '));
    }
  }, [selectedKeywords]);

  // Setup dropzone for face reference photo
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setReferenceImage(file);
        setReferenceImagePreview(URL.createObjectURL(file));
      }
    }
  });

  // Handle face profile creation
  const handleCreateFaceProfile = async () => {
    if (!user || !referenceImage || !faceProfileName.trim()) {
      toast.error("Please provide a name and reference photo.");
      return;
    }

    toast.info("Face profile creation is not fully implemented yet.");
    // This would be implemented with the face recognition functionality
  };

  // Search photos by selected face
  const handleFaceSearch = async (faceId: string) => {
    toast.info("Face search is not fully implemented yet.");
    // This would be implemented with the face recognition functionality
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Search</h1>
        <p className="mt-1 text-muted-foreground">
          Find photos using AI-powered semantic search or face recognition
        </p>
      </div>

      <Tabs defaultValue="prompt" onValueChange={setSearchType} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Semantic Search</span>
          </TabsTrigger>
          <TabsTrigger value="face" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Face Recognition</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for 'beach sunset', 'wedding ceremony', etc."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSearching || isLoading}>
                  {isSearching || isLoading ? "Searching..." : "Search"}
                </Button>
              </form>

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Popular keywords:</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-muted/80"
                      onClick={() => toggleKeyword(keyword)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="face">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Face Profile Creation */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Create Face Profile</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Profile Name (e.g., 'John Smith')"
                    value={faceProfileName}
                    onChange={(e) => setFaceProfileName(e.target.value)}
                  />
                  
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    
                    {referenceImagePreview ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={referenceImagePreview}
                          alt="Reference face"
                          className="h-32 w-32 object-cover rounded-full mb-2"
                        />
                        <p className="text-sm text-muted-foreground">Click or drag to replace</p>
                      </div>
                    ) : (
                      <>
                        <User className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-foreground">
                          Drag & drop or click to upload a reference photo
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Choose a clear photo with a single face
                        </p>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleCreateFaceProfile}
                    disabled={!referenceImage || !faceProfileName.trim()}
                  >
                    Create Face Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Face Profiles List */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Your Face Profiles</h3>
                
                <div className="text-center py-6">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No face profiles yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a profile to find photos by face
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {isSearching && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"/>
          <p className="mt-2 text-muted-foreground">
            {searchType === "prompt" 
              ? `Searching for "${searchQuery}"...` 
              : "Finding photos with this face..."}
          </p>
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Found {searchResults.length} matching photos</p>
              <Button variant="outline" size="sm" onClick={() => setSearchResults([])}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {searchResults.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                  <Image
                    src={photo.url}
                    alt={photo.context || "Photo"}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                    <a href={photo.url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                    <a href={photo.url} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                
                {/* Photo details */}
                <div className="mt-2">
                  {photo.eventType && (
                    <p className="text-xs font-medium text-primary">{photo.eventType}</p>
                  )}
                  {photo.setting && (
                    <p className="text-sm truncate">{photo.setting}</p>
                  )}
                  {photo.keywords && photo.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.keywords.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-0.5 bg-muted rounded-full cursor-pointer hover:bg-muted/80"
                          onClick={() => setSearchQuery(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                      {photo.keywords.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          +{photo.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSearching && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <div className="mx-auto rounded-full bg-muted p-3 w-fit">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-2 font-medium">No results found</h3>
          <p className="text-muted-foreground">
            Try different search terms or upload more photos
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
