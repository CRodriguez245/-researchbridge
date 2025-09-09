"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthHeader() {
  const { data: session, status } = useSession();



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
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="text-lg font-bold text-gray-800">
          ResearchBridge
        </div>
        
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <>
              {/* Home link - always visible for authenticated users */}
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Home
              </Link>
              {/* Instructor Dashboard - only for instructors */}
              {session.user.role === "instructor" && (
                <Link 
                  href="/instructor" 
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Instructor Dashboard
                </Link>
              )}
              {/* AI Preferences and Settings - always visible for authenticated users */}
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
              {/* AI Preferences and Settings - always visible for unauthenticated users */}
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