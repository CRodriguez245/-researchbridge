import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// User preference operations
export async function getUserPreferences(userId) {
  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log("Attempted to get preferences for non-existent user:", userId);
      // Return default preferences without creating a record
      return {
        language: "English",
        interests: [],
        community: "General",
        outputStyle: "paragraphs",
        textSize: "medium",
        defaultReadingLevel: "simple",
        microPromptsEnabled: true,
        curiosity: "",
        hasOnboarded: false,
        signals: [],
        preferences: {},
        nudges: {},
        lastSession: null
      };
    }

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });
    
    if (!preferences) {
      // Create default preferences for existing user
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          language: "English",
          interests: "[]",
          community: "General",
          outputStyle: "paragraphs",
          textSize: "medium",
          defaultReadingLevel: "simple",
          microPromptsEnabled: true,
          curiosity: "",
          hasOnboarded: true, // Set to true for existing users
          signals: "[]",
          preferences: "{}",
          nudges: "{}"
        }
      });
    }
    
    // Parse JSON strings back to objects
    const parsedPreferences = {
      language: preferences.language,
      interests: JSON.parse(preferences.interests || "[]"),
      community: preferences.community,
      outputStyle: preferences.outputStyle,
      textSize: preferences.textSize,
      defaultReadingLevel: preferences.defaultReadingLevel,
      microPromptsEnabled: preferences.microPromptsEnabled,
      curiosity: preferences.curiosity || "",
      hasOnboarded: preferences.hasOnboarded,
      signals: JSON.parse(preferences.signals || "[]"),
      preferences: JSON.parse(preferences.preferences || "{}"),
      nudges: JSON.parse(preferences.nudges || "{}"),
      lastSession: preferences.lastSession
    };
    
    return parsedPreferences;
  } catch (error) {
    console.error("Error in getUserPreferences:", error);
    // Return default preferences on error
    return {
      language: "English",
      interests: [],
      community: "General",
      outputStyle: "paragraphs",
      textSize: "medium",
      defaultReadingLevel: "simple",
      microPromptsEnabled: true,
      curiosity: "",
      hasOnboarded: false,
      signals: [],
      preferences: {},
      nudges: {},
      lastSession: null
    };
  }
}

export async function updateUserPreferences(userId, updates) {
  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      // If user doesn't exist, just return without creating anything
      console.warn(`Attempted to update preferences for non-existent user: ${userId}`);
      return null;
    }

    // Convert object fields to JSON strings for database storage
    const dbUpdates = {
      ...updates,
      interests: typeof updates.interests === 'object' ? JSON.stringify(updates.interests) : updates.interests,
      signals: typeof updates.signals === 'object' ? JSON.stringify(updates.signals) : updates.signals,
      preferences: typeof updates.preferences === 'object' ? JSON.stringify(updates.preferences) : updates.preferences,
      nudges: typeof updates.nudges === 'object' ? JSON.stringify(updates.nudges) : updates.nudges
    };

    return await prisma.userPreferences.upsert({
      where: { userId },
      update: dbUpdates,
      create: {
        userId,
        ...dbUpdates
      }
    });
  } catch (error) {
    console.error("Error in updateUserPreferences:", error);
    return null;
  }
}

export async function createUser(email, password, name) {
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 12);
  
  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  });
} 