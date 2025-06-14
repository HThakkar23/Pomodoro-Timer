import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request) {
  try {
    await connectDB()

    const { email, password, name } = await request.json()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    })

    // Generate token
    const token = generateToken(user._id.toString())

    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        stats: user.stats,
      },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
