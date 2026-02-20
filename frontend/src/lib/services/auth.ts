import axios from 'axios';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const API_URL = 'http://localhost:3001'; // Adjust as needed

// Helper to get initial user state
const getInitialUser = () => {
  if (browser) {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const currentUser = writable(getInitialUser());

export const authService = {
  async register(userData: any) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.access_token) {
      this.setSession(response.data);
    }
    return response.data;
  },

  async login(username: string, pass: string) {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password: pass });
    if (response.data.access_token) {
      this.setSession(response.data);
    }
    return response.data;
  },

  logout() {
    if (browser) {
      localStorage.removeItem('user');
      import('../stores/data').then(module => module.resetStores());
    }
    currentUser.set(null);
  },

  setSession(data: any) {
    if (browser) {
      localStorage.setItem('user', JSON.stringify(data));
    }
    currentUser.set(data);
    // Fetch user data if we have a token
    if (data?.access_token) {
      this.fetchUserData(data.access_token);
    }
  },

  getCurrentUser() {
    return getInitialUser();
  },

  async fetchUserData(token: string) {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { updateStores } = await import('../stores/data');
      updateStores(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  },

  async updateProfile(userData: any) {
    // Get current token
    const currentUserData = getInitialUser();
    const token = currentUserData?.access_token;

    if (!token) throw new Error('No authentication token found');

    const response = await axios.patch(`${API_URL}/users/me`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update local stores with the new data
    const { updateStores } = await import('../stores/data');
    updateStores(response.data);

    return response.data;
  }
};
