import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import QRCode from 'qrcode';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Globe, MapPin, Users, ArrowRight, Share2 } from 'lucide-react';
import InviteTracker from './tracker';

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

async function getInviteData(token: string) {
  const { data: invite, error } = await supabaseAdmin
    .from('institution_invites')
    .select('*, institutions(*, institution_types(name))')
    .eq('token', token)
    .single();

  if (error || !invite) return null;
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return null;

  return invite;
}

async function getInstitutionCount() {
  const { count } = await supabaseAdmin
    .from('institutions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  return count || 0;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { token } = await params;
  const invite = await getInviteData(token);

  if (!invite) {
    return { title: 'Invite Not Found | ElimuX' };
  }

  const institution = invite.institutions as { name: string; description?: string; logo_url?: string };
  return {
    title: `${institution.name} — Join ElimuX`,
    description: institution.description || `Claim your institution's profile on ElimuX and connect with students worldwide.`,
    openGraph: {
      title: `${institution.name} is invited to ElimuX`,
      description: 'Join 200+ institutions already on the platform.',
      images: institution.logo_url ? [institution.logo_url] : [],
    },
  };
}

export default async function InstitutionInvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteData(token);

  if (!invite) {
    notFound();
  }

  const institution = invite.institutions as {
    id: string;
    name: string;
    description?: string;
    city?: string;
    country?: string;
    website_url?: string;
    logo_url?: string;
    institution_types?: { name: string } | null;
  };

  const institutionCount = await getInstitutionCount();

  // Generate QR code data URL
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.elimux.ke'}/invite/institution/${token}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(inviteUrl, { width: 200, margin: 2 });
  } catch {
    // QR generation failed, continue without it
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <InviteTracker token={token} />
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ElimuX"
              width={40}
              height={40}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-xl font-bold text-gray-900">ElimuX</span>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Explore Platform
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero Card */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          {/* Top accent */}
          <div className="h-2 bg-primary" />

          <div className="p-8 text-center sm:p-12">
            {/* Institution Logo */}
            {institution.logo_url ? (
              <Image
                src={institution.logo_url}
                alt={institution.name}
                width={80}
                height={80}
                className="mx-auto mb-6 rounded-xl object-contain"
                unoptimized
              />
            ) : (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-10 w-10 text-primary" />
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {institution.name}
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-lg text-gray-600">
              Your students are searching for you. Claim your free profile on ElimuX and get discovered by thousands of prospective students.
            </p>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              {institution.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {institution.city}
                  {institution.country ? `, ${institution.country}` : ''}
                </span>
              )}
              {institution.institution_types?.name && (
                <span className="rounded-full bg-gray-100 px-3 py-1">{institution.institution_types.name}</span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <a
                href={`/institution/register?invite=${token}&institution_id=${institution.id}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6"
              >
                Claim Your Free Profile
                <ArrowRight className="h-5 w-5" />
              </a>
              <p className="mt-3 text-sm text-gray-400">Free forever. No credit card required.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid divide-y border-t bg-gray-50/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">{institutionCount}+</p>
              <p className="text-sm text-gray-500">Institutions</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">50K+</p>
              <p className="text-sm text-gray-500">Monthly Searches</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">Global</p>
              <p className="text-sm text-gray-500">Reach</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrDataUrl && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Share this invite</span>
            </div>
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={200}
              height={200}
              className="mx-auto mt-4"
              unoptimized
            />
            <p className="mt-2 text-xs text-gray-400">Scan to open on mobile</p>
          </div>
        )}

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Trusted by leading institutions across Africa</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-white py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} ElimuX. All rights reserved.</p>
      </footer>
    </div>
  );
}
