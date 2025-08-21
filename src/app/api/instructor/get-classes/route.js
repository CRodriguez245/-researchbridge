import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "instructor") {
      return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    }

    const classes = await prisma.class.findMany({
      where: {
        instructorId: session.user.id
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 