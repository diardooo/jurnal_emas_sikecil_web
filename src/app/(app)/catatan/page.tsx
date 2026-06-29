"use client";

import { useState } from "react";
import { ClipboardList, Repeat } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrIbuView } from "@/components/app/pr-ibu-view";
import { RutinitasKebiasaanView } from "@/components/app/rutinitas-kebiasaan-view";

const VALID_TABS = ["rutinitas", "pr"] as const;
type CatatanTab = (typeof VALID_TABS)[number];

export default function CatatanPage() {
  // Deep-linkable tab via ?tab=rutinitas|pr (read once on the client; no
  // Suspense needed since this is a client page). Defaults to "rutinitas" — the
  // daily checklist parents open most often.
  const [tab, setTab] = useState<CatatanTab>(() => {
    if (typeof window === "undefined") return "rutinitas";
    const t = new URLSearchParams(window.location.search).get("tab") ?? "";
    return (VALID_TABS as readonly string[]).includes(t) ? (t as CatatanTab) : "rutinitas";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catatan si Kecil"
        description="Semua catatan harianmu di satu tempat — urusan yang harus diselesaikan dan kebiasaan yang dirawat tiap hari."
      />

      <Tabs
        data-tour="catatan-panel"
        value={tab}
        onValueChange={(v) => setTab(v as CatatanTab)}
      >
        <TabsList>
          <TabsTrigger data-tour-tab="catatan-rutinitas" value="rutinitas">
            <Repeat className="h-4 w-4" /> Rutinitas &amp; Kebiasaan
          </TabsTrigger>
          <TabsTrigger data-tour-tab="catatan-pr" value="pr">
            <ClipboardList className="h-4 w-4" /> PR Ibu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rutinitas">
          <RutinitasKebiasaanView />
        </TabsContent>
        <TabsContent value="pr">
          <PrIbuView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
