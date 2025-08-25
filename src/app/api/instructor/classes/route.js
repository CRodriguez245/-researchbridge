import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Temporarily allow any authenticated user for testing
    // if (session.user.role !== "instructor") {
    //   return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    // }

    const classes = await prisma.class.findMany({
      where: {
        instructorId: session.user.id
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Temporarily allow any authenticated user for testing
    // if (session.user.role !== "instructor") {
    //   return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
    // }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        instructorId: session.user.id
      }
    });

    return NextResponse.json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 