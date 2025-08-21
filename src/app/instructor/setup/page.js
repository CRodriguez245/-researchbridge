"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InstructorSetup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createDemoClass = async () => {
    if (!className.trim()) {
      setMessage("Please enter a class name");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/instructor/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: className }),
      });

      if (response.ok) {
        const newClass = await response.json();
        setMessage(`Class "${newClass.name}" created successfully!`);
        setClassName("");
        
        // Redirect to instructor dashboard after a short delay
        setTimeout(() => {
          router.push("/instructor");
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      setMessage("Error creating class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin  h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "instructor") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need instructor privileges to view this page.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white  shadow p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Setup</h1>
            <p className="text-gray-600">Create your first class to get started with the instructor dashboard</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-2">
                Class Name
              </label>
              <input
                type="text"
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Biology 101, English Composition, etc."
                className="block w-full  border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {message && (
              <div className={`p-4  ${
                message.includes("Error") 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {message}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={createDemoClass}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
              <Link
                href="/instructor"
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2  hover:bg-gray-300 text-center"
              >
                Skip to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 ">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Students can enroll in your class using a class code</li>
              <li>• Monitor student progress and engagement</li>
              <li>• View analytics on research patterns and preferences</li>
              <li>• Provide targeted support based on student needs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 