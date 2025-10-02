import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
      setSocket(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      setConnected(false);
    });

    // Notification events
    newSocket.on('developer_selected', (data) => {
      console.log('📢 Developer selected notification:', data);
      addNotification({
        type: 'success',
        title: 'Developer Selected',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('proposal_selected', (data) => {
      console.log('📢 Proposal selected notification:', data);
      addNotification({
        type: 'success',
        title: 'Your Proposal Selected!',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('proposal_rejected', (data) => {
      console.log('📢 Proposal rejected notification:', data);
      addNotification({
        type: 'warning',
        title: 'Proposal Update',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('vote_cast', (data) => {
      console.log('📢 Vote cast notification:', data);
      addNotification({
        type: 'info',
        title: 'New Vote Cast',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('voting_closed', (data) => {
      console.log('📢 Voting closed notification:', data);
      addNotification({
        type: 'info',
        title: 'Voting Closed',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('new_proposal', (data) => {
      console.log('📢 New proposal notification:', data);
      addNotification({
        type: 'info',
        title: 'New Proposal',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('project_update', (data) => {
      console.log('📢 Project update notification:', data);
      addNotification({
        type: 'info',
        title: 'Project Update',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('new_query', (data) => {
      console.log('📢 New query notification:', data);
      addNotification({
        type: 'info',
        title: 'New Query',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    newSocket.on('query_response', (data) => {
      console.log('📢 Query response notification:', data);
      addNotification({
        type: 'success',
        title: 'Query Response',
        message: data.message,
        data: data,
        timestamp: new Date()
      });
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
  }, [user, token]);

  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotification = {
        ...notification,
        id: notification.id || Math.random().toString(36).substr(2, 9),
        read: false
      };
      
      // Keep only last 50 notifications
      const updated = [newNotification, ...prev].slice(0, 50);
      return updated;
    });
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const joinProject = (projectId) => {
    if (socket && connected) {
      socket.emit('join_project', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && connected) {
      socket.emit('leave_project', projectId);
    }
  };

  return {
    socket,
    connected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearAllNotifications,
    joinProject,
    leaveProject
  };
};
