import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { mockRequestHistory } from "@/features/coach/lib/mockData"

const statusIcons = {
  accepted: CheckCircle,
  declined: XCircle,
  pending: Clock,
}

const statusColors = {
  accepted: "text-green-600",
  declined: "text-red-600",
  pending: "text-orange-600",
}

export function RequestHistorySection() {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent History</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {mockRequestHistory.map((request) => {
            const StatusIcon = statusIcons[request.status as keyof typeof statusIcons]
            const statusColor = statusColors[request.status as keyof typeof statusColors]

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                      {request.client_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">{request.client_name}</h4>
                    <p className="text-xs text-muted-foreground">{request.email_address}</p>
                    <p className="text-xs text-muted-foreground">{request.action_date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                  <Badge
                    variant={
                      request.status === "accepted"
                        ? "default"
                        : request.status === "declined"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs capitalize"
                  >
                    {request.status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
