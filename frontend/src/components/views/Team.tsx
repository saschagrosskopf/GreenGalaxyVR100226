import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, Organization, View } from '../../types';

interface Props {
  currentUser: User;
  setView?: (v: View) => void;
}

const Team: React.FC<Props> = ({ currentUser, setView }) => {
  const [team, setTeam] = useState<User[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [email, setEmail] = useState('');
  const [domainWarning, setDomainWarning] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    const users = await api.team.list();
    const currentOrg = await api.org.get(currentUser.orgId);
    
    setOrg(currentOrg);

    // Merge current user if not in mock list to avoid duplicates if ID matches
    const filteredUsers = users.filter(u => u.email !== currentUser.email && u.id !== currentUser.id);
    setTeam([currentUser, ...filteredUsers]);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    
    // Check domain match
    if (org && org.domains && org.domains.length > 0 && val.includes('@')) {
        const inputDomain = val.split('@')[1];
        if (inputDomain && !org.domains.includes(inputDomain)) {
            setDomainWarning(true);
        } else {
            setDomainWarning(false);
        }
    } else {
        setDomainWarning(false);
    }
  };

  const handleInvite = async () => {
    if (!email) return;
    if (domainWarning) {
        if (!confirm(`Warning: ${email} is outside your verified domain (@${org?.domains?.[0]}). They will have limited access. Continue?`)) {
            return;
        }
    }
    await api.team.invite([email]);
    setEmail('');
    setDomainWarning(false);
    alert("Invitation sent!");
  };

  const handleUpgrade = () => {
    if (setView) setView(View.BRAND);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gg-cyan mb-1">Team Management</h2>
        <p className="text-gray-400">Manage members of your company: <strong className="text-white">{org?.name}</strong></p>
      </div>

      {/* Unverified Warning Banner */}
      {!org?.isBrandVerified && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-yellow-400 text-sm">
            This is a standard, unverified workspace. To get a "Verified" badge and protect your brand name, you can apply for brand verification.
          </p>
          <button 
            onClick={handleUpgrade}
            className="bg-yellow-700/30 hover:bg-yellow-700/50 text-yellow-200 text-xs px-4 py-2 rounded border border-yellow-600/50 transition font-bold"
          >
            Apply for Brand Verification
          </button>
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Subscription & Billing</h3>
        <div className="flex items-center justify-between bg-gg-navy/50 p-4 rounded-lg border border-gray-600">
            <div>
                <p className="text-xs text-gray-400 mb-1">Current Plan</p>
                <p className="text-lg font-bold text-white">
                    {org?.plan === 'ENTERPRISE' ? 'Enterprise Workspace' : 'Standard Workspace'}
                </p>
            </div>
            {org?.plan !== 'ENTERPRISE' && (
                <button 
                    onClick={handleUpgrade}
                    className="bg-gg-cyan text-gg-navy font-bold px-6 py-2 rounded hover:bg-cyan-400 transition"
                >
                    Upgrade Plan
                </button>
            )}
        </div>
      </div>

      {/* Invite Card */}
      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Invite New Member</h3>
        <div className="flex gap-4">
          <div className="flex-1 relative">
             <input 
               type="email" 
               placeholder="colleague@example.com"
               value={email}
               onChange={handleEmailChange}
               className={`w-full bg-gg-navy-secondary border ${domainWarning ? 'border-yellow-500' : 'border-gray-600'} rounded p-3 text-white focus:border-gg-cyan outline-none h-12`}
             />
             {domainWarning && (
                <span className="absolute -bottom-5 left-0 text-xs text-yellow-500">⚠ External domain detected</span>
             )}
          </div>
          <button 
             onClick={handleInvite}
             className="bg-gray-600 hover:bg-gray-500 text-white font-bold px-6 rounded h-12 transition"
          >
             Send Invite
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="mr-2 text-2xl">👥</span> 
            Current Members ({team.length})
        </h3>
        
        <div className="space-y-3">
            {team.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-gg-navy/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                    <div className="flex items-center">
                        <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full mr-4 border border-gray-600" />
                        <div>
                            <div className="text-white font-bold flex items-center">
                                {u.name}
                                {u.role === 'OWNER' && <span className="ml-2 bg-gg-cyan/20 text-gg-cyan text-xs px-2 py-0.5 rounded-full">Admin</span>}
                                {u.id === currentUser.id && <span className="ml-2 text-gray-500 text-xs">(You)</span>}
                            </div>
                            <div className="text-gray-400 text-sm">{u.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select 
                            className="bg-gg-navy border border-gray-600 text-gray-300 text-sm rounded px-2 py-1 outline-none focus:border-gg-cyan"
                            defaultValue={u.role}
                            disabled={u.id === currentUser.id}
                        >
                             <option value="OWNER">Owner</option>
                             <option value="ADMIN">Admin</option>
                             <option value="EDITOR">Editor</option>
                             <option value="VIEWER">Viewer</option>
                        </select>
                        {u.id !== currentUser.id && (
                             <button className="text-gray-500 hover:text-white transition" title="Report / Remove">
                                ⚐
                             </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Team;