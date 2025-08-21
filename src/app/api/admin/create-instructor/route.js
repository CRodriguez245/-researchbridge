import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: "Email, password, and name are required" 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "User with this email already exists" 
      }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create instructor user
    const instructor = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "instructor"
      }
    });

    return NextResponse.json({ 
      message: "Instructor created successfully",
      user: {
        id: instructor.id,
        email: instructor.email,
        name: instructor.name,
        role: instructor.role
      }
    });
  } catch (error) {
    console.error("Error creating instructor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 