import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MessageSquare, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { mockAcceptedClients } from "@/features/coach/lib/mockData"

export function AcceptedClientsSection() {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">My Clients</CardTitle>
          <Badge variant="default" className="text-xs">
            {mockAcceptedClients.length} active
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockAcceptedClients.map((client) => (
            <div
              key={client.user_id}
              className="p-4 rounded-lg border border-border/30 hover:border-border/60 transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.profile_picture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {client.first_name[0]}
                      {client.last_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">
                      {client.first_name} {client.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{client.email_address}</p>
                  </div>
                </div>

                <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                  {client.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-2 font-medium">{client.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="ml-2 font-medium capitalize">{client.gender}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Goal:</span>
                  <span className="ml-2 font-medium">{client.current_goal}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {client.joined_date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                <Link href={`/coach-dashboard/clients/${client.user_id}`}>
                  <Button variant="outline" size="sm" className="gap-2 flex-1 bg-transparent">
                    <ExternalLink className="h-4 w-4" />
                    View Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
