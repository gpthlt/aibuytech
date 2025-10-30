import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Loading from '../../components/Loading';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import './ManageUsers.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (filter !== 'all') params.role = filter;
      if (searchQuery) params.q = searchQuery;

      const { data } = await api.get('/api/v1/admin/users', { params });
      setUsers(data.data.data);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await api.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/admin/users/${userId}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="manage-users">
      <div className="page-header">
        <h1>Manage Users</h1>
      </div>

      {/* Filters */}
      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="role-filter">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => {
              setFilter('all');
              setCurrentPage(1);
            }}
          >
            All Users
          </button>
          <button
            className={filter === 'user' ? 'active' : ''}
            onClick={() => {
              setFilter('user');
              setCurrentPage(1);
            }}
          >
            Users
          </button>
          <button
            className={filter === 'admin' ? 'active' : ''}
            onClick={() => {
              setFilter('admin');
              setCurrentPage(1);
            }}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id, user.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}

export default ManageUsers;
