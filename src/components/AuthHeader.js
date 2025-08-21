"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthHeader() {
  const { data: session, status } = useSession();

  // Debug logging
  console.log("AuthHeader - Status:", status);
  console.log("AuthHeader - Session:", session);
  console.log("AuthHeader - User role:", session?.user?.role);

  if (status === "loading") {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {session?.user ? (
            <span>
              Welcome back, <span className="font-medium text-gray-800">{session.user.name || session.user.email}</span>
              {session.user.role && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {session.user.role}
                </span>
              )}
            </span>
          ) : (
            <span>Welcome to ResearchBridge</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <>
              {session.user.role === "instructor" && (
                <Link 
                  href="/instructor" 
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Instructor Dashboard
                </Link>
              )}
              <Link 
                href="/preferences" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                AI Preferences
              </Link>
              <Link 
                href="/settings" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/auth/signin" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign in
              </Link>
              <Link 
                href="/auth/signup" 
                className="text-sm bg-blue-600 text-white px-3 py-1  hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 