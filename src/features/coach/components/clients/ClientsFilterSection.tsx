import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

const activeFilters = [
  { label: "Active Status", value: "active" },
  { label: "Weight Loss Goal", value: "weight_loss" },
]

const filterOptions = [
  { label: "All Clients", count: 24, active: false },
  { label: "Active", count: 18, active: true },
  { label: "Inactive", count: 6, active: false },
  { label: "New This Month", count: 3, active: false },
]

export function ClientsFilterSection() {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.label}
                variant={option.active ? "default" : "outline"}
                size="sm"
                className="gap-2 bg-transparent"
              >
                {option.label}
                <Badge variant="secondary" className="text-xs">
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {activeFilters.map((filter) => (
                <Badge key={filter.value} variant="secondary" className="gap-1">
                  {filter.label}
                  <X className="h-3 w-3 cursor-pointer" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
