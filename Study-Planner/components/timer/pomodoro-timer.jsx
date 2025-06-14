"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

export function PomodoroTimer({ tasks, onSessionComplete }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState("work")
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const intervalRef = useRef(null)

  const workDuration = (user?.preferences.pomodoroLength || 25) * 60
  const shortBreakDuration = (user?.preferences.shortBreakLength || 5) * 60
  const longBreakDuration = (user?.preferences.longBreakLength || 15) * 60

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log("Could not play notification sound:", error)
    }
  }

  const handleTimerComplete = async () => {
    setIsRunning(false)

    // Play notification sound
    playNotificationSound()

    // Save session to database
    try {
      await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskId || null,
          type: mode,
          duration: mode === "work" ? workDuration : mode === "shortBreak" ? shortBreakDuration : longBreakDuration,
        }),
      })

      onSessionComplete()
    } catch (error) {
      console.error("Failed to save session:", error)
    }

    // Show notification
    const messages = {
      work: "Great work! Time for a break.",
      shortBreak: "Break time is over. Ready to focus?",
      longBreak: "Long break complete. Let's get back to work!",
    }

    toast({
      title: "Timer Complete!",
      description: messages[mode],
    })

    // Auto-switch modes
    if (mode === "work") {
      setSessionsCompleted((prev) => prev + 1)
      const nextMode = (sessionsCompleted + 1) % 4 === 0 ? "longBreak" : "shortBreak"
      switchMode(nextMode)
    } else {
      switchMode("work")
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setIsRunning(false)

    const durations = {
      work: workDuration,
      shortBreak: shortBreakDuration,
      longBreak: longBreakDuration,
    }

    setTimeLeft(durations[newMode])
  }

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    const durations = {
      work: workDuration,
      shortBreak: shortBreakDuration,
      longBreak: longBreakDuration,
    }
    setTimeLeft(durations[mode])
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = () => {
    const totalTime = mode === "work" ? workDuration : mode === "shortBreak" ? shortBreakDuration : longBreakDuration
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const modeColors = {
    work: "bg-red-500",
    shortBreak: "bg-green-500",
    longBreak: "bg-blue-500",
  }

  const modeLabels = {
    work: "Focus Time",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="secondary" className={`${modeColors[mode]} text-white`}>
            {modeLabels[mode]}
          </Badge>
          <Badge variant="outline">Session {sessionsCompleted + 1}</Badge>
        </div>
        <CardTitle className="text-4xl font-mono">{formatTime(timeLeft)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted-foreground/20"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress() / 100)}`}
              className={`${modeColors[mode].replace("bg-", "text-")} transition-all duration-1000 ease-linear`}
              strokeLinecap="round"
            />
          </svg>
          {isRunning && <div className="absolute inset-0 rounded-full border-4 border-primary/20 pulse-ring" />}
        </div>

        {/* Task Selection */}
        {mode === "work" && tasks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Working on:</label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                {tasks
                  .filter((task) => !task.completed)
                  .map((task) => (
                    <SelectItem key={task._id} value={task._id}>
                      {task.title} - {task.subject}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-2">
          <Button onClick={toggleTimer} size="lg" className="flex-1">
            {isRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-1">
          <Button
            variant={mode === "work" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("work")}
            className="flex-1"
          >
            Focus
          </Button>
          <Button
            variant={mode === "shortBreak" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("shortBreak")}
            className="flex-1"
          >
            Short Break
          </Button>
          <Button
            variant={mode === "longBreak" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("longBreak")}
            className="flex-1"
          >
            Long Break
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
