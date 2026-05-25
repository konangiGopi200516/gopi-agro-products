import React, { useEffect, useState } from 'react';
import { Users, Phone, MapPin, Activity, CheckCircle, XCircle, X } from 'lucide-react';
import Admin from './Admin';
import { API_BASE } from '../services/api';
import { useToast } from '../components/ToastProvider';

const AdminFarmers = () => {
  const { showToast } = useToast();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = () => {
    setLoading(true);
    fetch(`${API_BASE}/farmers`)
      .then(res => res.json())
      .then(data => {
        setFarmers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFarmer, setCurrentFarmer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', field: '', location: '', experience: '', phone: '', status: 'Active', image: ''
  });

  const openModal = (farmer: any = null) => {
    if (farmer) {
      setCurrentFarmer(farmer);
      setFormData({ ...farmer });
    } else {
      setCurrentFarmer(null);
      setFormData({ name: '', field: '', location: '', experience: '', phone: '', status: 'Active', image: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentFarmer(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!currentFarmer;
    const url = isEdit 
      ? `${API_BASE}/farmers/${currentFarmer.id}` 
      : `${API_BASE}/farmers`;
    
    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast(`Farmer ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        closeModal();
        fetchFarmers();
      } else {
        showToast('Failed to save farmer', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving farmer', 'error');
    }
  };

  return (
    <Admin>
      <div className="animate-fade-up">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[var(--color-text-primary)]">Farmers Management</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Manage the farmers supplying your platform</p>
          </div>
          <button onClick={() => openModal()} className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-[var(--radius-sm)] font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 text-sm">
            <Users size={16} /> Add Farmer
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                    <th className="px-6 py-4 text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Farmer Details</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {farmers.map(farmer => (
                    <tr key={farmer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={farmer.image} alt={farmer.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                          <div>
                            <div className="font-bold text-[15px] text-[var(--color-text-primary)]">{farmer.name}</div>
                            <div className="text-[13px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                              <MapPin size={12} /> {farmer.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">{farmer.field}</div>
                        <div className="text-[13px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                          <Activity size={12} /> {farmer.experience}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[14px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                          <Phone size={14} /> {farmer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          farmer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {farmer.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {farmer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(farmer)} className="text-[var(--color-primary)] hover:underline text-sm font-semibold">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{currentFarmer ? 'Edit Farmer' : 'Add Farmer'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input required type="text" value={formData.field} onChange={(e) => setFormData({...formData, field: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input required type="text" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input required type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Admin>
  );
};

export default AdminFarmers;
