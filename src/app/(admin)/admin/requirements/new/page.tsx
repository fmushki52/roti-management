import { RequirementForm } from '@/components/admin/RequirementForm';

export default function NewRequirementPage() {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Amiri, serif', color: 'var(--brand-brown)', borderBottom: '1px solid var(--brand-gold-deep)', paddingBottom: '4px' }}>
        New ROTI Requirement
      </h2>
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'var(--border-default)' }}>
        <RequirementForm />
      </div>
    </div>
  );
}
