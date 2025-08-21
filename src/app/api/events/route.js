import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logEvent } from "@/lib/events";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, classId, properties = {} } = body;

    if (!event) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 });
    }

    // Log the event
    await logEvent(session.user.id, classId, event, properties);

    return NextResponse.json({ message: "Event logged successfully" });
  } catch (error) {
    console.error("Error logging event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 