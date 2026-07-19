import React, { useEffect, useState } from 'react';
import AdminDisputeService from './AdminDisputeService';

export default function ManageDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      AdminDisputeService.refreshToken();
      const p = opts.page || page;
      const l = opts.limit || limit;
      const params = { page: p, limit: l };
      if (opts.status !== undefined) params.status = opts.status;
      else if (statusFilter) params.status = statusFilter;
      if (opts.search !== undefined) params.search = opts.search;
      else if (search) params.search = search;

      const res = await AdminDisputeService.getAllDisputes(params);
      setDisputes(res.data || []);
      setTotalPages(res.totalPages || 1);
      setPage(res.currentPage || p);
      setLimit(l);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assign and Adjudicate actions removed

  // Details modal state
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalResolution, setModalResolution] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const openDetails = (dispute) => {
    setSelected(dispute);
    setModalStatus(dispute.status || 'open');
    setModalResolution(dispute.resolution || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setModalSaving(false);
  };

  const handleSaveDetails = async () => {
    if (!selected) return;
    setModalSaving(true);
    try {
      await AdminDisputeService.updateDispute(selected._id, { status: modalStatus, resolution: modalResolution });
      alert('Dispute updated');
      closeModal();
      load({ page });
    } catch (err) {
      console.error(err);
      alert('Save failed');
      setModalSaving(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await load({ page: 1, search, status: statusFilter });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Manage Disputes</h2>

      <form className="flex gap-2 mb-4" onSubmit={handleSearch}>
        <input className="border px-2 py-1" placeholder="Search... (description, raisedBy username, orderItemId)" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-2 py-1">
          <option value="">--All statuses--</option>
          <option value="open">open</option>
          <option value="under_review">under_review</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
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
                <th className="px-4 py-2">Raised By</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Resolution</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="px-4 py-2">{d.orderItemId?.productId?.title || '—'}</td>
                  <td className="px-4 py-2">{d.raisedBy?.username || d.raisedBy?.[0]?.username || '—'}</td>
                  <td className="px-4 py-2">{d.description || '—'}</td>
                  <td className="px-4 py-2">{d.status}</td>
                  <td className="px-4 py-2">{d.resolution || '—'}</td>
                  <td className="px-4 py-2">
                    <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => openDetails(d)}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Details modal */}
          {showModal && selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-40" onClick={closeModal} />
              <div className="relative bg-white rounded shadow-lg w-full max-w-2xl mx-4 p-6 z-10">
                <h3 className="text-xl mb-4">Dispute Details</h3>

                <div className="mb-3">
                  <label className="block text-sm font-medium">Product</label>
                  <div className="mt-1">{selected.orderItemId?.productId?.title || '—'}</div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium">Raised By</label>
                  <div className="mt-1">{selected.raisedBy?.username || selected.raisedBy?.[0]?.username || '—'}</div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium">Description</label>
                  <div className="mt-1 whitespace-pre-wrap">{selected.description || '—'}</div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium">Status</label>
                  <select value={modalStatus} onChange={(e) => setModalStatus(e.target.value)} className="border px-2 py-1 mt-1 w-full">
                    <option value="open">open</option>
                    <option value="under_review">under_review</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium">Resolution</label>
                  <textarea rows={4} value={modalResolution} onChange={(e) => setModalResolution(e.target.value)} className="border w-full px-2 py-1 mt-1" />
                </div>

                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1 border rounded" onClick={closeModal} disabled={modalSaving}>Cancel</button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleSaveDetails} disabled={modalSaving}>{modalSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div>Page {page} / {totalPages}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => load({ page: page - 1 })} className="px-3 py-1 border rounded">Prev</button>
              <button disabled={page >= totalPages} onClick={() => load({ page: page + 1 })} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>

          {disputes.length === 0 && <div className="mt-4">No disputes</div>}
        </div>
      )}
    </div>
  );
}
