import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import PomodoroSession from "@/models/PomodoroSession"
import User from "@/models/User"
import Task from "@/models/Task"
import { verifyToken } from "@/lib/auth"

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { taskId, type, duration } = await request.json()
    const today = new Date().toISOString().split("T")[0]

    await connectDB()

    // Create pomodoro session
    const session = await PomodoroSession.create({
      userId: decoded.userId,
      taskId,
      type,
      duration,
      date: today,
    })

    // Update user stats and task if it's a work session
    if (type === "work") {
      await User.findByIdAndUpdate(decoded.userId, {
        $inc: {
          "stats.totalPomodoros": 1,
          "stats.totalStudyTime": duration,
        },
      })

      if (taskId) {
        await Task.findByIdAndUpdate(taskId, {
          $inc: { pomodorosCompleted: 1 },
        })
      }

      // Update streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      const yesterdaySession = await PomodoroSession.findOne({
        userId: decoded.userId,
        date: yesterdayStr,
        type: "work",
      })

      const user = await User.findById(decoded.userId)
      if (yesterdaySession || user.stats.currentStreak === 0) {
        const newStreak = user.stats.currentStreak + 1
        await User.findByIdAndUpdate(decoded.userId, {
          "stats.currentStreak": newStreak,
          "stats.longestStreak": Math.max(newStreak, user.stats.longestStreak),
        })
      } else {
        await User.findByIdAndUpdate(decoded.userId, {
          "stats.currentStreak": 1,
        })
      }
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("Create pomodoro session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split("T")[0]

    await connectDB()
    const sessions = await PomodoroSession.find({
      userId: decoded.userId,
      date: { $gte: startDateStr },
    }).populate("taskId", "title subject")

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Get pomodoro sessions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
