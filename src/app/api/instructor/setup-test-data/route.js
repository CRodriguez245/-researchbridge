import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Temporarily allow any authenticated user for testing
    // if (session.user.role !== "instructor") {
    //   return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    // }

    // Create a test class
    const testClass = await prisma.class.create({
      data: {
        name: "Research Methods 101",
        instructorId: session.user.id
      }
    });

    // Create test students
    const testStudents = [
      { name: "Alex Johnson", email: "alex@test.com" },
      { name: "Sam Chen", email: "sam@test.com" },
      { name: "Maria Garcia", email: "maria@test.com" },
      { name: "Jordan Smith", email: "jordan@test.com" },
      { name: "Taylor Wilson", email: "taylor@test.com" }
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
          classId: testClass.id
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

    // Create some test events
    const testEvents = [
      { event: "session_start", properties: "{}" },
      { event: "mode_used", properties: '{"mode": "summarize"}' },
      { event: "mode_used", properties: '{"mode": "ask"}' },
      { event: "mode_used", properties: '{"mode": "outline"}' },
      { event: "session_end", properties: "{}" }
    ];

    for (const student of createdStudents) {
      for (const eventData of testEvents) {
        await prisma.event.create({
          data: {
            userId: student.id,
            classId: testClass.id,
            event: eventData.event,
            properties: eventData.properties,
            ts: new Date()
          }
        });
      }
    }

    return NextResponse.json({ 
      message: "Test data created successfully",
      classId: testClass.id,
      studentsCreated: createdStudents.length
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 