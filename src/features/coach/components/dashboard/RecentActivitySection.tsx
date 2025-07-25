import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, TrendingUp, UserPlus, Calendar } from "lucide-react"
import { mockRecentActivity } from "@/features/coach/lib/mockData"

export function RecentActivitySection() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message":
        return MessageSquare
      case "progress":
        return TrendingUp
      case "new_client":
        return UserPlus
      case "session":
        return Calendar
      default:
        return MessageSquare
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-600"
      case "progress":
        return "text-green-600"
      case "new_client":
        return "text-purple-600"
      case "session":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockRecentActivity.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`p-2 rounded-full bg-background border ${getActivityColor(activity.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
