import axios from 'axios';

class AdminDisputeService {
  constructor() {
    this.baseURL = 'http://localhost:9999/api/admin/disputes';
    this.token = localStorage.getItem('accessToken') || '';
  }

  refreshToken() {
    this.token = localStorage.getItem('accessToken') || '';
  }

  async getAllDisputes(params = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        headers: { Authorization: `Bearer ${this.token}` },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching disputes', error.response || error);
      throw error;
    }
  }

  async updateDispute(id, body) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}`, body, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating dispute', error.response || error);
      throw error;
    }
  }
}

export default new AdminDisputeService();
