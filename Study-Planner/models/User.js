import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    preferences: {
      pomodoroLength: { type: Number, default: 25 },
      shortBreakLength: { type: Number, default: 5 },
      longBreakLength: { type: Number, default: 15 },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
    stats: {
      totalPomodoros: { type: Number, default: 0 },
      totalStudyTime: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      achievements: [{ type: String }],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)
