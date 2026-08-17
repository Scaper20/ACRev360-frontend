import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Card, Field, Input, Notice, Row } from '@acrev360/ui';
import { useState } from 'react';

/**
 * Platform-level bootstrap — gated on Django is_superuser/is_staff, not a
 * business access_level (see apps/tenancy/services.py). Deliberately not in
 * the role-driven nav (see src/nav.ts); reachable directly at this route.
 * The backend's own 403 is the real gate for anyone without platform access.
 */
export function OnboardCouncilPage() {
  const [councilCode, setCouncilCode] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [billPrefix, setBillPrefix] = useState('');
  const [billDueDays, setBillDueDays] = useState('30');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [treasurerName, setTreasurerName] = useState('');
  const [treasurerPhone, setTreasurerPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!councilCode.trim() || !councilName.trim() || !billPrefix.trim()) {
      setError('Council code, name, and bill reference prefix are required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { data, error } = await apiClient.POST('/api/v1/councils/onboard', {
        body: {
          council_code: councilCode.trim(),
          council_name: councilName.trim(),
          config: {
            bill_ref_prefix: billPrefix.trim(),
            bill_due_days: Number(billDueDays) || 30,
            revenue_bank_name: bankName.trim() || undefined,
            revenue_bank_account_number: bankAccountNumber.trim() || undefined,
            revenue_bank_account_name: bankAccountName.trim() || undefined,
            treasurer_name: treasurerName.trim() || undefined,
            treasurer_phone: treasurerPhone.trim() || undefined,
          },
        },
      });
      if (error) throw new Error(errorMessage(error));
      setSuccess(`Council "${data.council_name}" onboarded.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Council onboarding failed — you may not have platform-level access');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
      <Card>
        <h3>Onboard a New Council</h3>
        <p className="card-note">
          Platform-level bootstrap — creates a new tenant with its chart-of-revenue template ready to activate. This is not a business-role action; it requires platform
          (staff/superuser) access.
        </p>
        {success != null ? (
          <Notice variant="info">{success}</Notice>
        ) : (
          <>
            <Row>
              <Field label="Council code (e.g. KAC)">
                <Input value={councilCode} onChange={(e) => setCouncilCode(e.target.value)} />
              </Field>
              <Field label="Council name">
                <Input value={councilName} onChange={(e) => setCouncilName(e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Bill reference prefix">
                <Input value={billPrefix} onChange={(e) => setBillPrefix(e.target.value)} placeholder="e.g. KAC" />
              </Field>
              <Field label="Bill due (days)">
                <Input type="number" value={billDueDays} onChange={(e) => setBillDueDays(e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Revenue bank name">
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </Field>
              <Field label="Bank account number">
                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Bank account name">
                <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Treasurer name">
                <Input value={treasurerName} onChange={(e) => setTreasurerName(e.target.value)} />
              </Field>
              <Field label="Treasurer phone">
                <Input value={treasurerPhone} onChange={(e) => setTreasurerPhone(e.target.value)} />
              </Field>
            </Row>
            {error != null && <Notice variant="bad">{error}</Notice>}
            <Button variant="primary" onClick={submit} disabled={submitting} style={{ marginTop: 6 }}>
              {submitting ? 'Onboarding…' : 'Onboard Council'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
