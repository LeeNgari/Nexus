import { useState } from 'react';
import { FiEdit2, FiCamera, FiCheck, FiX, FiEye, FiEyeOff, FiLogOut, FiTrash2, FiLock, FiUser, FiMail, FiGlobe } from 'react-icons/fi';

const UserProfilePage = () => {
  const [user, setUser] = useState({
    name: 'Lee Ngari',
    username: 'lgngari',
    email: 'lee@example.com',
    status: 'Hey there! I am using floakly',
    isOnline: true,
    readReceipts: true,
    twoStepVerification: false,
    profilePic: null
  });

  const [editing, setEditing] = useState({
    name: false,
    username: false,
    email: false,
    status: false
  });
  const [tempValues, setTempValues] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleInputChange = (field, value) => {
    setTempValues(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = (field) => {
    setUser(prev => ({ ...prev, [field]: tempValues[field] }));
    setEditing(prev => ({ ...prev, [field]: false }));
  };

  const cancelEdit = (field) => {
    setEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profile</h2>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold mb-3 overflow-hidden">
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <label className="absolute bottom-2 right-2 bg-accent p-2 rounded-full cursor-pointer group-hover:opacity-100 opacity-0 transition-opacity shadow-md">
              <FiCamera className="text-accent-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <h3 className="text-xl font-semibold">{user.name}</h3>
          <p className="text-muted-foreground text-sm">{user.status}</p>
        </div>

        {/* User Info Section */}
        <div className="space-y-4">
          {/* Name */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiUser />
                <span className="text-sm">Name</span>
              </div>
              {editing.name ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit('name')}
                    className="text-primary hover:bg-accent p-1 rounded-full"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={() => cancelEdit('name')}
                    className="text-destructive hover:bg-accent p-1 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setTempValues(prev => ({ ...prev, name: user.name }));
                    setEditing(prev => ({ ...prev, name: true }));
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded-full"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            {editing.name ? (
              <input
                type="text"
                value={tempValues.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-background border-b border-border focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <p className="font-medium">{user.name}</p>
            )}
          </div>

          {/* Username */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiUser />
                <span className="text-sm">Username</span>
              </div>
              {editing.username ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit('username')}
                    className="text-primary hover:bg-accent p-1 rounded-full"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={() => cancelEdit('username')}
                    className="text-destructive hover:bg-accent p-1 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setTempValues(prev => ({ ...prev, username: user.username }));
                    setEditing(prev => ({ ...prev, username: true }));
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded-full"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            {editing.username ? (
              <input
                type="text"
                value={tempValues.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full bg-background border-b border-border focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <p className="font-medium">@{user.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiMail />
                <span className="text-sm">Email</span>
              </div>
              {editing.email ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit('email')}
                    className="text-primary hover:bg-accent p-1 rounded-full"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={() => cancelEdit('email')}
                    className="text-destructive hover:bg-accent p-1 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setTempValues(prev => ({ ...prev, email: user.email }));
                    setEditing(prev => ({ ...prev, email: true }));
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded-full"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            {editing.email ? (
              <input
                type="email"
                value={tempValues.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-background border-b border-border focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <p className="font-medium">{user.email}</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiGlobe />
                <span className="text-sm">Status</span>
              </div>
              {editing.status ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => saveEdit('status')}
                    className="text-primary hover:bg-accent p-1 rounded-full"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={() => cancelEdit('status')}
                    className="text-destructive hover:bg-accent p-1 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setTempValues(prev => ({ ...prev, status: user.status }));
                    setEditing(prev => ({ ...prev, status: true }));
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1 rounded-full"
                >
                  <FiEdit2 size={16} />
                </button>
              )}
            </div>
            {editing.status ? (
              <input
                type="text"
                value={tempValues.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-background border-b border-border focus:outline-none focus:border-primary"
                autoFocus
              />
            ) : (
              <p className="font-medium">{user.status}</p>
            )}
          </div>

          {/* Settings */}
          <div className="bg-card rounded-lg p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-accent text-accent-foreground">
                  <FiUser />
                </div>
                <div>
                  <p className="font-medium">Online Status</p>
                  <p className="text-sm text-muted-foreground">Show when you're online</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={user.isOnline}
                  onChange={() => setUser(prev => ({ ...prev, isOnline: !prev.isOnline }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-accent text-accent-foreground">
                  <FiCheck />
                </div>
                <div>
                  <p className="font-medium">Read Receipts</p>
                  <p className="text-sm text-muted-foreground">Show when you've read messages</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={user.readReceipts}
                  onChange={() => setUser(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-accent text-accent-foreground">
                  <FiLock />
                </div>
                <div>
                  <p className="font-medium">Two-Step Verification</p>
                  <p className="text-sm text-muted-foreground">Extra layer of security</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={user.twoStepVerification}
                  onChange={() => setUser(prev => ({ ...prev, twoStepVerification: !prev.twoStepVerification }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Change Password */}
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full bg-card rounded-lg p-4 border border-border flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-accent text-accent-foreground">
                <FiLock />
              </div>
              <p className="font-medium">Change Password</p>
            </div>
            <FiEdit2 className="text-muted-foreground" />
          </button>

          {/* Danger Zone */}
          <div className="space-y-2 mt-6">
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-card rounded-lg p-4 border border-destructive/30 flex items-center justify-between hover:bg-destructive/10 transition-colors text-destructive"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                  <FiTrash2 />
                </div>
                <p className="font-medium">Delete Account Data</p>
              </div>
            </button>

            <button className="w-full bg-card rounded-lg p-4 border border-destructive/30 flex items-center justify-between hover:bg-destructive/10 transition-colors text-destructive">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                  <FiLogOut />
                </div>
                <p className="font-medium">Log Out</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="current"
                    value={passwordData.current}
                    onChange={handlePasswordChange}
                    className="w-full bg-background border border-border rounded-lg p-2 pr-10"
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                  >
                    {showPassword.current ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="new"
                    value={passwordData.new}
                    onChange={handlePasswordChange}
                    className="w-full bg-background border border-border rounded-lg p-2 pr-10"
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                  >
                    {showPassword.new ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirm"
                    value={passwordData.confirm}
                    onChange={handlePasswordChange}
                    className="w-full bg-background border border-border rounded-lg p-2 pr-10"
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-2.5 text-muted-foreground"
                  >
                    {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Handle password change logic here
                  setShowPasswordModal(false);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-2">Delete Account Data</h3>
            <p className="text-muted-foreground mb-6">This will permanently delete all your messages, media, and account information. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent/50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Handle delete logic here
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;