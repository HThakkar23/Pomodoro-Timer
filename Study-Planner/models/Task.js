import mongoose from "mongoose"

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    pomodorosCompleted: {
      type: Number,
      default: 0,
    },
    estimatedPomodoros: {
      type: Number,
      default: 1,
    },
    scheduledDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Task || mongoose.model("Task", TaskSchema)
