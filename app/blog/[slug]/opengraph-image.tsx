import { ImageResponse } from 'next/og'
import { getPostBySlugEn, getAllSlugsEn } from '@/lib/posts-en'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return getAllSlugsEn().map((slug) => ({ slug }))
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'social-selling':  { bg: '#2F6451', color: '#FAFBF3' },
  'linkedin':        { bg: '#66BAC6', color: '#000' },
  'ai-for-sales':    { bg: '#F4B13F', color: '#000' },
  'chattie':         { bg: '#E57B33', color: '#FAFBF3' },
  'comparisons':     { bg: '#000', color: '#FAFBF3' },
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlugEn(slug)
  const title = post?.title ?? 'Chattie Blog'
  const category = post?.category ?? 'social-selling'
  const catStyle = CATEGORY_COLORS[category] ?? { bg: '#B7C3B0', color: '#000' }

  const displayTitle = title.length > 68 ? title.slice(0, 65) + '…' : title

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#FAFBF3',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 8, background: '#000', width: '100%', display: 'flex' }} />

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '56px 72px', justifyContent: 'space-between' }}>

          {/* Category badge */}
          <div style={{ display: 'flex' }}>
            <div
              style={{
                background: catStyle.bg,
                color: catStyle.color,
                fontSize: 18,
                fontWeight: 700,
                padding: '6px 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
              }}
            >
              {category}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: displayTitle.length > 50 ? 52 : 64,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#000',
              maxWidth: 900,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {displayTitle}
          </div>

          {/* Bottom: branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: '#E57B33',
                  border: '2px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#fff',
                }}
              >
                C
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#000', display: 'flex' }}>Chattie Blog</span>
              <span style={{ fontSize: 16, color: '#888', display: 'flex' }}>trychattie.com</span>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#555',
                border: '1.5px solid #ccc',
                padding: '4px 12px',
                display: 'flex',
              }}
            >
              EN
            </div>
          </div>
        </div>

        {/* Right accent stripe */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 12,
            height: '100%',
            background: '#66BAC6',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
