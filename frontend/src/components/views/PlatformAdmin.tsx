
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';

const PlatformAdmin: React.FC = () => {
  const [pendingOrgs, setPendingOrgs] = useState([
    { id: 'org_99', name: 'Stark Industries', owner: 'tony@stark.com', domain: 'stark.com', date: '2023-10-26', plan: 'ENTERPRISE', paid: true },
    { id: 'org_98', name: 'Wayne Enterprises', owner: 'bruce@wayne.com', domain: 'wayne.com', date: '2023-10-25', plan: 'ENTERPRISE', paid: true },
    { id: 'org_97', name: 'Adidas Global', owner: 'admin@adidas.com', domain: 'adidas.com', date: '2023-10-27', plan: 'FREE', paid: false },
  ]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [totalRevenue] = useState(198); // Mock revenue

  useEffect(() => {
      // Load actual user base from persistent DB
      api.platform.listUsers().then(setAllUsers);
  }, []);

  const handleAction = async (orgId: string, action: 'verify' | 'reject') => {
    if (action === 'verify') await api.platform.verifyOrg(orgId);
    else await api.platform.rejectOrg(orgId);
    
    setPendingOrgs(prev => prev.filter(o => o.id !== orgId));
    alert(`Org ${orgId} ${action}ed`);
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-white">Platform Administration</h2>
          <div className="text-right">
              <div className="text-xs text-gray-400 uppercase">Total Revenue (MRR)</div>
              <div className="text-3xl font-bold text-green-400">${totalRevenue.toLocaleString()}</div>
          </div>
      </div>
      
      {/* Brand Verification Queue */}
      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <span className="font-bold text-white">Brand Verification Requests</span>
            <div className="flex space-x-2">
                 <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded border border-yellow-500/30">
                    {pendingOrgs.filter(o => o.paid).length} Priority (Paid)
                 </span>
                 <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded">
                    {pendingOrgs.filter(o => !o.paid).length} Free
                 </span>
            </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-gray-400">
            <tr>
              <th className="px-6 py-3">Organization</th>
              <th className="px-6 py-3">Domain</th>
              <th className="px-6 py-3">Requester</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-gray-300">
            {pendingOrgs.map(org => (
              <tr key={org.id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-bold text-white">
                    {org.name}
                    {org.paid && <span className="ml-2 text-xs text-yellow-400 border border-yellow-400/30 px-1 rounded">PAID</span>}
                </td>
                <td className="px-6 py-4 font-mono text-gg-cyan">@{org.domain}</td>
                <td className="px-6 py-4">{org.owner}</td>
                <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${org.plan === 'ENTERPRISE' ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {org.plan}
                    </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => handleAction(org.id, 'verify')} className="text-green-400 hover:text-green-300 bg-green-900/20 px-3 py-1 rounded border border-green-900/50">Verify</button>
                  <button onClick={() => handleAction(org.id, 'reject')} className="text-red-400 hover:text-red-300 ml-2">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Repository / Audit Log */}
      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Global User Directory (Returning Customers)</h3>
            <p className="text-xs text-gray-400">List of all authenticated users stored in the platform database.</p>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-gray-400">
                <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Org ID</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
                {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5">
                        <td className="px-6 py-3 flex items-center">
                            <img src={u.picture} className="w-6 h-6 rounded-full mr-3" alt="" />
                            {u.name}
                        </td>
                        <td className="px-6 py-3">{u.email}</td>
                        <td className="px-6 py-3">
                            <span className="bg-gg-purple/20 text-gg-purple px-2 py-0.5 rounded text-xs border border-gg-purple/30">
                                {u.role}
                            </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{u.orgId}</td>
                    </tr>
                ))}
                {allUsers.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-6 text-center text-gray-500">No users found in database.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

    </div>
  );
};

export default PlatformAdmin;
