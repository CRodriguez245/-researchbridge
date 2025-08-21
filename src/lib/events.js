import { prisma } from "./db";

// Event types for instructor analytics
export const EVENT_TYPES = {
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  MODE_USED: "mode_used",
  PREFERENCE_APPLIED: "preference_applied",
  OUTPUT_EXPORTED: "output_exported",
  CITATION_INSERTED: "citation_inserted",
  SOURCE_CHECKED: "source_checked",
  NUDGE_SHOWN: "nudge_shown",
  NUDGE_ACCEPTED: "nudge_accepted",
  REFLECTION_SAVED: "reflection_saved",
  CONFIDENCE_RATED: "confidence_rated"
};

// Log an event with metadata
export async function logEvent(userId, classId, event, properties = {}) {
  try {
    await prisma.event.create({
      data: {
        userId,
        classId,
        event,
        properties: JSON.stringify(properties),
        ts: new Date()
      }
    });
  } catch (error) {
    console.error("Error logging event:", error);
    // Don't throw - event logging should not break the main flow
  }
}

// Log session start
export async function logSessionStart(userId, classId, mode = null) {
  await logEvent(userId, classId, EVENT_TYPES.SESSION_START, {
    mode,
    timestamp: new Date().toISOString()
  });
}

// Log session end with duration
export async function logSessionEnd(userId, classId, duration, outputs = []) {
  await logEvent(userId, classId, EVENT_TYPES.SESSION_END, {
    duration,
    outputCount: outputs.length,
    outputTypes: outputs.map(o => o.type),
    timestamp: new Date().toISOString()
  });
}

// Log mode usage
export async function logModeUsed(userId, classId, mode, tone = null, lens = null) {
  await logEvent(userId, classId, EVENT_TYPES.MODE_USED, {
    mode,
    tone,
    lens,
    timestamp: new Date().toISOString()
  });
}

// Log preference changes
export async function logPreferenceApplied(userId, classId, preference, value) {
  await logEvent(userId, classId, EVENT_TYPES.PREFERENCE_APPLIED, {
    preference,
    value,
    timestamp: new Date().toISOString()
  });
}

// Log output export
export async function logOutputExported(userId, classId, type, format) {
  await logEvent(userId, classId, EVENT_TYPES.OUTPUT_EXPORTED, {
    type,
    format,
    timestamp: new Date().toISOString()
  });
}

// Log citation insertion
export async function logCitationInserted(userId, classId, sourceType, hasWorkingLink) {
  await logEvent(userId, classId, EVENT_TYPES.CITATION_INSERTED, {
    sourceType,
    hasWorkingLink,
    timestamp: new Date().toISOString()
  });
}

// Log source checking
export async function logSourceChecked(userId, classId, domain, sourceType) {
  await logEvent(userId, classId, EVENT_TYPES.SOURCE_CHECKED, {
    domain,
    sourceType,
    timestamp: new Date().toISOString()
  });
}

// Log nudge interactions
export async function logNudgeShown(userId, classId, nudgeType) {
  await logEvent(userId, classId, EVENT_TYPES.NUDGE_SHOWN, {
    nudgeType,
    timestamp: new Date().toISOString()
  });
}

export async function logNudgeAccepted(userId, classId, nudgeType) {
  await logEvent(userId, classId, EVENT_TYPES.NUDGE_ACCEPTED, {
    nudgeType,
    timestamp: new Date().toISOString()
  });
}

// Log reflection saving
export async function logReflectionSaved(userId, classId, length, depth = null) {
  const lengthBucket = length < 50 ? "short" : length < 150 ? "medium" : "long";
  
  await logEvent(userId, classId, EVENT_TYPES.REFLECTION_SAVED, {
    length,
    lengthBucket,
    depth,
    timestamp: new Date().toISOString()
  });
}

// Log confidence ratings
export async function logConfidenceRated(userId, classId, rating, context = "post") {
  await logEvent(userId, classId, EVENT_TYPES.CONFIDENCE_RATED, {
    rating,
    context,
    timestamp: new Date().toISOString()
  });
} 