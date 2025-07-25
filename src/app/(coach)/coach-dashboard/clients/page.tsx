import { ClientsHeader } from "@/features/coach/components/clients/ClientsHeader"
import { ClientsStatsCards } from "@/features/coach/components/clients/ClientsStatsCards"
import { AcceptedClientsSection } from "@/features/coach/components/clients/AcceptedClientsSection"

export default function CoachClientsPage() {
  return (
    <div className="space-y-8">
      <ClientsHeader />
      <ClientsStatsCards />
      <AcceptedClientsSection />
    </div>
  )
}
