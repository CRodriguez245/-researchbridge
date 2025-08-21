import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "instructor") {
      return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    }

    const classId = params.id;

    // Verify the instructor owns this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        instructorId: session.user.id
      }
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get class enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const userIds = enrollments.map(e => e.user.id);

    // Get events for this class in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const events = await prisma.event.findMany({
      where: {
        classId,
        ts: {
          gte: oneWeekAgo
        }
      },
      orderBy: {
        ts: "desc"
      }
    });

    // Get artifacts for this class
    const artifacts = await prisma.artifact.findMany({
      where: { classId },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Get user preferences for preference analytics
    const userPreferences = await prisma.userPreferences.findMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    // Calculate confidence change (real implementation)
    const confidenceChange = calculateConfidenceChange(userPreferences, events);
    
    // Calculate statistics
    const activeThisWeek = new Set(events.map(e => e.userId)).size;
    
    // Calculate average session time (simplified - in real implementation you'd track session duration)
    const sessionEvents = events.filter(e => e.event === "session_end");
    const avgSessionTime = sessionEvents.length > 0 ? Math.round(sessionEvents.length * 15) : 0; // Simplified calculation
    
    // Count citations
    const citationsCompleted = artifacts.filter(a => a.type === "citation").length;
    console.log(`Found ${artifacts.length} total artifacts, ${citationsCompleted} citations`);
    
    // Calculate mode usage
    const modeEvents = events.filter(e => e.event === "mode_used");
    const modeUsage = {
      summarize: modeEvents.filter(e => JSON.parse(e.properties).mode === "summarize").length,
      ask: modeEvents.filter(e => JSON.parse(e.properties).mode === "ask").length,
      outline: modeEvents.filter(e => JSON.parse(e.properties).mode === "outline").length,
      citations: modeEvents.filter(e => JSON.parse(e.properties).mode === "citations").length
    };

    // Calculate preference analytics
    const preferenceAnalytics = calculatePreferenceAnalytics(userPreferences);
    
    // Calculate nudge analytics
    const nudgeAnalytics = calculateNudgeAnalytics(userPreferences);

    // Get student activity data
    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userEvents = events.filter(e => e.userId === enrollment.user.id);
        const userArtifacts = artifacts.filter(a => a.userId === enrollment.user.id);
        const userPrefs = userPreferences.find(p => p.userId === enrollment.user.id);
        
        const lastEvent = userEvents[0];
        const sessionCount = userEvents.filter(e => e.event === "session_start").length;
        const exportCount = userArtifacts.filter(a => a.isShared).length;
        
        // Parse user preferences for individual student insights
        const preferences = userPrefs ? JSON.parse(userPrefs.preferences || "{}") : {};
        const signals = userPrefs ? JSON.parse(userPrefs.signals || "[]") : [];
        const nudges = userPrefs ? JSON.parse(userPrefs.nudges || "{}") : {};
        
        // Determine status
        let status = "inactive";
        if (userEvents.length > 0) {
          const lastEventDate = new Date(lastEvent.ts);
          const daysSinceLastEvent = (new Date() - lastEventDate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastEvent <= 1) {
            status = "active";
          } else if (daysSinceLastEvent <= 7) {
            status = "recent";
          } else if (userEvents.length < 3) {
            status = "stuck";
          }
        }

        // Calculate nudge effectiveness for this student
        const nudgeDismissals = Object.values(nudges).reduce((sum, count) => sum + count, 0);
        const activePreferences = Object.keys(preferences).filter(tag => preferences[tag]?.default).length;
        const nudgeEffectiveness = nudgeDismissals > 0 ? (activePreferences / nudgeDismissals) * 100 : 0;

        return {
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          lastActive: lastEvent ? lastEvent.ts : enrollment.createdAt,
          sessionCount,
          exportCount,
          status,
          preferences: Object.keys(preferences).filter(tag => preferences[tag]?.default),
          nudgeDismissals,
          nudgeEffectiveness: Math.round(nudgeEffectiveness)
        };
      })
    );

    const stats = {
      activeThisWeek,
      avgSessionTime,
      confidenceChange,
      citationsCompleted,
      modeUsage,
      students,
      preferenceAnalytics,
      nudgeAnalytics
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching class stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to calculate preference analytics
function calculatePreferenceAnalytics(userPreferences) {
  const allSignals = [];
  const allPreferences = {};
  const preferenceTimeline = {};

  userPreferences.forEach(pref => {
    const signals = JSON.parse(pref.signals || "[]");
    const preferences = JSON.parse(pref.preferences || "{}");
    
    // Collect all signals
    signals.forEach(signal => {
      allSignals.push(signal.tag);
      
      // Track timeline
      const date = new Date(signal.at).toDateString();
      if (!preferenceTimeline[date]) {
        preferenceTimeline[date] = {};
      }
      if (!preferenceTimeline[date][signal.tag]) {
        preferenceTimeline[date][signal.tag] = 0;
      }
      preferenceTimeline[date][signal.tag]++;
    });

    // Collect active preferences
    Object.entries(preferences).forEach(([tag, pref]) => {
      if (pref.default) {
        allPreferences[tag] = (allPreferences[tag] || 0) + 1;
      }
    });
  });

  // Calculate most common preferences
  const mostCommonPreferences = Object.entries(allPreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / userPreferences.length) * 100)
    }));

  // Calculate preference categories
  const preferenceCategories = {
    tone: mostCommonPreferences.filter(p => p.tag.startsWith('tone:')),
    depth: mostCommonPreferences.filter(p => p.tag.startsWith('depth:')),
    lens: mostCommonPreferences.filter(p => p.tag.startsWith('lens:')),
    aids: mostCommonPreferences.filter(p => p.tag.startsWith('aids:'))
  };

  return {
    mostCommonPreferences,
    preferenceCategories,
    totalSignals: allSignals.length,
    averagePreferencesPerStudent: Math.round(Object.values(allPreferences).reduce((sum, count) => sum + count, 0) / userPreferences.length),
    preferenceTimeline: Object.entries(preferenceTimeline).slice(-7) // Last 7 days
  };
}

