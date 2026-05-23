import React, { useEffect, useState } from 'react';
import { Users, Phone, MapPin, Activity, CheckCircle, XCircle } from 'lucide-react';
import Admin from './Admin';

const AdminFarmers = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/farmers`)
      .then(res => res.json())
      .then(data => {
        setFarmers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Admin>
      <div className="animate-fade-up">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[var(--color-text-primary)]">Farmers Management</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Manage the farmers supplying your platform</p>
          </div>
          <button className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-[var(--radius-sm)] font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 text-sm">
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
                        <button className="text-[var(--color-primary)] hover:underline text-sm font-semibold">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Admin>
  );
};

export default AdminFarmers;
