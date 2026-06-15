export type Cite = string | null

export type NavItem = { id: string; label: string }

export type Kpi = { label: string; value: string; note: string; cite: Cite }

export type BuildStep = { title: string; body: string; cite: Cite; linkLabel?: string; linkUrl?: string }

export type Photo = { src: string; caption: string }

export type StockRow = { label: string; value: string; emphasis?: boolean; note?: string }

export type Channel = { label: string; body: string; cite: Cite; linkLabel?: string; linkUrl?: string }

export type AlternativeRow = { label: string; price: string; note: string; cite: Cite; linkLabel: string | null; linkUrl: string | null; isOurs?: boolean }

export type Segment = { label: string; body: string; cite: Cite }

export type BudgetRow = { label: string; value: string; note?: string; emphasis?: boolean }

export type FactRow = { label: string; value: string; cite: Cite; linkLabel?: string; linkUrl?: string }

export type TimelinePhase = { label: string; date: string }

export type PartnerItem = { name: string; role: string; cite: Cite; linkLabel?: string; linkUrl?: string }

export type PartnerGroup = { title: string; intro?: string; items: PartnerItem[] }

export type RiskItem = { label: string; status: string; body: string; cite: Cite }

export type FundingLine = { label: string; status: string; amount: string; note: string; cite: Cite }

export type GetInvolved = { key: string; title: string; body: string; ctaLabel: string; ctaHref: string; cite: Cite }

export type Citation = { key: string; label: string; detail: string; url: string | null }

export type BusinessPlanUi = {
  step: string
  source: string
  citationAria: string
  badges: { detail: string; plan: string; scope: string }
}

export type BusinessPlan = {
  meta: { title: string; description: string }
  ui: BusinessPlanUi
  nav: { label: string; items: NavItem[] }
  documentMeta: {
    project: string
    sponsor: string
    preparedBy: string
    asOf: string
    versionLabel: string
    projectLabel: string
    sponsorLabel: string
    preparedByLabel: string
  }
  hero: { eyebrow: string; title: string; intro: string; heroVideo: string; heroPoster: string; heroImageAlt: string }
  executiveSummary: {
    eyebrow: string
    title: string
    paragraphs: string[]
    highlights: { label: string; value: string }[]
  }
  status: { eyebrow: string; title: string; intro: string; kpis: Kpi[] }
  produkt: {
    eyebrow: string; title: string; intro: string
    buildSteps: { title: string; steps: BuildStep[] }
    photoGallery: { title: string; intro: string; items: Photo[] }
    links: { label: string; url: string }[]
  }
  lieferanten: {
    eyebrow: string; title: string; intro: string
    stockBreakdown: { title: string; subtitle: string; rows: StockRow[]; cite: Cite }
    channels: { title: string; items: Channel[] }
    criteria: { title: string; items: string[]; cite: Cite }
    rejected: { title: string; items: string[]; cite: Cite }
  }
  alternativen: {
    eyebrow: string; title: string; intro: string
    benchmarkPhoto: Photo
    alternativesTable: { title: string; rows: AlternativeRow[] }
    verdict: string
  }
  kunden: {
    eyebrow: string; title: string; intro: string; segments: Segment[]
    pilotPlan: { title: string; intro: string; items: string[]; cite: Cite }
  }
  wirtschaftlichkeit: {
    eyebrow: string; title: string; intro: string
    budget: { title: string; note: string; rows: BudgetRow[]; cite: Cite }
    scopeNote: string; scopeCite: Cite
  }
  wissenschaft: {
    eyebrow: string; title: string; intro: string
    factsheet: { title: string; rows: FactRow[] }
    timeline: { title: string; phases: TimelinePhase[]; cite: Cite }
    scope: { title: string; items: string[]; cite: Cite }
    history: string; historyCite: Cite
  }
  ce: {
    eyebrow: string; title: string; intro: string
    approach: { title: string; items: { label: string; body: string; cite: Cite }[] }
  }
  partner: {
    eyebrow: string; title: string; intro: string
    groups: PartnerGroup[]
    klimastNote: string; klimastCite: Cite
  }
  risiken: { eyebrow: string; title: string; intro: string; items: RiskItem[] }
  foerderung: { eyebrow: string; title: string; intro: string; lines: FundingLine[] }
  mitmachen: { eyebrow: string; title: string; intro: string; options: GetInvolved[] }
  belege: { eyebrow: string; title: string; intro: string; citations: Citation[] }
}
