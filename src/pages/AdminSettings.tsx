import React from 'react';
import AdminLayout from './Admin';
import { Shield, Server, CreditCard, Code, CheckCircle, Smartphone } from 'lucide-react';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="animate-fade-up">
        <h1 className="font-display font-bold text-[28px] text-[var(--color-text-primary)] mb-8">System Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Gateway Setup */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-sm">
            <h2 className="font-bold text-[18px] text-[var(--color-text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3">
              <CreditCard size={20} className="text-blue-500" /> Cashfree Gateway (KL ERP Style)
            </h2>
            
            <div className="space-y-4">
              <div className="bg-[var(--color-surface)] p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Status</div>
                <div className="flex items-center gap-2 text-[14px] font-bold text-green-600">
                  <CheckCircle size={16} /> Fully Integrated & Active
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Environment</div>
                  <div className="text-[14px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block">PROD</div>
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase mb-1">App ID Prefix</div>
                  <div className="text-[14px] font-mono font-bold text-gray-700">128591...</div>
                </div>
              </div>

              <div>
                <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase mb-2">Enabled Features</div>
                <ul className="space-y-2 text-[14px] text-gray-700">
                  <li className="flex items-center gap-2"><Smartphone size={16} className="text-gray-400" /> Dynamic UPI QR generation</li>
                  <li className="flex items-center gap-2"><Smartphone size={16} className="text-gray-400" /> Mobile UPI Intents (GPay/PhonePe)</li>
                  <li className="flex items-center gap-2"><Server size={16} className="text-gray-400" /> Secure Webhook Verification</li>
                  <li className="flex items-center gap-2"><Shield size={16} className="text-gray-400" /> Auto-fallback & Error Handling</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Database & Environment */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-6 shadow-sm">
            <h2 className="font-bold text-[18px] text-[var(--color-text-primary)] flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-3">
              <Server size={20} className="text-[var(--color-primary)]" /> Database & Environment
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Primary Database</div>
                <div className="flex items-center gap-2 text-[14px] font-bold text-orange-500">
                  <Code size={16} /> Firebase Realtime Database
                </div>
              </div>
              
              <div className="bg-[var(--color-surface)] p-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[13px] text-gray-600">
                <p className="mb-2"><strong className="text-gray-800">Auth System:</strong> Custom JWT + Firebase Admin</p>
                <p className="mb-2"><strong className="text-gray-800">Email Service:</strong> Resend HTTP API</p>
                <p><strong className="text-gray-800">Frontend:</strong> React + TypeScript + Vite</p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-[var(--radius-sm)] text-[13px] text-blue-800 flex gap-3">
                <Shield className="flex-shrink-0 mt-0.5" size={16} />
                <p>All sensitive credentials and secret keys are securely stored in the backend <code>.env</code> file and are never exposed to the client side.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
