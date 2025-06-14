import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Task from "@/models/Task"
import { verifyToken } from "@/lib/auth"

export async function GET(request) {
  try {
    console.log("GET /api/tasks - Starting request")

    const token = request.cookies.get("token")?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("User ID:", decoded.userId)

    await connectDB()
    const tasks = await Task.find({ userId: decoded.userId }).sort({ createdAt: -1 })

    console.log("Found tasks:", tasks.length)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("POST /api/tasks - Starting request")

    const token = request.cookies.get("token")?.value
    if (!token) {
      console.log("No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)

    const { title, subject, priority, dueDate, estimatedPomodoros, scheduledDate } = body

    // Validation
    if (!title || !subject || !dueDate) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("User ID:", decoded.userId)

    await connectDB()

    const taskData = {
      userId: decoded.userId,
      title,
      subject,
      priority: priority || "medium",
      dueDate: new Date(dueDate),
      estimatedPomodoros: estimatedPomodoros || 1,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    }

    console.log("Creating task with data:", taskData)

    const task = await Task.create(taskData)
    console.log("Task created successfully:", task._id)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