// Helper function to calculate nudge analytics
function calculateNudgeAnalytics(userPreferences) {
  const allNudges = {};
  const nudgeAcceptance = {};
  const nudgeDismissals = {};

  userPreferences.forEach(pref => {
    const preferences = JSON.parse(pref.preferences || "{}");
    const nudges = JSON.parse(pref.nudges || "{}");
    
    // Count nudges shown and accepted
    Object.entries(nudges).forEach(([tag, dismissalCount]) => {
      allNudges[tag] = (allNudges[tag] || 0) + dismissalCount;
      nudgeDismissals[tag] = (nudgeDismissals[tag] || 0) + dismissalCount;
      
      // Check if preference was eventually accepted
      if (preferences[tag]?.default) {
        nudgeAcceptance[tag] = (nudgeAcceptance[tag] || 0) + 1;
      }
    });
  });

  // Calculate nudge effectiveness
  const nudgeEffectiveness = Object.keys(allNudges).map(tag => {
    const totalShown = allNudges[tag];
    const accepted = nudgeAcceptance[tag] || 0;
    const dismissed = nudgeDismissals[tag] || 0;
    
    return {
      tag,
      totalShown,
      accepted,
      dismissed,
      acceptanceRate: Math.round((accepted / totalShown) * 100),
      dismissalRate: Math.round((dismissed / totalShown) * 100)
    };
  }).sort((a, b) => b.acceptanceRate - a.acceptanceRate);

  // Identify problematic nudges (high dismissal rates)
  const problematicNudges = nudgeEffectiveness.filter(n => n.dismissalRate > 70);

  // Calculate overall nudge metrics
  const totalNudgesShown = Object.values(allNudges).reduce((sum, count) => sum + count, 0);
  const totalNudgesAccepted = Object.values(nudgeAcceptance).reduce((sum, count) => sum + count, 0);
  const overallAcceptanceRate = totalNudgesShown > 0 ? Math.round((totalNudgesAccepted / totalNudgesShown) * 100) : 0;

  return {
    nudgeEffectiveness,
    problematicNudges,
    overallAcceptanceRate,
    totalNudgesShown,
    totalNudgesAccepted,
    averageNudgesPerStudent: Math.round(totalNudgesShown / userPreferences.length)
  };
}

