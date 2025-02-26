import { InstallationGuide } from "@/components/installation/installation-guide"
import { InstallationTabs } from "@/components/installation/installation-tabs"

export default function InstallationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instalace</h1>
        <p className="text-muted-foreground">Návod k instalaci a implementaci věkové verifikace</p>
      </div>
      <InstallationTabs />
      <InstallationGuide />
    </div>
  )
}

