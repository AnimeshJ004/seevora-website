import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../auth/api';

const emptyAppointment = { client_name: '', client_email: '', client_phone: '', scheduled_at: '', duration: 30, status: 'scheduled', notes: '' };

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const canDeleteAppointments = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await apiFetch('/api/appointments');
      if (res.ok) {
        setAppointments(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    setAppointmentForm(emptyAppointment);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setAppointmentForm({
      client_name: appointment.client_name || '',
      client_email: appointment.client_email || '',
      client_phone: appointment.client_phone || '',
      scheduled_at: toDateTimeLocal(appointment.scheduled_at),
      duration: appointment.duration || 30,
      status: appointment.status || 'scheduled',
      notes: appointment.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setAppointmentForm(emptyAppointment);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isEditing = Boolean(editingAppointment);
      const res = await apiFetch(isEditing ? `/api/appointments/${editingAppointment.id}` : '/api/appointments', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentForm)
      });
      if (res.ok) {
        closeModal();
        fetchAppointments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (isEditing ? 'Failed to update appointment.' : 'Failed to schedule appointment.'));
      }
    } catch (err) {
      console.error(err);
      setError(editingAppointment ? 'Failed to update appointment.' : 'Failed to schedule appointment.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.6rem' }}>Appointments</h2>
        <button 
          onClick={openCreateModal}
          style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          + Schedule Appointment
        </button>
      </div>

      {loading ? <p>Loading appointments...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Client Details</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Duration</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600 }}>
                    {new Date(apt.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 600 }}>{apt.client_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{apt.client_email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>{apt.duration} mins</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                    <select 
                      value={apt.status} 
                      onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc' }}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(apt)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginRight: 12 }}>Edit</button>
                    {canDeleteAppointments && (
                      <button onClick={() => handleDelete(apt.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No appointments scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, width: 450, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>{editingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}</h3>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', marginBottom: 14 }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Client Name *</label>
                <input 
                  type="text" required 
                  value={appointmentForm.client_name} onChange={e => setAppointmentForm({...appointmentForm, client_name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Client Email</label>
                  <input 
                    type="email" 
                    value={appointmentForm.client_email} onChange={e => setAppointmentForm({...appointmentForm, client_email: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Client Phone</label>
                  <input 
                    type="tel" 
                    value={appointmentForm.client_phone} onChange={e => setAppointmentForm({...appointmentForm, client_phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Date & Time *</label>
                  <input 
                    type="datetime-local" required 
                    value={appointmentForm.scheduled_at} onChange={e => setAppointmentForm({...appointmentForm, scheduled_at: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>Duration (mins)</label>
                  <input 
                    type="number" step="15" min="15" 
                    value={appointmentForm.duration} onChange={e => setAppointmentForm({...appointmentForm, duration: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1 }}>{saving ? (editingAppointment ? 'Saving...' : 'Scheduling...') : (editingAppointment ? 'Save Changes' : 'Schedule')}</button>
                <button type="button" onClick={closeModal} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
