import React, { useState } from 'react';
import { getUserProfile, updateEmail, updatePassword, updateProfilePicture, getProfileInitials } from '../services/userService';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [activeTab, setActiveTab] = useState('profile'); // profile | email | password | picture
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ── Email Change ──
  const [newEmail, setNewEmail] = useState('');
  const handleEmailChange = () => {
    if (!newEmail.trim()) {
      setMessage({ type: 'error', text: 'Email cannot be empty' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = updateEmail(newEmail);
      if (result.success) {
        setProfile(prev => ({ ...prev, email: newEmail }));
        setMessage({ type: 'success', text: 'Email updated successfully!' });
        setNewEmail('');
      } else {
        setMessage({ type: 'error', text: result.error });
      }
      setLoading(false);
    }, 500);
  };

  // ── Password Change ──
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const handlePasswordChange = () => {
    if (!oldPassword.trim()) {
      setMessage({ type: 'error', text: 'Current password required' });
      return;
    }
    if (!newPassword.trim()) {
      setMessage({ type: 'error', text: 'New password required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = updatePassword(oldPassword, newPassword);
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: result.error });
      }
      setLoading(false);
    }, 500);
  };

  // ── Profile Picture Change ──
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setLoading(true);
      setTimeout(() => {
        const result = updateProfilePicture(imageData);
        if (result.success) {
          setProfile(prev => ({ ...prev, profilePicture: imageData }));
          setMessage({ type: 'success', text: 'Profile picture updated!' });
        } else {
          setMessage({ type: 'error', text: result.error });
        }
        setLoading(false);
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        
        {/* Header */}
        <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Settings & Profile</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280', padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          {[
            { id: 'profile', label: '👤 Profile', icon: '👤' },
            { id: 'email', label: '✉️ Email', icon: '✉️' },
            { id: 'password', label: '🔐 Password', icon: '🔐' },
            { id: 'picture', label: '🖼️ Picture', icon: '🖼️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
              style={{
                flex: 1,
                padding: '16px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          
          {/* Message Alert */}
          {message.text && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 600,
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
            }}>
              {message.type === 'success' ? '✓ ' : '✕ '}{message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Profile Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Member Since</label>
                  <p style={{ fontSize: 14, color: '#374151' }}>{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => {
                    const current = getUserProfile();
                    setProfile(current);
                    setMessage({ type: 'success', text: 'Profile saved!' });
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                >
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Change Email</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Current Email</label>
                  <p style={{ fontSize: 14, color: '#374151', background: '#f9fafb', padding: '10px 12px', borderRadius: 8 }}>{profile.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>New Email</label>
                  <input
                    type="email"
                    placeholder="new.email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  onClick={handleEmailChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: loading ? '#9ca3af' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
                >
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: loading ? '#9ca3af' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.background = '#1d4ed8')}
                  onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* Picture Tab */}
          {activeTab === 'picture' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Profile Picture</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: profile.profilePicture ? 'transparent' : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '3px solid #e5e7eb',
                }}>
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 48, fontWeight: 700, color: '#6b7280' }}>
                      {getProfileInitials()}
                    </span>
                  )}
                </div>
                <label style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '2px dashed #2563eb',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dbeafe';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#eff6ff';
                  }}
                >
                  📷 Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                  Max size: 5MB • Supported: JPG, PNG, GIF
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
