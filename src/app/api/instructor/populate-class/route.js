import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "instructor") {
      return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    }

    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Verify the instructor owns this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        instructorId: session.user.id
      }
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found or access denied" }, { status: 404 });
    }

    // Create test students with unique timestamps to avoid conflicts
    const timestamp = Date.now();
    const testStudents = [
      { name: "Alex Johnson", email: `alex.bio.${timestamp}@test.com` },
      { name: "Sam Chen", email: `sam.bio.${timestamp}@test.com` },
      { name: "Maria Garcia", email: `maria.bio.${timestamp}@test.com` },
      { name: "Jordan Smith", email: `jordan.bio.${timestamp}@test.com` },
      { name: "Taylor Wilson", email: `taylor.bio.${timestamp}@test.com` },
      { name: "Casey Brown", email: `casey.bio.${timestamp}@test.com` },
      { name: "Riley Davis", email: `riley.bio.${timestamp}@test.com` }
    ];

    const createdStudents = [];
    for (const student of testStudents) {
      const user = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email,
          password: "password123",
          role: "student"
        }
      });

      // Enroll in the class
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          classId: classId
        }
      });

      createdStudents.push(user);
    }

    // Create test preference data for each student
    const preferenceData = [
      {
        userId: createdStudents[0].id,
        preferences: {
          "tone:everyday": { default: true, since: new Date().toISOString() },
          "depth:short": { default: true, since: new Date().toISOString() },
          "aids:takeaways": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "tone:everyday", at: new Date().toISOString(), context: "summary" },
          { tag: "tone:everyday", at: new Date().toISOString(), context: "qa" },
          { tag: "depth:short", at: new Date().toISOString(), context: "summary" },
          { tag: "aids:takeaways", at: new Date().toISOString(), context: "outline" }
        ],
        nudges: {
          "tone:academic": 1,
          "depth:scaffolded": 2
        }
      },
      {
        userId: createdStudents[1].id,
        preferences: {
          "tone:academic": { default: true, since: new Date().toISOString() },
          "depth:scaffolded": { default: true, since: new Date().toISOString() },
          "lens:community": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "tone:academic", at: new Date().toISOString(), context: "summary" },
          { tag: "depth:scaffolded", at: new Date().toISOString(), context: "qa" },
          { tag: "lens:community", at: new Date().toISOString(), context: "summary" }
        ],
        nudges: {
          "tone:everyday": 1
        }
      },
      {
        userId: createdStudents[2].id,
        preferences: {
          "lens:sports": { default: true, since: new Date().toISOString() },
          "aids:vocab": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "lens:sports", at: new Date().toISOString(), context: "qa" },
          { tag: "aids:vocab", at: new Date().toISOString(), context: "summary" }
        ],
        nudges: {
          "tone:academic": 3,
          "depth:scaffolded": 2,
          "lens:community": 1
        }
      },
      {
        userId: createdStudents[3].id,
        preferences: {
          "tone:everyday": { default: true, since: new Date().toISOString() },
          "lens:music": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "tone:everyday", at: new Date().toISOString(), context: "summary" },
          { tag: "lens:music", at: new Date().toISOString(), context: "qa" }
        ],
        nudges: {
          "depth:scaffolded": 1
        }
      },
      {
        userId: createdStudents[4].id,
        preferences: {
          "depth:short": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "depth:short", at: new Date().toISOString(), context: "summary" }
        ],
        nudges: {
          "tone:academic": 2,
          "lens:community": 2,
          "aids:takeaways": 1
        }
      },
      {
        userId: createdStudents[5].id,
        preferences: {
          "tone:academic": { default: true, since: new Date().toISOString() },
          "aids:vocab": { default: true, since: new Date().toISOString() },
          "lens:community": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "tone:academic", at: new Date().toISOString(), context: "summary" },
          { tag: "aids:vocab", at: new Date().toISOString(), context: "qa" },
          { tag: "lens:community", at: new Date().toISOString(), context: "outline" }
        ],
        nudges: {
          "tone:everyday": 1
        }
      },
      {
        userId: createdStudents[6].id,
        preferences: {
          "depth:scaffolded": { default: true, since: new Date().toISOString() },
          "lens:sports": { default: true, since: new Date().toISOString() }
        },
        signals: [
          { tag: "depth:scaffolded", at: new Date().toISOString(), context: "summary" },
          { tag: "lens:sports", at: new Date().toISOString(), context: "qa" }
        ],
        nudges: {
          "tone:academic": 2,
          "aids:vocab": 1,
          "lens:community": 1
        }
      }
    ];

    // Create user preferences for each student
    for (const data of preferenceData) {
      await prisma.userPreferences.create({
        data: {
          userId: data.userId,
          language: "English",
          interests: "[]",
          community: "General",
          outputStyle: "paragraphs",
          textSize: "medium",
          defaultReadingLevel: "simple",
          microPromptsEnabled: true,
          curiosity: "",
          hasOnboarded: true,
          signals: JSON.stringify(data.signals),
          preferences: JSON.stringify(data.preferences),
          nudges: JSON.stringify(data.nudges),
          lastSession: new Date().toISOString()
        }
      });
    }

    // Create some test events for each student
    const testEvents = [
      { event: "session_start", properties: "{}" },
      { event: "mode_used", properties: '{"mode": "summarize"}' },
      { event: "mode_used", properties: '{"mode": "ask"}' },
      { event: "mode_used", properties: '{"mode": "outline"}' },
      { event: "mode_used", properties: '{"mode": "citations"}' },
      { event: "preference_applied", properties: '{"preference": "tone:everyday", "value": true}' },
      { event: "output_exported", properties: '{"type": "summary", "format": "pdf"}' },
      { event: "citation_inserted", properties: '{"sourceType": "journal", "hasWorkingLink": true}' },
      { event: "citation_inserted", properties: '{"sourceType": "website", "hasWorkingLink": true}' },
      { event: "source_checked", properties: '{"domain": "sciencedaily.com", "sourceType": "news"}' },
      { event: "confidence_rated", properties: '{"rating": 4, "context": "summarize"}' },
      { event: "confidence_rated", properties: '{"rating": 3, "context": "qa"}' },
      { event: "confidence_rated", properties: '{"rating": 5, "context": "outline"}' },
      { event: "session_end", properties: "{}" }
    ];

    for (const student of createdStudents) {
      for (const eventData of testEvents) {
        await prisma.event.create({
          data: {
            userId: student.id,
            classId: classId,
            event: eventData.event,
            properties: eventData.properties,
            ts: new Date()
          }
        });
      }
    }

    // Create some test artifacts
    const testArtifacts = [
      { type: "citation", title: "Research Citations", isShared: true },
      { type: "summary", title: "Article Summary", isShared: false },
      { type: "outline", title: "Research Outline", isShared: true }
    ];

    for (const student of createdStudents.slice(0, 5)) { // First 5 students have artifacts
      for (const artifact of testArtifacts) {
        await prisma.artifact.create({
          data: {
            userId: student.id,
            classId: classId,
            title: artifact.title,
            type: artifact.type,
            isShared: artifact.isShared,
            content: `Test ${artifact.type} content for ${student.name}`,
            createdAt: new Date()
          }
        });
      }
    }

    // Add extra citation artifacts for some students
    const extraCitations = [
      { title: "Biology Research Citations", type: "citation", isShared: true },
      { title: "Lab Report Citations", type: "citation", isShared: false },
      { title: "Literature Review Citations", type: "citation", isShared: true }
    ];

    for (const student of createdStudents.slice(0, 3)) { // First 3 students get extra citations
      for (const citation of extraCitations) {
        await prisma.artifact.create({
          data: {
            userId: student.id,
            classId: classId,
            title: citation.title,
            type: citation.type,
            isShared: citation.isShared,
            content: `Additional ${citation.type} content for ${student.name}`,
            createdAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({ 
      message: `Test data created successfully for ${classData.name}`,
      classId: classId,
      studentsCreated: createdStudents.length,
      className: classData.name,
      artifactsCreated: createdStudents.length * 3 + (createdStudents.slice(0, 3).length * 3), // Base artifacts + extra citations
      eventsCreated: createdStudents.length * 11 // Each student gets 11 events
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 