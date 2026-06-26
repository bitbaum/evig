/** HR admin/API types — lib layer (no component imports). */

export interface HrFunnelStats {
  byStatus: Record<string, number>
  byTrack: Record<string, number>
  bySource: Record<string, number>
  publishedVacancies: number
  pendingApplications: number
  draftVacancies: number
  filledVacancies: number
}
