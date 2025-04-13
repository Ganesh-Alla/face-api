// "use client"
// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { PlusCircle, BookImage, MoreHorizontal, Edit, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";

// // Mock album data
// const initialAlbums = [
//   {
//     id: "1",
//     title: "Wedding of Sarah & John",
//     date: "April 15, 2025",
//     imageCount: 248,
//     coverImage: "https://picsum.photos/400/300?random=1",
//   },
//   {
//     id: "2",
//     title: "Corporate Event",
//     date: "March 22, 2025",
//     imageCount: 156,
//     coverImage: "https://picsum.photos/400/300?random=2",
//   },
//   {
//     id: "3",
//     title: "Birthday Party",
//     date: "February 10, 2025",
//     imageCount: 87,
//     coverImage: "https://picsum.photos/400/300?random=3",
//   },
// ];

// const Albums = () => {
//   const [albums, setAlbums] = useState(initialAlbums);
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [newAlbumTitle, setNewAlbumTitle] = useState("");

//   const handleCreateAlbum = () => {
//     if (!newAlbumTitle.trim()) {
//       toast({
//         title: "Album title required",
//         description: "Please enter a title for your new album",
//         variant: "destructive",
//       });
//       return;
//     }

//     const newAlbum = {
//       id: Date.now().toString(),
//       title: newAlbumTitle,
//       date: new Date().toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//       }),
//       imageCount: 0,
//       coverImage: "https://picsum.photos/400/300?random=" + Date.now(),
//     };

//     setAlbums([...albums, newAlbum]);
//     setNewAlbumTitle("");
//     setIsCreateDialogOpen(false);

//     toast({
//       title: "Album created",
//       description: `${newAlbumTitle} has been created successfully`,
//     });
//   };

//   const handleDeleteAlbum = (id: string) => {
//     const albumToDelete = albums.find(album => album.id === id);
//     if (!albumToDelete) return;

//     setAlbums(albums.filter(album => album.id !== id));
    
//     toast({
//       title: "Album deleted",
//       description: `${albumToDelete.title} has been deleted`,
//     });
//   };

//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Digital Albums</h1>
//           <p className="mt-1 text-gray-500">
//             Create and manage albums to deliver to your clients
//           </p>
//         </div>
//         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="flex items-center gap-2">
//               <PlusCircle className="h-4 w-4" />
//               <span>New Album</span>
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Create a new album</DialogTitle>
//               <DialogDescription>
//                 Give your album a name. You can add photos to it later.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="album-title">Album Title</Label>
//                 <Input
//                   id="album-title"
//                   placeholder="e.g., Wedding of Sarah & John"
//                   value={newAlbumTitle}
//                   onChange={(e) => setNewAlbumTitle(e.target.value)}
//                 />
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleCreateAlbum}>Create Album</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {albums.length === 0 ? (
//         <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
//           <BookImage className="mx-auto h-12 w-12 text-gray-400" />
//           <h3 className="mt-2 text-lg font-medium text-gray-900">No albums yet</h3>
//           <p className="mt-1 text-gray-500">Get started by creating a new album</p>
//           <div className="mt-6">
//             <Button onClick={() => setIsCreateDialogOpen(true)}>
//               Create your first album
//             </Button>
//           </div>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {albums.map((album) => (
//             <Card key={album.id} className="overflow-hidden group">
//               <div className="relative">
//                 <Link to={`/albums/${album.id}`}>
//                   <div className="aspect-video overflow-hidden">
//                     <img
//                       src={album.coverImage}
//                       alt={album.title}
//                       className="h-full w-full object-cover transition-transform group-hover:scale-105"
//                     />
//                   </div>
//                 </Link>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 p-1"
//                     >
//                       <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent>
//                     <DropdownMenuItem className="cursor-pointer">
//                       <Edit className="mr-2 h-4 w-4" />
//                       <span>Edit Album</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem 
//                       className="cursor-pointer text-red-600 focus:text-red-600" 
//                       onClick={() => handleDeleteAlbum(album.id)}
//                     >
//                       <Trash2 className="mr-2 h-4 w-4" />
//                       <span>Delete Album</span>
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//               <CardContent className="p-4">
//                 <Link to={`/albums/${album.id}`}>
//                   <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors">
//                     {album.title}
//                   </h3>
//                 </Link>
//                 <div className="flex justify-between items-center mt-1">
//                   <p className="text-sm text-gray-500">{album.date}</p>
//                   <p className="text-sm text-gray-500">{album.imageCount} photos</p>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Albums;

import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page
