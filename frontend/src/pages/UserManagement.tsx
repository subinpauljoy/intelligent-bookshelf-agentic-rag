import { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const toggleSuperuser = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { is_superuser: !user.is_superuser });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  
  const toggleActive = async (user: User) => {
      try {
        await api.put(`/users/${user.id}`, { is_active: !user.is_active });
        fetchUsers();
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                  <Checkbox checked={user.is_active} onChange={() => toggleActive(user)} />
              </TableCell>
              <TableCell>
                <Checkbox checked={user.is_superuser} onChange={() => toggleSuperuser(user)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default UserManagement;