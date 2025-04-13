"use client"

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {  Search, BookImage, Home, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {user, signOut} = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Albums", href: "/albums", icon: BookImage },
    { name: "Smart Search", href: "/search", icon: Search },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card shadow-sm p-4 flex justify-between items-center">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center space-x-2">
          <button
            title="Toggle menu"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <svg
             aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} onKeyUp={() => setIsMobileMenuOpen(false)} className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50">
          <div onClick={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()} className="absolute top-14 left-0 w-64 bg-card h-screen overflow-y-auto">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block pl-3 pr-4 py-3 border-l-4 text-base font-medium",
                    pathname === item.href
                      ? "border-primary text-primary bg-accent"
                      : "border-transparent text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
              {user && (
                <div className="px-3 py-3">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 overflow-y-auto">
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            <Link href="/dashboard">
              <Logo size="md" />
            </Link>
          </div>
          
          {user && (
            <div className="px-4 mt-6">
              <div className="py-2 px-3 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-medium truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-4 py-3 text-base font-medium rounded-md",
                    pathname === item.href
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="px-4 pb-6">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
