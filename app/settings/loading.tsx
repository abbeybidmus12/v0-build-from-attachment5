import { SidebarNav } from "@/components/sidebar-nav"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="flex h-screen bg-background">
      <SidebarNav />

      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </main>
    </div>
  )
}
