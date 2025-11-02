import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Profile.css';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Profile update form
  const [updateData, setUpdateData] = useState<UpdateData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [updating, setUpdating] = useState(false);

  // Password change form
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordData>>({});

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/profile');
      setProfileData(data.data);
      setUpdateData({
        name: data.data.name,
        email: data.data.email,
        phone: data.data.phone || '',
        address: data.data.address || '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data } = await api.put('/api/v1/profile', updateData);
      setProfileData(data.data);
      
      // Update Zustand store with new user data
      updateUser({
        name: data.data.name,
        email: data.data.email,
      });

      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const validatePassword = (): boolean => {
    const errors: Partial<PasswordData> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase letter';
    } else if (!/(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain number';
    } else if (!/(?=.*[@$!%*?&])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain special character';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      toast.error('Please fix validation errors');
      return;
    }

    setChangingPassword(true);

    try {
      await api.post('/api/v1/profile/change-password', passwordData);
      toast.success('Password changed successfully');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner-large"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-error">
        <p>Failed to load profile</p>
        <button onClick={loadProfile} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and security settings</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <h3>{profileData.name}</h3>
            <p className="profile-role">{profileData.role}</p>
            <p className="profile-joined">
              Joined {formatDate(profileData.createdAt)}
            </p>
          </div>

          <nav className="profile-nav">
            <button
              className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <span className="nav-icon">👤</span>
              Personal Info
            </button>
            <button
              className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <span className="nav-icon">🔒</span>
              Change Password
            </button>
          </nav>

          <button onClick={handleLogout} className="btn btn-logout">
            Logout
          </button>
        </div>

        <div className="profile-main">
          {activeTab === 'info' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Personal Information</h2>
                <p>Update your personal details</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={updateData.name}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, name: e.target.value })
                    }
                    required
                    disabled={updating}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={updateData.email}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, email: e.target.value })
                    }
                    required
                    disabled={updating}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={updateData.phone}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, phone: e.target.value })
                    }
                    placeholder="0987654321"
                    disabled={updating}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    value={updateData.address}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, address: e.target.value })
                    }
                    placeholder="Your address"
                    rows={3}
                    disabled={updating}
                    className="form-input form-textarea"
                  />
                </div>

                <button type="submit" disabled={updating} className="btn btn-primary">
                  {updating ? (
                    <>
                      <span className="spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>Change Password</h2>
                <p>Update your password to keep your account secure</p>
              </div>

              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      });
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                    }}
                    disabled={changingPassword}
                    className={`form-input ${
                      passwordErrors.currentPassword ? 'error' : ''
                    }`}
                  />
                  {passwordErrors.currentPassword && (
                    <span className="error-message">
                      {passwordErrors.currentPassword}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      });
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                    }}
                    placeholder="Min 8 chars, uppercase, number, special char"
                    disabled={changingPassword}
                    className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                  />
                  {passwordErrors.newPassword && (
                    <span className="error-message">{passwordErrors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      });
                      setPasswordErrors({
                        ...passwordErrors,
                        confirmPassword: undefined,
                      });
                    }}
                    placeholder="Re-enter new password"
                    disabled={changingPassword}
                    className={`form-input ${
                      passwordErrors.confirmPassword ? 'error' : ''
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="error-message">
                      {passwordErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="password-requirements">
                  <p className="requirements-title">Password must contain:</p>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (@$!%*?&)</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn btn-primary"
                >
                  {changingPassword ? (
                    <>
                      <span className="spinner"></span>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
