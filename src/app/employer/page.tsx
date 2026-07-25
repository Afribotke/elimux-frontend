import Link from 'next/link';
import {
  Building2,
  Users,
  FileCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock
} from 'lucide-react';

export default function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Shield className="w-4 h-4" />
            Trusted by 200+ Kenyan Organizations
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Intern Force by ElimuX
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            The complete platform for managing interns, attachments, and trainees.
            From requisition to offboarding — one dashboard for your entire organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Register Your Organization
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/for-employers"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-700/50 text-white rounded-xl font-semibold text-lg hover:bg-blue-700/70 transition-colors backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">15,000+</p>
            <p className="text-sm text-gray-500 mt-1">Students Matched</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">200+</p>
            <p className="text-sm text-gray-500 mt-1">Partner Employers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">50+</p>
            <p className="text-sm text-gray-500 mt-1">Universities</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">98%</p>
            <p className="text-sm text-gray-500 mt-1">NITA Compliance</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything HR Needs in One Place
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for Kenyan organizations — from KRA to county governments to SMEs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={FileCheck}
              title="Department Requisitions"
              description="Department heads request interns directly. HR approves with one click. Budget tracking built-in."
            />
            <FeatureCard
              icon={Users}
              title="Live Trainee Dashboard"
              description="See every intern across all departments. Track attendance, performance, and NITA compliance in real-time."
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics & ROI"
              description="Measure intern contribution, hire conversion rates, and cost-per-placement. Board-ready reports."
            />
            <FeatureCard
              icon={Clock}
              title="Digital Logbooks"
              description="Supervisors sign weekly entries online. Auto-formatted for NITA. No more lost paperwork."
            />
            <FeatureCard
              icon={Shield}
              title="NITA Compliance Engine"
              description="Automatic quarterly return generation. Compliance traffic lights. Deadline alerts."
            />
            <FeatureCard
              icon={Building2}
              title="White-Label Portal"
              description="Your logo, your colors, your domain. SSO integration with Active Directory or Google Workspace."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Register', desc: 'Sign up your organization. Upload registration docs.' },
              { step: '2', title: 'Add Departments', desc: 'Set up your departments and team members with roles.' },
              { step: '3', title: 'Post Positions', desc: 'Department heads request interns. HR approves.' },
              { step: '4', title: 'Manage & Report', desc: 'Track interns, sign logbooks, generate NITA returns.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Intern Program?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join KRA, Safaricom, KPLC, and hundreds of organizations already using ElimuX.
          </p>
          <Link
            href="/employer/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-blue-200">Free tier includes 3 departments and 10 active interns</p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
