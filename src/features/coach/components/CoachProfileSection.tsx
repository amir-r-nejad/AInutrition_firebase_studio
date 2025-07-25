import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, MapPin, Calendar, Star } from "lucide-react"
import { mockCoachProfile } from "@/features/coach/lib/mockData"

export function CoachProfileSection() {
  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">My Profile</CardTitle>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={mockCoachProfile.profile_picture || "/placeholder.svg"} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {mockCoachProfile.first_name[0]}
              {mockCoachProfile.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {mockCoachProfile.first_name} {mockCoachProfile.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{mockCoachProfile.email_address}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{mockCoachProfile.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {mockCoachProfile.joined_date}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>
              {mockCoachProfile.rating} rating ({mockCoachProfile.total_reviews} reviews)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Specializations</h4>
          <div className="flex flex-wrap gap-2">
            {mockCoachProfile.specializations.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-xs">
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">About</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{mockCoachProfile.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{mockCoachProfile.total_clients}</p>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{mockCoachProfile.years_experience}</p>
            <p className="text-xs text-muted-foreground">Years Experience</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
