/**
 * User Profile & Settings Service
 * Manages user data, profile picture, email, and password changes
 */

export const getUserProfile = () => {
  try {
    const profile = localStorage.getItem('mc_user_profile');
    return profile ? JSON.parse(profile) : getDefaultProfile();
  } catch {
    return getDefaultProfile();
  }
};

export const getDefaultProfile = () => ({
  id: `user_${Date.now()}`,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91-9876543210',
  profilePicture: null, // base64 or URL
  createdAt: new Date().toISOString(),
});

export const updateUserProfile = (updates) => {
  try {
    const current = getUserProfile();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem('mc_user_profile', JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return null;
  }
};

export const updateEmail = (newEmail) => {
  if (!newEmail || !newEmail.includes('@')) {
    return { success: false, error: 'Invalid email format' };
  }
  try {
    updateUserProfile({ email: newEmail });
    return { success: true, message: 'Email updated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updatePassword = (oldPassword, newPassword) => {
  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  if (oldPassword === newPassword) {
    return { success: false, error: 'New password must be different from old password' };
  }
  try {
    // In a real app, validate old password against backend
    // For now, just store new password hash (in production, use proper encryption)
    updateUserProfile({ 
      passwordHash: btoa(newPassword), // Simple base64 encoding (not secure!)
      lastPasswordChange: new Date().toISOString()
    });
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProfilePicture = (imageDataURL) => {
  try {
    updateUserProfile({ profilePicture: imageDataURL });
    return { success: true, message: 'Profile picture updated' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getProfileInitials = () => {
  const profile = getUserProfile();
  return profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
