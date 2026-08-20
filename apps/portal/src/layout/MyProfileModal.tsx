import { apiClient, errorMessage } from '@acrev360/api';
import type { UpdateProfileResponse } from '@acrev360/api';
import { Button, Field, Input, Modal, useToast } from '@acrev360/ui';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function MyProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  if (!user) return null;

  async function saveProfile() {
    if (!fullName.trim()) {
      toast("Full name can't be blank", true);
      return;
    }
    setSavingProfile(true);
    try {
      const { data, error } = await apiClient.PATCH('/api/v1/auth/me', {
        body: { full_name: fullName.trim(), email: email.trim(), phone: phone.trim() },
      });
      if (error) throw new Error(errorMessage(error));
      // The generated type claims this responds with the narrow
      // UpdateProfile shape, but MeView.update() actually responds with the
      // full Me shape — see packages/api/src/overrides.ts #8.
      setUser(data as unknown as UpdateProfileResponse);
      toast('Profile updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update profile', true);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      toast('Enter your current and new password', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New password and confirmation do not match', true);
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await apiClient.POST('/api/v1/auth/change-password', {
        body: { current_password: currentPassword, new_password: newPassword },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change password', true);
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="My Account"
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      <h3 style={{ margin: '0 0 8px' }}>Profile</h3>
      <Field label="Full name">
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Button variant="primary" small onClick={() => void saveProfile()} disabled={savingProfile}>
        {savingProfile ? 'Saving…' : 'Save profile'}
      </Button>

      <h3 style={{ margin: '22px 0 8px' }}>Change Password</h3>
      <Field label="Current password">
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
      </Field>
      <Field label="New password">
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password">
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
      </Field>
      <Button variant="primary" small onClick={() => void changePassword()} disabled={changingPassword}>
        {changingPassword ? 'Changing…' : 'Change password'}
      </Button>
    </Modal>
  );
}
