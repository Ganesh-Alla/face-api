// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Search as SearchIcon, User, Text, Download, Eye } from "lucide-react";
// import { searchPhotos, createFaceProfile, getPhotosByFace } from "@/services/photoService";
// import { Photo } from "@/types/database.types";
// import { useDropzone } from "react-dropzone";
// import { toast } from "sonner";
// import { supabase } from "@/lib/supabase";
// import Image from "next/image";

// const Search = () => {
//   const { user } = useAuth();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchType, setSearchType] = useState("prompt");
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchResults, setSearchResults] = useState<Photo[]>([]);
//   const [faceProfileName, setFaceProfileName] = useState("");
//   const [referenceImage, setReferenceImage] = useState<File | null>(null);
//   const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

//   // Handle text search
//   const handleSearch = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!searchQuery.trim() || !user) return;

//     setIsSearching(true);
//     try {
//       const results = await searchPhotos(user.id, searchQuery);
//       setSearchResults(results);
//     } catch (error) {
//       console.error("Search error:", error);
//       toast.error("Error searching photos. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   // Setup dropzone for face reference photo
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     accept: {
//       'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
//     },
//     maxFiles: 1,
//     onDrop: (acceptedFiles) => {
//       if (acceptedFiles.length > 0) {
//         const file = acceptedFiles[0];
//         setReferenceImage(file);
//         setReferenceImagePreview(URL.createObjectURL(file));
//       }
//     }
//   });

//   // Handle face profile creation
//   const handleCreateFaceProfile = async () => {
//     if (!user || !referenceImage || !faceProfileName.trim()) {
//       toast.error("Please provide a name and reference photo.");
//       return;
//     }

//     try {
//       // First, upload the reference image
//       const formData = new FormData();
//       formData.append('file', referenceImage);
      
//       const response = await fetch('https://api.upload.io/v2/accounts/12345/uploads/binary', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Authorization': 'Bearer public_12345'
//         }
//       });
      
//       const uploadData = await response.json();
//       const imageUrl = uploadData.fileUrl;
      
//       // Create face profile with the uploaded image URL
//       const profile = await createFaceProfile(user.id, faceProfileName, imageUrl);
      
//       if (profile) {
//         toast.success("Face profile created successfully!");
//         setFaceProfileName("");
//         setReferenceImage(null);
//         setReferenceImagePreview(null);
//       } else {
//         toast.error("Failed to create face profile. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error creating face profile:", error);
//       toast.error("Error creating face profile. Please try again.");
//     }
//   };

//   // Fetch face profiles for the user
//   const { data: faceProfiles, isLoading: loadingProfiles } = useQuery({
//     queryKey: ['faceProfiles', user?.id],
//     queryFn: async () => {
//       if (!user) return [];
      
//       const { data, error } = await supabase
//         .from('face_profiles')
//         .select('*')
//         .eq('user_id', user.id);
        
//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!user
//   });

//   // Search photos by selected face
//   const handleFaceSearch = async (faceId: string) => {
//     if (!user) return;
    
//     setIsSearching(true);
//     try {
//       const results = await getPhotosByFace(faceId, user.id);
//       setSearchResults(results);
//     } catch (error) {
//       console.error("Face search error:", error);
//       toast.error("Error searching photos by face. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground">Smart Search</h1>
//         <p className="mt-1 text-muted-foreground">
//           Find photos using face recognition or text prompts
//         </p>
//       </div>

//       <Tabs defaultValue="prompt" onValueChange={setSearchType} className="w-full">
//         <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
//           <TabsTrigger value="prompt" className="flex items-center gap-2">
//             <Text className="h-4 w-4" />
//             <span>Text Search</span>
//           </TabsTrigger>
//           <TabsTrigger value="face" className="flex items-center gap-2">
//             <User className="h-4 w-4" />
//             <span>Face Recognition</span>
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="prompt">
//           <Card>
//             <CardContent className="pt-6">
//               <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
//                 <div className="relative flex-grow">
//                   <SearchIcon className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
//                   <Input
//                     type="text"
//                     placeholder="Search for 'people dancing', 'cake cutting', etc."
//                     className="pl-9"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </div>
//                 <Button type="submit" disabled={isSearching}>
//                   {isSearching ? "Searching..." : "Search"}
//                 </Button>
//               </form>

//               <div className="mt-4">
//                 <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {["couple dancing", "group photo", "dinner table", "sunset", "beach"].map((term) => (
//                     <Button
//                       key={term}
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setSearchQuery(term);
//                       }}
//                     >
//                       {term}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="face">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Face Profile Creation */}
//             <Card>
//               <CardContent className="pt-6">
//                 <h3 className="font-semibold text-lg mb-4">Create Face Profile</h3>
//                 <div className="space-y-4">
//                   <Input
//                     placeholder="Profile Name (e.g., 'John Smith')"
//                     value={faceProfileName}
//                     onChange={(e) => setFaceProfileName(e.target.value)}
//                   />
                  
//                   <div 
//                     {...getRootProps()} 
//                     className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
//                       isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
//                     }`}
//                   >
//                     <input {...getInputProps()} />
                    
//                     {referenceImagePreview ? (
//                       <div className="flex flex-col items-center">
//                         <img 
//                           src={referenceImagePreview}
//                           alt="Reference face"
//                           className="h-32 w-32 object-cover rounded-full mb-2"
//                         />
//                         <p className="text-sm text-muted-foreground">Click or drag to replace</p>
//                       </div>
//                     ) : (
//                       <>
//                         <User className="mx-auto h-12 w-12 text-muted-foreground" />
//                         <p className="mt-2 text-foreground">
//                           Drag & drop or click to upload a reference photo
//                         </p>
//                         <p className="mt-1 text-sm text-muted-foreground">
//                           Choose a clear photo with a single face
//                         </p>
//                       </>
//                     )}
//                   </div>
                  
//                   <Button 
//                     className="w-full" 
//                     onClick={handleCreateFaceProfile}
//                     disabled={!referenceImage || !faceProfileName.trim()}
//                   >
//                     Create Face Profile
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
            
//             {/* Face Profiles List */}
//             <Card>
//               <CardContent className="pt-6">
//                 <h3 className="font-semibold text-lg mb-4">Your Face Profiles</h3>
                
//                 {loadingProfiles ? (
//                   <div className="text-center py-8">
//                     <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
//                     <p className="mt-2 text-muted-foreground">Loading profiles...</p>
//                   </div>
//                 ) : faceProfiles && faceProfiles.length > 0 ? (
//                   <div className="space-y-3">
//                     {faceProfiles.map(profile => (
//                       <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
//                         <img 
//                           src={profile.reference_photo_url} 
//                           alt={profile.name}
//                           className="h-12 w-12 rounded-full object-cover"
//                         />
//                         <div className="flex-1">
//                           <h4 className="font-medium">{profile.name}</h4>
//                           <p className="text-xs text-muted-foreground">Created {new Date(profile.created_at).toLocaleDateString()}</p>
//                         </div>
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={() => handleFaceSearch(profile.id)}
//                         >
//                           Find Photos
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-6">
//                     <User className="mx-auto h-12 w-12 text-muted-foreground" />
//                     <p className="mt-2 text-muted-foreground">No face profiles yet</p>
//                     <p className="text-sm text-muted-foreground">
//                       Create a profile to find photos by face
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>

//       {isSearching && (
//         <div className="text-center py-8">
//           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"/>
//           <p className="mt-2 text-muted-foreground">
//             {searchType === "prompt" 
//               ? `Searching for "${searchQuery}"...` 
//               : "Finding photos with this face..."}
//           </p>
//         </div>
//       )}

//       {!isSearching && searchResults.length > 0 && (
//         <div className="space-y-4">
//           <div className="flex justify-between items-center">
//             <h2 className="text-xl font-semibold">Search Results</h2>
//             <div className="flex items-center gap-2">
//               <p className="text-sm text-muted-foreground">Found {searchResults.length} matching photos</p>
//               <Button variant="outline" size="sm" onClick={() => setSearchResults([])}>
//                 Clear
//               </Button>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//             {searchResults.map((photo) => (
//               <div key={photo.id} className="group relative">
//                 <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
//                   <Image
//                     src={photo.url}
//                     alt={photo.name}
//                     width={100}
//                     height={100}
//                     className="h-full w-full object-cover transition-transform group-hover:scale-105"
//                   />
//                 </div>
//                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
//                   <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
//                     <a href={photo.url} target="_blank" rel="noopener noreferrer">
//                       <Eye className="h-4 w-4" />
//                     </a>
//                   </Button>
//                   <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
//                     <a href={photo.url} download={photo.name}>
//                       <Download className="h-4 w-4" />
//                     </a>
//                   </Button>
//                 </div>
//                 <p className="mt-1 text-sm text-foreground truncate">{photo.name}</p>
//                 {photo.tags && photo.tags.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-1">
//                     {photo.tags.slice(0, 3).map((tag, index) => (
//                       <span key={index} className="text-xs px-2 py-0.5 bg-muted rounded-full">
//                         {tag}
//                       </span>
//                     ))}
//                     {photo.tags.length > 3 && (
//                       <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
//                         +{photo.tags.length - 3}
//                       </span>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {!isSearching && searchResults.length === 0 && searchQuery && (
//         <div className="text-center py-8">
//           <div className="mx-auto rounded-full bg-muted p-3 w-fit">
//             <SearchIcon className="h-6 w-6 text-muted-foreground" />
//           </div>
//           <h3 className="mt-2 font-medium">No results found</h3>
//           <p className="text-muted-foreground">
//             Try different search terms or upload more photos
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Search;

import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page
