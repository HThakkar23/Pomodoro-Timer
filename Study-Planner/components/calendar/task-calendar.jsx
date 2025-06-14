"use client"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TaskCalendar({ tasks, onTaskUpdate }) {
  const { toast } = useToast()

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444"
      case "medium":
        return "#f59e0b"
      case "low":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const calendarEvents = tasks.map((task) => ({
    id: task._id,
    title: `${task.title} (${task.subject})`,
    date: task.scheduledDate || task.dueDate,
    backgroundColor: getPriorityColor(task.priority),
    borderColor: getPriorityColor(task.priority),
    extendedProps: {
      task,
      isDue: !task.scheduledDate,
    },
  }))

  const handleEventDrop = async (info) => {
    const taskId = info.event.id
    const newDate = info.event.start

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: newDate.toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to update task")

      toast({
        title: "Task rescheduled",
        description: "Your task has been moved to the new date.",
      })

      onTaskUpdate()
    } catch (error) {
      info.revert()
      toast({
        title: "Error",
        description: "Failed to reschedule task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDateClick = (info) => {
    // You could open a dialog to create a new task for this date
    console.log("Date clicked:", info.dateStr)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Study Calendar
        </CardTitle>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Priority</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={calendarEvents}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            dateClick={handleDateClick}
            eventContent={(eventInfo) => (
              <div className="p-1 text-xs">
                <div className="font-medium truncate">{eventInfo.event.extendedProps.task.title}</div>
                <div className="text-xs opacity-75">{eventInfo.event.extendedProps.task.subject}</div>
                {eventInfo.event.extendedProps.isDue && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Due Date
                  </Badge>
                )}
              </div>
            )}
            height="auto"
            dayMaxEvents={3}
            moreLinkClick="popover"
          />
        </div>
      </CardContent>
    </Card>
  )
}
