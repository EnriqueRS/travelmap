import axios from "axios"
import { API_URL, getToken } from "./auth"

export const integrationsService = {
  checkStatus: async () => {
    const token = getToken()
    if (!token) throw new Error("No token")
    const res = await axios.get(`${API_URL}/integrations/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  },

  setupImmich: async (url: string, apiKey: string) => {
    const token = getToken()
    const res = await axios.post(`${API_URL}/integrations/immich`, { url, apiKey }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  },

  getImmichAlbums: async () => {
    const token = getToken()
    const res = await axios.get(`${API_URL}/integrations/immich/albums`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  },

  getImmichAlbumAssets: async (albumId: string) => {
    const token = getToken()
    const res = await axios.get(`${API_URL}/integrations/immich/albums/${albumId}/assets`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  }
}
