'use client';

// ============================================
// ELIMUX AD PORTAL - CREATE CAMPAIGN WIZARD
// /advertiser/campaigns/new
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CAMPAIGN_TYPES = [
    { value: 'banner', label: 'Banner Ad', description: 'Display banner on homepage or search', basePrice: 0.50 },
    { value: 'featured_listing', label: 'Featured Listing', description: 'Highlight your institution', basePrice: 0.80 },
    { value: 'sponsored_program', label: 'Sponsored Program', description: 'Promote specific courses', basePrice: 0.90 },
    { value: 'search_sponsored', label: 'Search Sponsored', description: 'Top of search results', basePrice: 1.00 },
    { value: 'homepage_hero', label: 'Homepage Hero', description: 'Main banner (premium)', basePrice: 2.00 }
];

const BILLING_MODELS = [
    { value: 'cpc', label: 'Pay Per Click', description: 'Pay only when clicked' },
    { value: 'cpm', label: 'Pay Per 1000 Views', description: 'Pay per 1000 impressions' },
    { value: 'flat_fee', label: 'Flat Fee', description: 'Fixed price for duration' }
];

const TARGET_AUDIENCES = [
    { value: 'all', label: 'All Visitors' },
    { value: 'students', label: 'Students Only' },
    { value: 'parents', label: 'Parents / Guardians' },
    { value: 'agents', label: 'Education Agents' }
];

export default function CreateCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [balance, setBalance] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        campaign_type: 'banner',
        title: '',
        subtitle: '',
        image_url: '',
        destination_url: '',
        cta_text: 'Learn More',
        budget: 100,
        daily_budget: undefined as number | undefined,
        start_date: '',
        end_date: '',
        billing_model: 'cpc',
        cpc_rate: 0.50,
        cpm_rate: 5.00,
        target_audience: 'all',
        target_countries: [] as string[],
        target_institution_types: [] as string[],
        target_categories: [] as string[]
    });

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advertiser/stats`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (data.success) setBalance(data.data.balance);
        } catch (e) {
            console.error('Failed to fetch balance:', e);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTypeChange = (type: string) => {
        const selected = CAMPAIGN_TYPES.find(t => t.value === type);
        setFormData(prev => ({
            ...prev,
            campaign_type: type,
            cpc_rate: selected?.basePrice || 0.50
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('You must be logged in');
                setLoading(false);
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create campaign');
            }

            router.push('/advertiser/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedType = CAMPAIGN_TYPES.find(t => t.value === formData.campaign_type);
    const estimatedClicks = formData.billing_model === 'cpc' ? Math.floor(formData.budget / formData.cpc_rate) : 0;
    const estimatedImpressions = formData.billing_model === 'cpm' ? Math.floor((formData.budget / formData.cpm_rate) * 1000) : 0;

    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CAMPAIGN_TYPES.map(type => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleTypeChange(type.value)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.campaign_type === type.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="font-semibold text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{type.description}</div>
                            <div className="text-sm font-medium text-blue-600 mt-2">From ${type.basePrice}/click</div>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Summer Intake 2026"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description"
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title *</label>
                <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Study at UoN"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Applications now open"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-site.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400 for hero, 728x90 for banners</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL *</label>
                <input
                    type="url"
                    name="destination_url"
                    required
                    value={formData.destination_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://your-site.com/apply"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action</label>
                <input
                    type="text"
                    name="cta_text"
                    value={formData.cta_text}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Learn More"
                />
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Model</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BILLING_MODELS.map(model => (
                        <button
                            key={model.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, billing_model: model.value }))}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.billing_model === model.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="font-semibold text-gray-900">{model.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{model.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget (USD) *</label>
                    <input
                        type="number"
                        name="budget"
                        required
                        min={10}
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Min $10. Your balance: ${balance.toFixed(2)}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget (Optional)</label>
                    <input
                        type="number"
                        name="daily_budget"
                        value={formData.daily_budget || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="No daily limit"
                    />
                </div>
            </div>

            {formData.billing_model === 'cpc' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPC Rate (USD)</label>
                    <input
                        type="number"
                        name="cpc_rate"
                        step="0.01"
                        min="0.10"
                        value={formData.cpc_rate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Est. clicks: ~{estimatedClicks.toLocaleString()}</p>
                </div>
            )}

            {formData.billing_model === 'cpm' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPM Rate (USD)</label>
                    <input
                        type="number"
                        name="cpm_rate"
                        step="0.01"
                        min="1"
                        value={formData.cpm_rate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Est. impressions: ~{estimatedImpressions.toLocaleString()}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                        type="date"
                        name="start_date"
                        required
                        value={formData.start_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                        type="date"
                        name="end_date"
                        required
                        value={formData.end_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="grid grid-cols-2 gap-4">
                    {TARGET_AUDIENCES.map(audience => (
                        <button
                            key={audience.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, target_audience: audience.value }))}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.target_audience === audience.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {audience.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ad Preview</h3>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md">
                    {formData.image_url && (
                        <img src={formData.image_url} alt="Ad" className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                        <h4 className="font-bold text-lg text-gray-900">{formData.title || 'Your Ad Title'}</h4>
                        <p className="text-gray-600 text-sm mt-1">{formData.subtitle || 'Your subtitle'}</p>
                        <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                            {formData.cta_text}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">{selectedType?.label}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Budget:</span><span className="font-medium">${formData.budget.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Model:</span><span className="font-medium">{formData.billing_model.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Duration:</span><span className="font-medium">{formData.start_date} to {formData.end_date}</span></div>
                    {formData.billing_model === 'cpc' && (
                        <div className="flex justify-between"><span className="text-gray-600">Est. Clicks:</span><span className="font-medium">~{estimatedClicks.toLocaleString()}</span></div>
                    )}
                </div>
            </div>
        </div>
    );

    const steps = [
        { number: 1, title: 'Campaign Type', content: renderStep1 },
        { number: 2, title: 'Creative', content: renderStep2 },
        { number: 3, title: 'Budget & Schedule', content: renderStep3 },
        { number: 4, title: 'Review & Submit', content: renderStep4 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white">Create New Campaign</h1>
                        <p className="text-blue-100 mt-1">Step {step} of 4: {steps[step - 1].title}</p>
                    </div>

                    <div className="px-8 py-4 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                            {steps.map((s, i) => (
                                <div key={s.number} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        step >= s.number ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {s.number}
                                    </div>
                                    <span className={`ml-2 text-sm hidden md:block ${
                                        step >= s.number ? 'text-blue-600 font-medium' : 'text-gray-400'
                                    }`}>
                                        {s.title}
                                    </span>
                                    {i < steps.length - 1 && (
                                        <div className={`w-8 h-0.5 mx-2 hidden md:block ${
                                            step > s.number ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {steps[step - 1].content()}

                        <div className="flex justify-between mt-8 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => step > 1 ? setStep(step - 1) : router.push('/advertiser/dashboard')}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                {step === 1 ? 'Cancel' : 'Previous'}
                            </button>

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Campaign'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
