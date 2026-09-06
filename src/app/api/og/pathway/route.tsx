import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Next.js's file-convention image metadata (opengraph-image.tsx /
// twitter-image.tsx) only ever receives `params` from matched dynamic
// path segments - it does NOT receive `searchParams` from the request,
// even for a page like /pathways/results that's entirely query-string
// driven. That's a documented Next.js limitation, not a bug in this
// route - confirmed by testing: opengraph-image.tsx rendered the same
// generic "Your Career / 0% Match" placeholder regardless of what query
// string was on the request. A plain Route Handler (this file) does get
// the full request, including the query string, so it's the correct
// place to generate a per-share OG image driven by URL params.
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const career = searchParams.get('career') || 'Your Career';
  const fit = searchParams.get('fit') || '0';
  const pathway = searchParams.get('pathway') || '';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0052cc 0%, #003d99 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: '40px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, opacity: 0.85, marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ElimuX Career Pathway
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1, maxWidth: '900px' }}>
          {career}
        </div>
        {pathway && (
          <div style={{ display: 'flex', fontSize: 32, marginTop: 16, opacity: 0.9 }}>
            {pathway}
          </div>
        )}
        <div style={{ display: 'flex', fontSize: 56, marginTop: 24, fontWeight: 600 }}>
          {fit}% Match
        </div>
        <div style={{ display: 'flex', fontSize: 22, opacity: 0.7, marginTop: 32 }}>
          www.elimux.ke/pathways
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
