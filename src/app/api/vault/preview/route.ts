import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            throw new Error('Failed to fetch URL')
        }

        const html = await response.text()

        const getMetaContent = (property: string) => {
            const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
            const match = html.match(regex)
            if (match) return match[1]

            // Try alternate order: content before property/name
            const altRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
            const altMatch = html.match(altRegex)
            return altMatch ? altMatch[1] : null
        }

        const title = getMetaContent('og:title') || getMetaContent('twitter:title') || html.match(/<title>([^<]+)<\/title>/i)?.[1]
        const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description')
        const image = getMetaContent('og:image') || getMetaContent('twitter:image:src') || getMetaContent('twitter:image')
        const siteName = getMetaContent('og:site_name') || new URL(url).hostname

        return NextResponse.json({
            title: title || url,
            description: description || '',
            image: image || null,
            siteName: siteName,
            url: url
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
