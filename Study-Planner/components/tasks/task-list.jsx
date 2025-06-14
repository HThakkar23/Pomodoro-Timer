"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Calendar, Clock, Target } from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { useToast } from "@/hooks/use-toast"

export function TaskList({ tasks, onTaskUpdate }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const { toast } = useToast()

  const handleTaskComplete = async (taskId, completed) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      toast({
        title: completed ? "Task completed!" : "Task reopened",
        description: completed ? "Great job! Keep up the momentum." : "Task marked as incomplete.",
      })

      onTaskUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete task")

      toast({
        title: "Task deleted",
        description: "The task has been removed from your list.",
      })

      onTaskUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    // Incomplete tasks first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    // Then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    // Then by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tasks ({tasks.filter((t) => !t.completed).length} active)
          </CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task._id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                task.completed ? "bg-muted/50 opacity-75" : "bg-card hover:bg-muted/50"
              }`}
            >
              <Checkbox checked={task.completed} onCheckedChange={(checked) => handleTaskComplete(task._id, checked)} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </h3>
                  <Badge variant="secondary" className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                    {task.priority}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {task.subject}
                  </span>
                  <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? "text-red-500" : ""}`}>
                    <Clock className="h-3 w-3" />
                    Due {formatDate(task.dueDate)}
                  </span>
                  {task.pomodorosCompleted > 0 && (
                    <span className="flex items-center gap-1">
                      🍅 {task.pomodorosCompleted}/{task.estimatedPomodoros}
                    </span>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingTask(task)
                      setIsDialogOpen(true)
                    }}
                  >
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTaskDelete(task._id)} className="text-red-600">
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </CardContent>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        task={editingTask}
        onTaskSaved={onTaskUpdate}
      />
    </Card>
  )
}
