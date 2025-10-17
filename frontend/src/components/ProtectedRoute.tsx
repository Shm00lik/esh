import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStatus } from '../api/ApiClient';
import CenteredPage from './CenteredPage/CenteredPage';
import { CircularProgress } from '@mui/material';
import { User } from '../types';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await getUserStatus();
        if (response.data && response.data.is_admin) {
          setUser(response.data);
        } else {
          navigate('/');
        }
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return <CenteredPage><CircularProgress /></CenteredPage>;
  }

  return user ? <>{children}</> : null;
};

export default ProtectedRoute;
