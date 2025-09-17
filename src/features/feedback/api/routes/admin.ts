import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth, AuthenticatedNextRequest } from '@/lib/admin-auth'
import { getSuggestions, updateSuggestionStatus, generateAIInstructions, getSuggestionStats } from '@/features/feedback/lib/feedbackService'
import { SuggestionFilters, SuggestionStatus } from '@/features/feedback/types'

async function handler(request: AuthenticatedNextRequest) {
  const { searchParams } = new URL(request.url)
  const method = request.method

  try {
    if (method === 'GET') {
      // Handle stats request
      if (searchParams.get('stats') === 'true') {
        const stats = await getSuggestionStats()
        return NextResponse.json(stats)
      }

      // Handle regular suggestions request
      const filters: SuggestionFilters = {
        status: searchParams.get('status') as SuggestionStatus || undefined,
        category: searchParams.get('category') as any || undefined,
        priority: searchParams.get('priority') as any || undefined,
        page: searchParams.get('page') || undefined,
        search: searchParams.get('search') || undefined,
        limit: parseInt(searchParams.get('limit') || '20'),
        offset: parseInt(searchParams.get('offset') || '0')
      }

      // Handle date filters
      if (searchParams.get('dateFrom')) {
        filters.dateFrom = new Date(searchParams.get('dateFrom')!)
      }
      if (searchParams.get('dateTo')) {
        filters.dateTo = new Date(searchParams.get('dateTo')!)
      }

      const suggestions = await getSuggestions(filters)
      return NextResponse.json(suggestions)
    }

    if (method === 'POST') {
      const body = await request.json()
      const { action, suggestionId, notes, editedInstructions, emailMessage } = body

      switch (action) {
        case 'approve':
          const approved = await updateSuggestionStatus(
            suggestionId, 
            SuggestionStatus.READY_FOR_IMPLEMENTATION,
            { adminNotes: notes, reviewedBy: request.adminUser.email }
          )
          return NextResponse.json(approved)

        case 'reject':
          const rejected = await updateSuggestionStatus(
            suggestionId,
            SuggestionStatus.REJECTED, 
            { adminNotes: notes, reviewedBy: request.adminUser.email }
          )
          // TODO: Send rejection email
          return NextResponse.json(rejected)

        case 'defer':
          const deferred = await updateSuggestionStatus(
            suggestionId,
            SuggestionStatus.DEFERRED,
            { adminNotes: notes, reviewedBy: request.adminUser.email }
          )
          return NextResponse.json(deferred)

        case 'request_info':
          const awaiting = await updateSuggestionStatus(
            suggestionId,
            SuggestionStatus.AWAITING_CLARIFICATION,
            { adminNotes: notes, reviewedBy: request.adminUser.email }
          )
          // TODO: Send clarification request email
          return NextResponse.json(awaiting)

        case 'generate_ai':
          const instructions = await generateAIInstructions(suggestionId)
          return NextResponse.json({ instructions })

        case 'mark_in_progress':
          const inProgress = await updateSuggestionStatus(
            suggestionId,
            SuggestionStatus.IN_PROGRESS,
            { reviewedBy: request.adminUser.email }
          )
          return NextResponse.json(inProgress)

        case 'mark_completed':
          const completed = await updateSuggestionStatus(
            suggestionId,
            SuggestionStatus.COMPLETED,
            { reviewedBy: request.adminUser.email }
          )
          // TODO: Send completion email
          return NextResponse.json(completed)

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )

  } catch (error) {
    console.error('Admin suggestions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAdminAuth(handler)
export const POST = requireAdminAuth(handler)