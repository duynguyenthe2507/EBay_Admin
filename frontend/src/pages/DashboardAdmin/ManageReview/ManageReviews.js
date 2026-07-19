import React, { useEffect, useState } from 'react';
import AdminReviewService from './AdminReviewService';

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      AdminReviewService.refreshToken();
      const p = opts.page || page;
      const l = opts.limit || limit;
      const params = { page: p, limit: l };
      if (opts.search !== undefined) params.search = opts.search;
      else if (search) params.search = search;
      if (opts.rating !== undefined) params.rating = opts.rating;
      else if (ratingFilter) params.rating = ratingFilter;

      const res = await AdminReviewService.getAllReviews(params);
      // backend returns { success, count, totalPages, currentPage, data }
      setReviews(res.data || []);
      setTotalPages(res.totalPages || 1);
      setPage(res.currentPage || p);
      setLimit(l);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await AdminReviewService.deleteReview(id);
      // reload current page
      await load({ page });
      alert('Deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await load({ page: 1, search });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Manage Reviews</h2>

      <form className="flex gap-2 mb-4" onSubmit={handleSearch}>
        <input className="border px-2 py-1" placeholder="Search... (product, reviewer, comment)" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="border px-2 py-1">
          <option value="">--All ratings--</option>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
        <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); load({ page: 1, limit: parseInt(e.target.value) }); }} className="border px-2 py-1">
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" type="submit">Search</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Reviewer</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Comment</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="px-4 py-2">{r.product?.title || r.product?.[0]?.title || '—'}</td>
                  <td className="px-4 py-2">{r.reviewer?.username || r.reviewer?.[0]?.username || '—'}</td>
                  <td className="px-4 py-2">{r.rating}</td>
                  <td className="px-4 py-2">{r.comment}</td>
                  <td className="px-4 py-2">
                    <button className="mr-2 px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div>Page {page} / {totalPages}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => load({ page: page - 1 })} className="px-3 py-1 border rounded">Prev</button>
              <button disabled={page >= totalPages} onClick={() => load({ page: page + 1 })} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>

          {reviews.length === 0 && <div className="mt-4">No reviews</div>}
        </div>
      )}
    </div>
  );
}
