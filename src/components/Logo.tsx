
import type React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 bg-primary/20 rounded-full transform rotate-45"/>
        <div className="absolute inset-1 bg-background backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`${sizeClasses[size]} text-primary`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H9a3 3 0 0 0-3 3v16a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Z" />
            <rect width="4" height="6" x="10" y="9" rx="1" />
            <circle cx="12" cy="6" r="1" />
          </svg>
        </div>
      </div>
      <span className="ml-2 font-bold text-primary text-xl">PhotoFlow</span>
    </div>
  );
};

export default Logo;
