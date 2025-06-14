"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Clock, Target, Flame } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [timeRange, setTimeRange] = useState("7")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [timeRange])

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/pomodoro?days=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const workSessions = sessions.filter((s) => s.type === "work")
  const totalPomodoros = workSessions.length
  const totalStudyTime = workSessions.reduce((acc, session) => acc + session.duration, 0)
  const averageSessionLength = totalPomodoros > 0 ? totalStudyTime / totalPomodoros : 0

  // Daily productivity data
  const dailyData = sessions.reduce((acc, session) => {
    const date = session.date
    if (!acc[date]) {
      acc[date] = { date, pomodoros: 0, studyTime: 0 }
    }
    if (session.type === "work") {
      acc[date].pomodoros += 1
      acc[date].studyTime += session.duration
    }
    return acc
  }, {})

  const chartData = Object.values(dailyData).map((day) => ({
    ...day,
    studyTime: Math.round(day.studyTime / 60), // Convert to minutes
    date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  // Subject breakdown
  const subjectData = sessions
    .filter((s) => s.type === "work" && s.taskId?.subject)
    .reduce((acc, session) => {
      const subject = session.taskId.subject
      if (!acc[subject]) {
        acc[subject] = { subject, count: 0, time: 0 }
      }
      acc[subject].count += 1
      acc[subject].time += session.duration
      return acc
    }, {})

  const pieData = Object.values(subjectData).map((item, index) => ({
    name: item.subject,
    value: item.count,
    time: Math.round(item.time / 60),
    color: `hsl(${index * 45}, 70%, 50%)`,
  }))

  const achievements = [
    { name: "First Pomodoro", earned: totalPomodoros >= 1, icon: "🍅" },
    { name: "Study Streak", earned: user?.stats.currentStreak >= 3, icon: "🔥" },
    {
      name: "Productive Day",
      earned: Math.max(...Object.values(dailyData).map((d) => d.pomodoros)) >= 8,
      icon: "⚡",
    },
    { name: "Time Master", earned: totalStudyTime >= 25 * 60 * 10, icon: "⏰" }, // 10 full pomodoros
    { name: "Consistency King", earned: user?.stats.longestStreak >= 7, icon: "👑" },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pomodoros</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPomodoros}</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalStudyTime / 60)} minutes studied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.stats.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">Best: {user?.stats.longestStreak || 0} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageSessionLength / 60)}m</div>
            <p className="text-xs text-muted-foreground">Per pomodoro session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length > 0 ? Math.round(totalPomodoros / chartData.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Pomodoros per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "pomodoros" ? `${value} pomodoros` : `${value} minutes`,
                    name === "pomodoros" ? "Pomodoros" : "Study Time",
                  ]}
                />
                <Bar dataKey="pomodoros" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} minutes`, "Study Time"]} />
                <Line type="monotone" dataKey="studyTime" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown and Achievements */}
      <div className="grid gap-4 md:grid-cols-2">
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subject Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} pomodoros`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.name}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    achievement.earned
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-muted/50"
                  }`}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.name}</h4>
                  </div>
                  {achievement.earned && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Earned
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
