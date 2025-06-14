export interface User {
  _id: string
  email: string
  name: string
  createdAt: Date
  preferences: {
    pomodoroLength: number
    shortBreakLength: number
    longBreakLength: number
    theme: "light" | "dark"
  }
  stats: {
    totalPomodoros: number
    totalStudyTime: number
    currentStreak: number
    longestStreak: number
    achievements: string[]
  }
}

export interface Task {
  _id: string
  userId: string
  title: string
  subject: string
  priority: "low" | "medium" | "high"
  dueDate: Date
  completed: boolean
  pomodorosCompleted: number
  estimatedPomodoros: number
  createdAt: Date
  scheduledDate?: Date
}

export interface PomodoroSession {
  _id: string
  userId: string
  taskId?: string
  type: "work" | "shortBreak" | "longBreak"
  duration: number
  completedAt: Date
  date: string
}
