import { Card } from "@/components/ui/card"
import SectionHeader from "@/components/ui/SectionHeader"
import DailyMacroSummary from "@/features/tools/components/macro-splitter/DailyMacroSummary"
import MacroSection from "@/features/tools/components/macro-splitter/MacroSection"
import { ClientToolsSkeleton } from "@/features/coach/components/loading/ClientToolsSkeleton"
import { checkCoachAccess } from "@/lib/utils/access-control"
import { SplitSquareHorizontal } from "lucide-react"
import { notFound } from "next/navigation"
import { Suspense } from "react"

async function CoachMacroSplitterPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const { hasAccess, isCoach } = await checkCoachAccess(clientId)

  if (!hasAccess || !isCoach) return notFound()

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <SectionHeader
          className="text-3xl font-bold flex items-center"
          title="Macro Splitter Tool"
          description="Distribute your total daily macros across your meals by percentage. Percentages must be whole numbers (e.g., 20, not 20.5)."
          icon={<SplitSquareHorizontal className="mr-3 h-8 w-8 text-primary" />}
        />

        <Suspense fallback={<ClientToolsSkeleton />}>
          <DailyMacroSummary clientId={clientId} />
        </Suspense>
      </Card>

      <Suspense fallback={<ClientToolsSkeleton />}>
        <MacroSection clientId={clientId} />
      </Suspense>
    </div>
  )
}

export default CoachMacroSplitterPage
