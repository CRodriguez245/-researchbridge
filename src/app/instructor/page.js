"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  PreferenceTrendChart, 
  StudentEngagementHeatmap, 
  ModeUsageDonut, 
  RealTimeActivityFeed,
  StudentProgressTimeline 
} from "../../components/InstructorCharts";

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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [liveActivities, setLiveActivities] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [dismissingNotifications, setDismissingNotifications] = useState(new Set());
  const [activeSection, setActiveSection] = useState('overview'); // 'overview', 'activity', 'session-time', 'confidence', 'citations', 'preferences', 'sources'
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [expandedPreferences, setExpandedPreferences] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentDetailsType, setStudentDetailsType] = useState(''); // 'session-time' or 'citations'

  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
    console.log("User role:", session?.user?.role);
    
    if (status === "authenticated") {
      // For now, allow any authenticated user to access instructor dashboard
      // In production, you'd want to check for instructor role
      fetchClasses();
    } else if (status !== "loading") {
      // Status is either "unauthenticated" or user is authenticated but not instructor
      setLoading(false);
    }
  }, [session, status]);



  useEffect(() => {
    if (selectedClass) {
      fetchClassStats(selectedClass.id);
    }
  }, [selectedClass]);

  // Control notification panel visibility with smooth animation
  useEffect(() => {
    if (notifications.length > 0) {
      setShowNotifications(true);
    } else {
      setShowNotifications(false);
    }
  }, [notifications.length]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/instructor/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0]);
        } else {
          // No classes exist, but don't redirect - show setup option
          console.log("No classes found");
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    try {
      const response = await fetch("/api/instructor/setup-test-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        // Refresh classes after creating test data
        fetchClasses();
      } else {
        console.error("Failed to create test data");
      }
    } catch (error) {
      console.error("Error creating test data:", error);
    }
  };

  const fetchClassStats = async (classId) => {
    try {
      const response = await fetch(`/api/instructor/classes/${classId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setClassStats(data);
        
        // Generate mock live activities only if students data exists
        if (data.students && Array.isArray(data.students)) {
          generateMockActivities(data.students);
        }
      }
    } catch (error) {
      console.error("Error fetching class stats:", error);
    }
  };

  const dismissNotification = (notificationId) => {
    setDismissingNotifications(prev => new Set(prev).add(notificationId));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setDismissingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }, 300); // Wait for animation to complete
  };

  const togglePreferences = (studentId, event) => {
    event.stopPropagation(); // Prevent row click
    setExpandedPreferences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const generateMockActivities = (students) => {
    const activities = [];
    const activityTypes = ['query', 'citation', 'preference_change', 'confidence_rating'];
    const activityMessages = {
      query: 'submitted a research query',
      citation: 'completed a citation',
      preference_change: 'updated their preferences',
      confidence_rating: 'rated their confidence'
    };

    students.forEach(student => {
      const numActivities = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numActivities; i++) {
        const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        activities.push({
          id: `${student.id}-${i}`,
          studentId: student.id,
          studentName: student.name,
          type,
          message: activityMessages[type],
          timestamp: timestamp.toISOString()
        });
      }
    });

    setLiveActivities(activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  };

  const handleViewStudentDetails = (student, type) => {
    setSelectedStudentForDetails(student);
    setStudentDetailsType(type);
    setShowStudentDetails(true);
  };

  const closeStudentDetails = () => {
    setShowStudentDetails(false);
    setSelectedStudentForDetails(null);
    setStudentDetailsType('');
  };

  // Simulate live updates
  useEffect(() => {
    if (!isLiveMode || !classStats?.students || classStats.students.length === 0) return;
    
    const interval = setInterval(() => {
      const students = classStats.students;
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      
      // Check if randomStudent exists and has a name property
      if (!randomStudent || !randomStudent.name) {
        console.warn('Random student is undefined or missing name property');
        return;
      }
      
      const actions = [
        "started a new session",
        "applied a preference",
        "completed a task",
        "rated confidence",
        "accepted a nudge"
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      const newActivity = {
        student: randomStudent.name,
        action: action,
        time: "just now"
      };
      
      setLiveActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      
      // Add notifications for important events
      if (Math.random() < 0.3) { // 30% chance of notification
        const notificationTypes = [
          { type: 'success', message: `${randomStudent.name} achieved a new milestone!`, icon: '' },
          { type: 'warning', message: `${randomStudent.name} might need assistance`, icon: '' },
          { type: 'info', message: `New preference pattern detected in class`, icon: '' }
        ];
        const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        
        setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          const notificationId = Date.now();
          setDismissingNotifications(prev => new Set(prev).add(notificationId));
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setDismissingNotifications(prev => {
              const newSet = new Set(prev);
              newSet.delete(notificationId);
              return newSet;
            });
          }, 300); // Wait for animation to complete
        }, 5000);
      }
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [isLiveMode, classStats]);

  return (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "instructor")) ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">You need instructor privileges to view this page.</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Return to Home
        </Link>
      </div>
    </div>
  ) : loading ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading instructor dashboard...</p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Compact Notification Panel */}
      <div className={`fixed top-24 right-4 z-50 transform transition-all duration-500 ease-out ${
        showNotifications 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}>
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 max-w-xs rounded-lg overflow-hidden">
          {/* Header with count and toggle */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setNotifications([])}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                title="Clear all"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Notification list */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            notificationsExpanded ? 'max-h-80' : 'max-h-40'
          }`}>
            <div className="overflow-y-auto max-h-60">
              {(notificationsExpanded ? notifications : notifications.slice(0, 3)).map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-50 last:border-b-0 transition-all duration-500 ease-in-out hover:bg-gray-50 hover:shadow-sm ${
                    dismissingNotifications.has(notification.id)
                      ? 'opacity-0 scale-95 translate-x-4'
                      : 'opacity-100 scale-100 translate-x-0'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-tight">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="Dismiss"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Show more/less indicator - always visible */}
          {notifications.length > 3 && (
            <div className="p-2 text-center border-t border-gray-50 bg-gray-25 rounded-b-lg">
              <button
                onClick={() => setNotificationsExpanded(!notificationsExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-all duration-300 ease-in-out font-medium px-3 py-1 rounded-full hover:bg-gray-100"
              >
                {notificationsExpanded 
                  ? `Show less` 
                  : `+${notifications.length - 3} more`
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">ResearchBridge</h1>
              </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors duration-200"
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Instructor Dashboard</h2>
            <p className="text-sm text-slate-600">Monitor student progress and provide targeted support</p>
          </div>
          <div className="flex items-center space-x-4">
            {selectedStudent && (
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
        
        {/* Live Mode Button - Moved to avoid notification panel overlap */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700"
          >
            <div className={`w-2 h-2 rounded-full ${
              isLiveMode 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-slate-400'
            }`} />
            <span>{isLiveMode ? 'Live Mode' : 'Paused'}</span>
          </button>
        </div>
        
        {/* Class Selector */}
        <div className="mb-8">
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          {classes.length > 0 ? (
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
          ) : (
            <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Classes Found</h3>
                <p className="text-sm text-slate-600 mb-4">Create test data to see the instructor dashboard in action.</p>
                <button
                  onClick={createTestData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Test Data
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedClass && classStats ? (
          <div className="space-y-8">

            {/* Class Overview Cards */}
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group rounded-lg"
                  onClick={() => setActiveSection('activity')}
                >
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
                      <p className="text-sm font-medium text-slate-600">Active This Week</p>
                      <p className="text-2xl font-bold text-slate-900 transition-all duration-500">
                        {classStats.activeThisWeek}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        of {classStats.students.length} students
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group rounded-lg"
                  onClick={() => setActiveSection('session-time')}
                >
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
                      <p className="text-sm font-medium text-slate-600">Avg Session Time</p>
                      <p className="text-2xl font-bold text-slate-900">{classStats.avgSessionTime}min</p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group rounded-lg"
                  onClick={() => setActiveSection('confidence')}
                >
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
                      <p className="text-sm font-medium text-slate-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {classStats.avgConfidence || 3.2}/5
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {classStats.avgConfidence >= 4 ? 'High confidence' : 
                         classStats.avgConfidence >= 3 ? 'Moderate confidence' : 'Needs support'}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group rounded-lg"
                  onClick={() => setActiveSection('citations')}
                >
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
                      <p className="text-sm font-medium text-slate-600">Citations Completed</p>
                      <p className="text-2xl font-bold text-slate-900">{classStats.citationsCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preference Analytics */}
            {activeSection === 'overview' && classStats.preferenceAnalytics && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-5 h-5 text-slate-600 mr-2"
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
            {activeSection === 'overview' && classStats.nudgeAnalytics && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 mt-8 transition-all duration-300 hover:shadow-xl rounded-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-5 h-5 text-slate-600 mr-2"
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

            {/* Interactive Charts Section */}
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModeUsageDonut modeUsage={classStats?.modeUsage || { summarize: 7, ask: 7, outline: 7, citations: 7 }} />
                <RealTimeActivityFeed activities={liveActivities} />
              </div>
            )}

            {/* Preference Trends & Engagement */}
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PreferenceTrendChart 
                  data={[
                    { date: 'Mon', count: 12 },
                    { date: 'Tue', count: 18 },
                    { date: 'Wed', count: 15 },
                    { date: 'Thu', count: 22 },
                    { date: 'Fri', count: 19 },
                    { date: 'Sat', count: 8 },
                    { date: 'Sun', count: 5 }
                  ]} 
                />
                <StudentEngagementHeatmap students={classStats.students} />
              </div>
            )}

            {/* Student Progress Timeline */}
            {activeSection === 'overview' && selectedStudent && (
              <StudentProgressTimeline student={selectedStudent} />
            )}

            {/* Students Table */}
            {activeSection === 'overview' && (
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
                      <tr 
                        key={student.id} 
                        className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
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
                            {(expandedPreferences.has(student.id) ? student.preferences : student.preferences.slice(0, 2)).map(pref => (
                              <span key={pref} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 transition-all duration-200 hover:bg-blue-200 hover:scale-105">
                                {PREFERENCE_LABELS[pref] || pref}
                              </span>
                            ))}
                            {student.preferences.length > 2 && !expandedPreferences.has(student.id) && (
                              <button
                                onClick={(e) => togglePreferences(student.id, e)}
                                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:scale-105 cursor-pointer"
                              >
                                +{student.preferences.length - 2}
                              </button>
                            )}
                            {student.preferences.length > 2 && expandedPreferences.has(student.id) && (
                              <button
                                onClick={(e) => togglePreferences(student.id, e)}
                                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:scale-105 cursor-pointer"
                              >
                                Show less
                              </button>
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
            )}

            {/* Detailed Confidence Analysis */}
            {activeSection === 'confidence' && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="w-5 h-5 text-slate-600 mr-2"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Confidence Analysis
                  </h3>
                  <button 
                    onClick={() => setActiveSection('overview')}
                    className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    ← Back to Overview
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Confidence Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Confidence Distribution</h4>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = Math.floor(Math.random() * 8) + 1; // Mock data
                        const percentage = Math.round((count / 20) * 100);
                        return (
                          <div key={rating} className="flex items-center">
                            <span className="text-sm font-medium text-gray-600 w-8">{rating}</span>
                            <div className="flex-1 mx-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    rating >= 4 ? 'bg-green-500' : 
                                    rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">{count} students</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confidence Trends */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="text-sm font-medium text-gray-900">3.2/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Week</span>
                        <span className="text-sm font-medium text-gray-900">2.8/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Change</span>
                        <span className="text-sm font-medium text-green-600">+0.4</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students Needing Support */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Students Needing Support</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStats?.students?.filter(s => Math.random() > 0.7).slice(0, 6).map((student, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{student.name || "Student " + (index + 1)}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Low Confidence</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">Last confidence rating: 2/5</p>
                        <div className="flex space-x-2">
                          <button className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 transition-colors">
                            Send Nudge
                          </button>
                          <button className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 transition-colors">
                            Schedule Meeting
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Activity Analysis */}
            {activeSection === 'activity' && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="w-5 h-5 text-slate-600 mr-2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Student Activity Analysis
                  </h3>
                  <button 
                    onClick={() => setActiveSection('overview')}
                    className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    ← Back to Overview
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active This Week</span>
                        <span className="text-sm font-medium text-green-600">{classStats.activeThisWeek} students</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Inactive This Week</span>
                        <span className="text-sm font-medium text-red-600">{classStats.students.length - classStats.activeThisWeek} students</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Activity Rate</span>
                        <span className="text-sm font-medium text-blue-600">{Math.round((classStats.activeThisWeek / classStats.students.length) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Activity Trends */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trends</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="text-sm font-medium text-gray-900">{classStats.activeThisWeek} active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Week</span>
                        <span className="text-sm font-medium text-gray-900">{Math.max(0, classStats.activeThisWeek - 1)} active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Change</span>
                        <span className="text-sm font-medium text-green-600">+{Math.max(0, classStats.activeThisWeek - Math.max(0, classStats.activeThisWeek - 1))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active vs Inactive Students */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Student Activity Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Students */}
                    <div>
                      <h5 className="text-md font-medium text-green-700 mb-3">Active Students ({classStats.activeThisWeek})</h5>
                      <div className="space-y-2">
                        {classStats?.students?.slice(0, classStats.activeThisWeek).map((student, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{student.name || "Student " + (index + 1)}</span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Last activity: Today</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inactive Students */}
                    <div>
                      <h5 className="text-md font-medium text-red-700 mb-3">Inactive Students ({classStats.students.length - classStats.activeThisWeek})</h5>
                      <div className="space-y-2">
                        {classStats?.students?.slice(classStats.activeThisWeek).map((student, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{student.name || "Student " + (classStats.activeThisWeek + index + 1)}</span>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Inactive</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Last activity: 3+ days ago</p>
                            <div className="flex space-x-2 mt-2">
                              <button className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded hover:bg-red-300 transition-colors">
                                Send Reminder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Session Time Analysis */}
            {activeSection === 'session-time' && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="w-5 h-5 text-slate-600 mr-2"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    Session Time Analysis
                  </h3>
                  <button 
                    onClick={() => setActiveSection('overview')}
                    className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    ← Back to Overview
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Time Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Session Time Distribution</h4>
                    <div className="space-y-3">
                      {[
                        { range: '0-15 min', count: 2, color: 'bg-red-500' },
                        { range: '15-30 min', count: 5, color: 'bg-yellow-500' },
                        { range: '30-45 min', count: 8, color: 'bg-blue-500' },
                        { range: '45+ min', count: 5, color: 'bg-green-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm font-medium text-gray-600 w-16">{item.range}</span>
                          <div className="flex-1 mx-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                                style={{ width: `${(item.count / 20) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 w-12">{item.count} students</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Time Trends */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="text-sm font-medium text-gray-900">{classStats.avgSessionTime}min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Week</span>
                        <span className="text-sm font-medium text-gray-900">{Math.max(15, parseInt(classStats.avgSessionTime) - 5)}min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Change</span>
                        <span className="text-sm font-medium text-green-600">+{Math.min(5, parseInt(classStats.avgSessionTime) - Math.max(15, parseInt(classStats.avgSessionTime) - 5))}min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Session Time Students */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Session Time Students</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStats?.students?.slice(0, 6).map((student, index) => {
                      const sessionTime = Math.floor(Math.random() * 60) + 15; // Mock data
                      return (
                        <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{student.name || "Student " + (index + 1)}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{sessionTime}min</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">Average session time</p>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewStudentDetails(student, 'session-time')}
                              className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Citations Analysis */}
            {activeSection === 'citations' && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="w-5 h-5 text-slate-600 mr-2"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Citations Analysis
                  </h3>
                  <button 
                    onClick={() => setActiveSection('overview')}
                    className="text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  >
                    ← Back to Overview
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Citations Distribution */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Citations Distribution</h4>
                    <div className="space-y-3">
                      {[
                        { range: '0-5 citations', count: 3, color: 'bg-red-500' },
                        { range: '5-10 citations', count: 7, color: 'bg-yellow-500' },
                        { range: '10-15 citations', count: 6, color: 'bg-blue-500' },
                        { range: '15+ citations', count: 4, color: 'bg-green-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <span className="text-sm font-medium text-gray-600 w-24">{item.range}</span>
                          <div className="flex-1 mx-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                                style={{ width: `${(item.count / 20) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 w-12">{item.count} students</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citations Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Class Progress</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Citations</span>
                        <span className="text-sm font-medium text-gray-900">{classStats.citationsCompleted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Target Goal</span>
                        <span className="text-sm font-medium text-gray-900">{classStats.students.length * 10}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-blue-600">{Math.round((classStats.citationsCompleted / (classStats.students.length * 10)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Citation Students */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Citation Students</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStats?.students?.slice(0, 6).map((student, index) => {
                      const citations = Math.floor(Math.random() * 20) + 5; // Mock data
                      return (
                        <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{student.name || "Student " + (index + 1)}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{citations} citations</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">Completed this week</p>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewStudentDetails(student, 'citations')}
                              className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                            >
                              View Citations
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {activeSection === 'overview' && (
              <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
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
                  className="bg-orange-600 text-white px-4 py-2 hover:bg-orange-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform rounded-lg"
                >
                  Populate Test Data
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform rounded-lg">
                  Send Weekly Summary
                </button>
                <button className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform rounded-lg">
                  Assign Source Evaluation
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 transform rounded-lg">
                  Export Class Data
                </button>
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No class data available.</p>
          </div>
        )}

        {/* Student Details Modal */}
        {showStudentDetails && selectedStudentForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {studentDetailsType === 'session-time' ? 'Session Time Details' : 'Citations Details'} - {selectedStudentForDetails.name}
                </h3>
                <button 
                  onClick={closeStudentDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {studentDetailsType === 'session-time' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">Average Session Time</h4>
                        <p className="text-2xl font-bold text-blue-700">{Math.floor(Math.random() * 60) + 15} minutes</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900">Total Sessions</h4>
                        <p className="text-2xl font-bold text-green-700">{Math.floor(Math.random() * 20) + 5}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-900">This Week</h4>
                        <p className="text-2xl font-bold text-purple-700">{Math.floor(Math.random() * 10) + 2} sessions</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Session History</h4>
                      <div className="space-y-3">
                        {Array.from({ length: 5 }, (_, i) => {
                          const sessionTime = Math.floor(Math.random() * 60) + 10;
                          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Session {i + 1}</p>
                                <p className="text-xs text-gray-600">{date.toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{sessionTime} minutes</p>
                                <p className="text-xs text-gray-600">{sessionTime >= 30 ? 'Long session' : 'Short session'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900">Total Citations</h4>
                        <p className="text-2xl font-bold text-green-700">{Math.floor(Math.random() * 30) + 10}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">This Week</h4>
                        <p className="text-2xl font-bold text-blue-700">{Math.floor(Math.random() * 10) + 3}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-900">Quality Score</h4>
                        <p className="text-2xl font-bold text-yellow-700">{Math.floor(Math.random() * 20) + 80}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Citations</h4>
                      <div className="space-y-3">
                        {Array.from({ length: 5 }, (_, i) => {
                          const sources = ['Academic Journal', 'Book Chapter', 'Research Paper', 'Conference Proceedings', 'Online Article'];
                          const source = sources[Math.floor(Math.random() * sources.length)];
                          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{source}</p>
                                <p className="text-xs text-gray-600">Cited on {date.toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 