// Helper function to calculate confidence change based on preference consistency and signal strength
function calculateConfidenceChange(userPreferences, events) {
  if (userPreferences.length === 0) {
    return "0.0";
  }

  let totalConfidenceScore = 0;
  let studentCount = 0;

  userPreferences.forEach(pref => {
    const preferences = JSON.parse(pref.preferences || "{}");
    const signals = JSON.parse(pref.signals || "[]");
    const nudges = JSON.parse(pref.nudges || "{}");
    
    // Calculate confidence factors for this student
    const confidenceFactors = {
      preferenceConsistency: calculatePreferenceConsistency(preferences, signals),
      signalStrength: calculateSignalStrength(signals),
      nudgeResponse: calculateNudgeResponse(nudges, preferences),
      activityLevel: calculateActivityLevel(events, pref.userId)
    };

    // Weighted confidence score (0-1 scale)
    const confidenceScore = (
      confidenceFactors.preferenceConsistency * 0.4 +
      confidenceFactors.signalStrength * 0.3 +
      confidenceFactors.nudgeResponse * 0.2 +
      confidenceFactors.activityLevel * 0.1
    );

    totalConfidenceScore += confidenceScore;
    studentCount++;
  });

  // Calculate average confidence and convert to change metric
  const averageConfidence = totalConfidenceScore / studentCount;
  
  // Convert to a change metric (0.0 to 2.0 scale)
  // Higher confidence = positive change, lower confidence = negative change
  // Ensure we get a reasonable range of values (0.0 to 1.5)
  const confidenceChange = Math.max(0, Math.min(1.5, (averageConfidence - 0.3) * 2));
  
  return confidenceChange.toFixed(1);
}

// Calculate preference consistency (how stable are student preferences)
function calculatePreferenceConsistency(preferences, signals) {
  if (signals.length === 0) return 0.3; // Lower consistency if no signals

  // Group signals by tag and analyze frequency
  const signalCounts = {};
  signals.forEach(signal => {
    signalCounts[signal.tag] = (signalCounts[signal.tag] || 0) + 1;
  });

  // Calculate consistency based on signal distribution
  const totalSignals = signals.length;
  const uniqueTags = Object.keys(signalCounts);
  
  if (uniqueTags.length === 0) return 0.3;
  
  // Higher consistency = fewer unique tags with higher counts
  const maxSignalsForTag = Math.max(...Object.values(signalCounts));
  const consistency = maxSignalsForTag / totalSignals;
  
  // Bonus for having active preferences
  const activePreferences = Object.keys(preferences).filter(tag => preferences[tag]?.default).length;
  const preferenceBonus = Math.min(activePreferences * 0.15, 0.4);
  
  return Math.min(consistency + preferenceBonus, 1.0);
}

// Calculate signal strength (how frequently and recently students provide signals)
function calculateSignalStrength(signals) {
  if (signals.length === 0) return 0.2; // Lower strength if no signals

  const now = new Date();
  const recentSignals = signals.filter(signal => {
    const signalDate = new Date(signal.at);
    const daysDiff = (now - signalDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Recent = within 7 days
  });

  // Signal strength based on frequency and recency
  const totalSignals = signals.length;
  const recentSignalsCount = recentSignals.length;
  
  const frequencyScore = Math.min(totalSignals / 5, 1.0); // Normalize to 5 signals (more achievable)
  const recencyScore = recentSignalsCount / totalSignals;
  
  return (frequencyScore * 0.6 + recencyScore * 0.4);
}

// Calculate nudge response (how students respond to preference suggestions)
function calculateNudgeResponse(nudges, preferences) {
  const totalNudges = Object.values(nudges).reduce((sum, count) => sum + count, 0);
  
  if (totalNudges === 0) return 0.5; // Neutral if no nudges
  
  // Count how many nudged preferences were accepted
  const acceptedNudges = Object.keys(nudges).filter(tag => 
    preferences[tag]?.default
  ).length;
  
  const acceptanceRate = acceptedNudges / totalNudges;
  
  // Higher acceptance rate = higher confidence
  return acceptanceRate;
}

// Calculate activity level (how engaged the student is)
function calculateActivityLevel(events, userId) {
  const userEvents = events.filter(e => e.userId === userId);
  
  if (userEvents.length === 0) return 0.3; // Low activity if no events
  
  // Activity level based on event frequency and types
  const sessionEvents = userEvents.filter(e => e.event === "session_start").length;
  const preferenceEvents = userEvents.filter(e => e.event === "preference_applied").length;
  const exportEvents = userEvents.filter(e => e.event === "output_exported").length;
  
  // Weighted activity score
  const activityScore = (
    sessionEvents * 0.4 +
    preferenceEvents * 0.4 +
    exportEvents * 0.2
  ) / 10; // Normalize to 10 events
  
  return Math.min(activityScore, 1.0);
} 