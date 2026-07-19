import axios from 'axios';

class AdminReviewService {
  constructor() {
    this.baseURL = 'http://localhost:9999/api/admin/reviews';
    this.token = localStorage.getItem('accessToken') || '';
  }

  refreshToken() {
    this.token = localStorage.getItem('accessToken') || '';
  }

  async getAllReviews(params = {}) {
    try {
      const response = await axios.get(this.baseURL, {
        headers: { Authorization: `Bearer ${this.token}` },
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews', error.response || error);
      throw error;
    }
  }

  async deleteReview(id) {
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting review', error.response || error);
      throw error;
    }
  }
}

export default new AdminReviewService();
