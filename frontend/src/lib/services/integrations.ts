import axios from "axios";
import { API_URL, getToken } from "./auth";

export const integrationsService = {
  checkStatus: async () => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const res = await axios.get(`${API_URL}/integrations/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // ─── Immich ───────────────────────────────────────────────────────────────

  setupImmich: async (url: string, apiKey: string) => {
    const token = getToken();
    const res = await axios.post(
      `${API_URL}/integrations/immich`,
      { url, apiKey },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  getImmichAlbums: async () => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/integrations/immich/albums`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  getImmichAlbumAssets: async (albumId: string) => {
    const token = getToken();
    const res = await axios.get(
      `${API_URL}/integrations/immich/albums/${albumId}/assets`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  // ─── Instagram ────────────────────────────────────────────────────────────

  getInstagramAuthUrl: async (): Promise<string> => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/integrations/instagram/auth-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.url;
  },

  connectInstagram: async (code: string) => {
    const token = getToken();
    const res = await axios.post(
      `${API_URL}/integrations/instagram/callback`,
      { code },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  refreshInstagramToken: async () => {
    const token = getToken();
    const res = await axios.post(
      `${API_URL}/integrations/instagram/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },

  getInstagramMedia: async () => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/integrations/instagram/media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  disconnectInstagram: async () => {
    const token = getToken();
    const res = await axios.delete(`${API_URL}/integrations/instagram`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
