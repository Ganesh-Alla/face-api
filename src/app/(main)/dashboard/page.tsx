
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Upload, Search, BookImage } from "lucide-react";

const Dashboard = () => {
  // Mock statistics
  const stats = [
    { name: "Total Images", value: "1,248" },
    { name: "Albums Created", value: "12" },
    { name: "Smart Searches", value: "56" },
  ];

  // Feature cards data
  const features = [
    {
      title: "Upload & Manage",
      description: "Upload and organize your event photos in one place",
      icon: Upload,
      link: "/upload",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Smart Search",
      description: "Find photos using face recognition or text prompts",
      icon: Search,
      link: "/search",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Digital Albums",
      description: "Create beautiful albums to deliver to your clients",
      icon: BookImage,
      link: "/albums",
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Manage your photos, create albums, and deliver to clients
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="shadow-sm hover:shadow transition-shadow">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick access to main features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link href={feature.link} key={feature.title}>
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest uploads and album creations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Activity items would go here in a real app */}
            <p className="text-gray-500 italic text-center py-6">
              Your recent activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
