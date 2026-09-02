import { apiClient, errorMessage } from '@acrev360/api';
import { Button, ClickableRow, Field, Input, Modal, TableWrap, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headName, setHeadName] = useState('');
  const [headPhone, setHeadPhone] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/departments', { params: { query: { page: undefined } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  const editing = data?.find((d) => d.id === editId);

  // Pre-fill the edit form with whatever's currently on the selected
  // department each time a different one is opened.
  useEffect(() => {
    if (editing == null) return;
    setName(editing.department_name);
    setCode(editing.department_code ?? '');
    setHeadName(editing.head_name ?? '');
    setHeadPhone(editing.head_phone ?? '');
  }, [editing]);

  function resetForm() {
    setName('');
    setCode('');
    setHeadName('');
    setHeadPhone('');
  }

  async function addDepartment() {
    if (!name.trim()) {
      toast('Enter a department name', true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/departments', {
        body: { department_name: name.trim(), department_code: code.trim() || undefined, head_name: headName.trim() || undefined, head_phone: headPhone.trim() || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Department added');
      setAddOpen(false);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add department', true);
    }
  }

  async function saveDepartment() {
    if (editId == null || !name.trim()) {
      toast('Enter a department name', true);
      return;
    }
    try {
      const { error } = await apiClient.PATCH('/api/v1/departments/{id}', {
        params: { path: { id: String(editId) } },
        body: { department_name: name.trim(), department_code: code.trim() || undefined, head_name: headName.trim() || undefined, head_phone: headPhone.trim() || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Department updated');
      setEditId(null);
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      // Revenue items denormalize department_name — a rename here should be
      // reflected there without needing a manual refresh of that page too.
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update department', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="grow" />
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            Add Department
          </Button>
        )}
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load departments'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Head</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((d) =>
                    isAdmin ? (
                      <ClickableRow key={d.id} onClick={() => setEditId(d.id)}>
                        <td>{d.department_name}</td>
                        <td>{d.department_code || '—'}</td>
                        <td>{d.head_name || '—'}</td>
                        <td>{d.head_phone || '—'}</td>
                      </ClickableRow>
                    ) : (
                      <tr key={d.id}>
                        <td>{d.department_name}</td>
                        <td>{d.department_code || '—'}</td>
                        <td>{d.head_name || '—'}</td>
                        <td>{d.head_phone || '—'}</td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      No departments added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {(addOpen || editing != null) && (
        <Modal
          open
          onClose={() => {
            setAddOpen(false);
            setEditId(null);
          }}
          title={editing != null ? editing.department_name : 'Add Department'}
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setAddOpen(false);
                  setEditId(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={editing != null ? saveDepartment : addDepartment}>
                {editing != null ? 'Save' : 'Add'}
              </button>
            </>
          }
        >
          <Field label="Department name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Health" />
          </Field>
          <Field label="Code (optional)">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. HEALTH" />
          </Field>
          <Field label="Head's name (optional)">
            <Input value={headName} onChange={(e) => setHeadName(e.target.value)} />
          </Field>
          <Field label="Head's phone (optional)">
            <Input value={headPhone} onChange={(e) => setHeadPhone(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
