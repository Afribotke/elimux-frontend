'use client';

const PROGRAMS = [
  { name: 'Bachelor of Medicine & Surgery', institution: 'University of Nairobi', category: 'Medicine & Health', students: '2.4k' },
  { name: 'BSc Computer Science', institution: 'Strathmore University', category: 'Technology', students: '1.8k' },
  { name: 'Diploma in Nursing', institution: 'KMTC', category: 'Medicine & Health', students: '3.1k' },
  { name: 'BCom Finance', institution: 'Kenyatta University', category: 'Business', students: '1.2k' },
];

const CAT_COLORS: Record<string, string> = {
  'Medicine & Health': 'text-rose-600 bg-rose-50',
  'Technology': 'text-blue-600 bg-blue-50',
  'Business': 'text-amber-600 bg-amber-50',
  'Engineering': 'text-orange-600 bg-orange-50',
  'Law': 'text-indigo-600 bg-indigo-50',
  'Education': 'text-teal-600 bg-teal-50',
  'Arts & Design': 'text-pink-600 bg-pink-50',
  'Science': 'text-emerald-600 bg-emerald-50',
};

export default function PopularPrograms() {
  return (
    <div className="mt-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 text-sm font-semibold">🔥 Popular Programs</h3>
        <a href="/programs" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Explore all →</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROGRAMS.map((p, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
            onClick={() => { window.location.href = '/programs'; }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-gray-900 text-sm font-medium leading-tight">{p.name}</span>
            </div>
            <div className="text-gray-500 text-xs mb-2">{p.institution}</div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${CAT_COLORS[p.category] || 'text-gray-600 bg-gray-100'}`}>
                {p.category}
              </span>
              <span className="text-gray-400 text-xs">{p.students} students</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
