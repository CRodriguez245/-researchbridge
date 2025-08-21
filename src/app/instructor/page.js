"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const PREFERENCE_LABELS = {
  "tone:everyday": "Everyday Language",
  "tone:academic": "Academic Depth",
  "depth:short": "Concise Notes",
  "depth:scaffolded": "Step-by-Step",
  "lens:community": "Community Focus",
  "lens:sports": "Sports Examples",
  "lens:music": "Music Examples",
  "aids:vocab": "Key Terms",
  "aids:takeaways": "Takeaways"
};

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStats, setClassStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "instructor") {
      fetchClasses();
    }
  }, [session, status]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStats(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/instructor/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0]);
        } else {
          // Redirect to setup if no classes exist
          window.location.href = "/instructor/setup";
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStats = async (classId) => {
    try {
      const response = await fetch(`/api/instructor/classes/${classId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setClassStats(data);
      }
    } catch (error) {
      console.error("Error fetching class stats:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin  h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading instructor dashboard...</p>
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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ResearchBridge</h1>
              </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                title="Back to app"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Instructor Dashboard</h2>
        <p className="text-sm text-gray-500 mb-6">Monitor student progress and provide targeted support</p>
        
        {/* Class Selector */}
        <div className="mb-8">
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            id="class-select"
            value={selectedClass?.id || ""}
            onChange={(e) => {
              const classId = e.target.value;
              const classData = classes.find(c => c.id === classId);
              setSelectedClass(classData);
            }}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClass && classStats ? (
          <div className="space-y-8">
            {/* Class Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-6 h-6 text-slate-600 transition-transform duration-300 group-hover:scale-110"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.activeThisWeek}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-6 h-6 text-slate-600 transition-transform duration-300 group-hover:scale-110"
                      >
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Session Time</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.avgSessionTime}min</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-6 h-6 text-slate-600 transition-transform duration-300 group-hover:scale-110"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Confidence Change</p>
                    <p className="text-2xl font-bold text-gray-900">+{classStats.confidenceChange}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-6 h-6 text-slate-600 transition-transform duration-300 group-hover:scale-110"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Citations Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{classStats.citationsCompleted}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preference Analytics */}
            {classStats.preferenceAnalytics && (
              <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-600 mr-2"
                  >
                    <path d="M9 11H1l8-8 8 8h-8v8z"/>
                  </svg>
                  Student Preference Insights
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Most Common Preferences */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Most Common Preferences</h4>
                    <div className="space-y-2">
                      {classStats.preferenceAnalytics.mostCommonPreferences.map((pref, index) => (
                        <div key={pref.tag} className="flex items-center justify-between p-2 bg-gray-50 rounded transition-all duration-200 hover:bg-gray-100 hover:shadow-sm cursor-pointer">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {PREFERENCE_LABELS[pref.tag] || pref.tag}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{pref.count} students</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {pref.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preference Categories */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Preference Categories</h4>
                    <div className="space-y-3">
                      {Object.entries(classStats.preferenceAnalytics.preferenceCategories).map(([category, prefs]) => (
                        <div key={category} className="p-3 bg-gray-50 rounded transition-all duration-200 hover:bg-gray-100 hover:shadow-sm cursor-pointer">
                          <h5 className="text-sm font-medium text-gray-700 capitalize mb-2">{category}</h5>
                          {prefs.length > 0 ? (
                            <div className="space-y-1">
                              {prefs.map(pref => (
                                <div key={pref.tag} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{PREFERENCE_LABELS[pref.tag] || pref.tag}</span>
                                  <span className="text-gray-900">{pref.count}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No preferences in this category</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-blue-600 transition-transform duration-200 group-hover:scale-110">{classStats.preferenceAnalytics.totalSignals}</p>
                      <p className="text-sm text-gray-600">Total Signals Collected</p>
                    </div>
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-green-600 transition-transform duration-200 group-hover:scale-110">{classStats.preferenceAnalytics.averagePreferencesPerStudent}</p>
                      <p className="text-sm text-gray-600">Avg Preferences per Student</p>
                    </div>
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-purple-600 transition-transform duration-200 group-hover:scale-110">{classStats.preferenceAnalytics.preferenceTimeline.length}</p>
                      <p className="text-sm text-gray-600">Days of Preference Data</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nudge Analytics */}
            {classStats.nudgeAnalytics && (
              <div className="bg-white shadow p-6 mt-8 border-t-2 border-gray-200 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-600 mr-2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Nudge Effectiveness
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Nudge Effectiveness */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Nudge Acceptance Rates</h4>
                    <div className="space-y-2">
                      {classStats.nudgeAnalytics.nudgeEffectiveness.slice(0, 5).map((nudge) => (
                        <div key={nudge.tag} className="p-2 bg-gray-50 rounded transition-all duration-200 hover:bg-gray-100 hover:shadow-sm cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {PREFERENCE_LABELS[nudge.tag] || nudge.tag}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              nudge.acceptanceRate >= 70 ? 'bg-green-100 text-green-800' :
                              nudge.acceptanceRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {nudge.acceptanceRate}% accepted
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{nudge.accepted} accepted</span>
                            <span>{nudge.dismissed} dismissed</span>
                            <span>{nudge.totalShown} total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Problematic Nudges */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Nudges Needing Attention</h4>
                    {classStats.nudgeAnalytics.problematicNudges.length > 0 ? (
                      <div className="space-y-2">
                        {classStats.nudgeAnalytics.problematicNudges.map((nudge) => (
                          <div key={nudge.tag} className="p-3 bg-red-50 border border-red-200 rounded transition-all duration-200 hover:bg-red-100 hover:shadow-sm cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-red-900">
                                {PREFERENCE_LABELS[nudge.tag] || nudge.tag}
                              </span>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {nudge.dismissalRate}% dismissed
                              </span>
                            </div>
                            <p className="text-xs text-red-700 mt-1">
                              Consider adjusting the nudge timing or messaging
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded transition-all duration-200 hover:bg-green-100 hover:shadow-sm cursor-pointer">
                        <p className="text-sm text-green-800">All nudges performing well! 🎉</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-blue-600 transition-transform duration-200 group-hover:scale-110">{classStats.nudgeAnalytics.overallAcceptanceRate}%</p>
                      <p className="text-sm text-gray-600">Overall Acceptance Rate</p>
                    </div>
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-green-600 transition-transform duration-200 group-hover:scale-110">{classStats.nudgeAnalytics.totalNudgesAccepted}</p>
                      <p className="text-sm text-gray-600">Total Nudges Accepted</p>
                    </div>
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-yellow-600 transition-transform duration-200 group-hover:scale-110">{classStats.nudgeAnalytics.totalNudgesShown}</p>
                      <p className="text-sm text-gray-600">Total Nudges Shown</p>
                    </div>
                    <div className="p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                      <p className="text-2xl font-bold text-purple-600 transition-transform duration-200 group-hover:scale-110">{classStats.nudgeAnalytics.averageNudgesPerStudent}</p>
                      <p className="text-sm text-gray-600">Avg Nudges per Student</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode Usage Chart */}
            <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode Usage Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(classStats.modeUsage).map(([mode, count]) => (
                  <div key={mode} className="text-center p-4 transition-all duration-200 hover:bg-gray-50 rounded cursor-pointer group">
                    <div className="text-2xl font-bold text-blue-600 transition-transform duration-200 group-hover:scale-110">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{mode}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white shadow transition-all duration-300 hover:shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Student Activity & Preferences</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preferences
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nudge Effectiveness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classStats.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 bg-gray-300 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                <span className="text-sm font-medium text-gray-700">
                                  {student.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name || "Anonymous"}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(student.lastActive).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.sessionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {student.preferences.slice(0, 2).map(pref => (
                              <span key={pref} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:scale-105">
                                {PREFERENCE_LABELS[pref] || pref}
                              </span>
                            ))}
                            {student.preferences.length > 2 && (
                              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:scale-105">
                                +{student.preferences.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              student.nudgeEffectiveness >= 70 ? 'text-green-600' :
                              student.nudgeEffectiveness >= 40 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {student.nudgeEffectiveness}%
                            </span>
                            <span className="text-xs text-gray-500">
                              ({student.nudgeDismissals} dismissed)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold  ${
                            student.status === "active" 
                              ? "bg-green-100 text-green-800"
                              : student.status === "stuck"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow p-6 transition-all duration-300 hover:shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={async () => {
                    if (selectedClass) {
                      try {
                        const response = await fetch('/api/instructor/populate-class', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ classId: selectedClass.id })
                        });
                        if (response.ok) {
                          alert('Test data populated successfully!');
                          fetchClassStats(selectedClass.id);
                        } else {
                          alert('Failed to populate test data');
                        }
                      } catch (error) {
                        console.error('Error populating test data:', error);
                        alert('Error populating test data');
                      }
                    }
                  }}
                  className="bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform"
                >
                  Populate Test Data
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform">
                  Send Weekly Summary
                </button>
                <button className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform">
                  Assign Source Evaluation
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform">
                  Export Class Data
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No class data available.</p>
          </div>
        )}
      </div>
    </div>
  );
} 