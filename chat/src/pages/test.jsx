import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function UsersAndGroups() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState({
    users: true,
    groups: true
  });
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: '' // 'success' or 'error'
  });
  const navigate = useNavigate();

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data.data);
        setLoading(prev => ({ ...prev, users: false }));
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(prev => ({ ...prev, users: false }));
      }
    };

    fetchUsers();
  }, []);

  // Fetch groups data
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/rooms/unjoined');
        const data = await response.json();
        setGroups(data.data);
        setLoading(prev => ({ ...prev, groups: false }));
      } catch (error) {
        console.error('Error fetching groups:', error);
        setLoading(prev => ({ ...prev, groups: false }));
      }
    };

    fetchGroups();
  }, []);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials
        body: JSON.stringify({
          name: groupName,
          isPrivate: false, // or make this configurable in your UI
          memberIds: selectedUsers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const data = await response.json();
      
      setNotification({
        show: true,
        message: data.message || 'Group created successfully!',
        type: 'success'
      });


      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 1500);

      navigate('/dashboard/people');

      // Reset form and close modal
      setGroupName('');
      setSelectedUsers([]);
      setShowCreateGroupModal(false);

      // Refresh groups list
      const groupsResponse = await fetch('http://localhost:5000/api/rooms/unjoined');
      const groupsData = await groupsResponse.json();
      setGroups(groupsData.data);
      
    } catch (error) {
      console.error('Error creating group:', error);
      setNotification({
        show: true,
        message: 'Failed to create group',
        type: 'error'
      });

      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  const startPrivateChat = async (partnerId) => {
    try {
      const response = await fetch('/api/chats/private', {
        method: 'POST',
        credentials:"include",
        headers: {
          'Content-Type': 'application/json',// Assuming you store token in localStorage
        },
        body: JSON.stringify({ partnerId })
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const chat = await response.json();
      
      setNotification({
        show: true,
        message: 'Chat created successfully!',
        type: 'success'
      });

      const navigationState = {
        selectChatId: chat.id,
        selectChatType: "private", // 'private' or 'group'
        otherUserId: chat.user2_id 
    };

      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 1500);

      navigate('/dashboard/people', { state: navigationState, replace: true }); 

      console.log('Chat created:', chat);
      // You might want to redirect to the chat or update your state here
      
    } catch (error) {
      console.error('Error creating private chat:', error);
      setNotification({
        show: true,
        message: 'Failed to create chat',
        type: 'error'
      });

      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const UserCard = ({ user }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <img 
          src={user.avatar_url} 
          alt={user.username} 
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{user.username}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.is_online ? 'Online' : `Last active: ${formatDate(user.last_active)}`}
          </p>
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
        onClick={() => startPrivateChat(user.id)}
      >
        Start Conversation
      </button>
    </div>
  );

  const GroupCard = ({ group }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-lg">👥</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{group.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by {group.creator_username} on {formatDate(group.created_at)}
          </p>
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
        onClick={() => console.log('Join group', group.id)}
      >
        Join Group
      </button>
    </div>
  );

  const CreateGroupModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Group</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter group name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Members
          </label>
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {users.map(user => (
              <div key={user.id} className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="h-4 w-4 text-gray-600 dark:text-gray-400 focus:ring-gray-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor={`user-${user.id}`} className="ml-3 flex items-center">
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.username}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowCreateGroupModal(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName || selectedUsers.length === 0}
            className={`px-4 py-2 rounded-md text-white ${!groupName || selectedUsers.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 dark:bg-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200'} transition-colors`}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );

  const Notification = () => {
    if (!notification.show) return null;

    return (
      <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        notification.type === 'success' 
          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      }`}>
        {notification.message}
      </div>
    );
  };

  return (
    <div className="font-sans max-w-3xl mx-auto p-4">
      <Notification />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect</h1>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'groups' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Groups
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {loading.users ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : users.length > 0 ? (
            users.map(user => <UserCard key={user.id} user={user} />)
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No users found</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loading.groups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : groups.length > 0 ? (
            <>
              {groups.map(group => <GroupCard key={group.id} group={group} />)}
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No groups available</p>
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
              >
                Create New Group
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateGroupModal && <CreateGroupModal />}
    </div>
  );
}