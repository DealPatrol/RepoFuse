import { NextRequest, NextResponse } from 'next/server'
import { scrapeRedditPosts } from '@/lib/reddit-scraper'

/**
 * Daily cron job to scrape Reddit and update demand signals
 * Should be called by a cron service like Vercel Crons or an external scheduler
 */
export async function POST(request: NextRequest) {
  // Verify the request is from a trusted source
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (!cronSecret) {
    console.error('[reddit-sync] CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[v0] Starting Reddit demand scraping job')
    await scrapeRedditPosts()
    console.log('[v0] Reddit demand scraping completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Reddit demand signals updated',
    })
  } catch (error) {
    console.error('[v0] Error in Reddit scraping job:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
