import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPlatformConfig } from '@/lib/platform-config'

export async function POST(request: NextRequest) {
  try {
    const { platform, code } = await request.json()

    if (!platform || !code) {
      return NextResponse.json({ error: 'Missing platform or code' }, { status: 400 })
    }

    const platformConfig = getPlatformConfig(platform)
    if (!platformConfig) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!clientId || !clientSecret || !appUrl) {
    console.error(`Missing OAuth config for ${platform}`)
      return NextResponse.json({ error: 'Platform not configured' }, { status: 500 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch(platformConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl}/auth/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error(`Token exchange failed for ${platform}:`, tokenResponse.status)
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token || tokenData.token

    if (!accessToken) {
      console.error(`No access token for ${platform}:`, tokenData)
      return NextResponse.json({ error: 'No access token received' }, { status: 400 })
    }

    // Get user info from platform
    let userInfo: any = {}
    
    if (platform === 'github') {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      })
      userInfo = await userRes.json()
    } else if (platform === 'vercel') {
      const userRes = await fetch('https://api.vercel.com/www/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      userInfo = await userRes.json()
    } else if (platform === 'gitlab') {
      const userRes = await fetch('https://gitlab.com/api/v4/user', {
        headers: {
          'PRIVATE-TOKEN': accessToken,
        },
      })
      userInfo = await userRes.json()
    } else if (platform === 'netlify') {
      const userRes = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      userInfo = await userRes.json()
    }

    // Store platform connection in cookies
    const cookieStore = await cookies()
    let connectedPlatforms: Record<string, unknown> = {}
    const connectedPlatformsCookie = cookieStore.get('connected_platforms')?.value

    if (connectedPlatformsCookie) {
      try {
        connectedPlatforms = JSON.parse(connectedPlatformsCookie) as Record<string, unknown>
      } catch {
        connectedPlatforms = {}
      }
    }

    connectedPlatforms[platform] = {
      access_token: accessToken,
      user: {
        id: userInfo.id || userInfo.login || userInfo.email,
        name: userInfo.name || userInfo.login || userInfo.email,
      },
      connected_at: new Date().toISOString(),
    }

    cookieStore.set('connected_platforms', JSON.stringify(connectedPlatforms), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return NextResponse.json({ success: true, platform })
  } catch (error) {
    console.error('Platform connection error:', error)
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 })
  }
}
