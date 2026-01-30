import axios from 'axios';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const API_URL = 'http://localhost:3000'; // Adjust as needed

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
  },

  getCurrentUser() {
    return getInitialUser();
  }
};
