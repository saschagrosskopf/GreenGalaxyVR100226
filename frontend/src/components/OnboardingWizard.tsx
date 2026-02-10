

import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  googleProfile: any;
  onComplete: (session: any) => void;
}

const OnboardingWizard: React.FC<Props> = ({ googleProfile, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [orgName, setOrgName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#06B6D4');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [template, setTemplate] = useState('boardroom');
  const [emails, setEmails] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const handleNext = async () => {
    if (step === 3) {
      setLoading(true);
      try {
        const res = await api.devices.pairingCode();
        setPairingCode(res.code);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    
    if (step === 4) {
      setLoading(true);
      try {
        // Finalize registration
        const res = await api.auth.register({
          name: googleProfile.name,
          email: googleProfile.email,
          orgName,
          branding: { primaryColor, secondaryColor, template },
          invites: emails.split(',').map(e => e.trim()).filter(Boolean)
        });
        // The API returns the Session object directly, not wrapped in { session: ... }
        onComplete(res);
      } catch (e) {
        console.error("Registration failed", e);
        alert("Registration failed. Please try again.");
      }
      setLoading(false);
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-gg-navy flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gg-navy-secondary border border-gray-700 rounded-2xl shadow-2xl p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">Setup Organization</h1>
            <span className="text-gg-cyan font-mono">Step {step}/4</span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gg-cyan h-full transition-all duration-500" 
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl text-white font-semibold">Brand Basics</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
              <input 
                type="text" 
                className="w-full bg-gg-navy border border-gray-600 rounded p-3 text-white focus:border-gg-cyan outline-none"
                placeholder="Ex. Acme Corp"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-10 bg-transparent border-0 rounded cursor-pointer" />
                  <span className="text-gray-300">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Secondary Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-10 w-10 bg-transparent border-0 rounded cursor-pointer" />
                  <span className="text-gray-300">{secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl text-white font-semibold">Select VR Brand Template</h2>
            <div className="grid grid-cols-2 gap-4">
              {['boardroom', 'innovation_hub', 'full_office', 'expo_hall'].map(t => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    template === t 
                      ? 'border-gg-cyan bg-gg-cyan/10' 
                      : 'border-gray-700 hover:border-gray-500 bg-gg-navy'
                  }`}
                >
                  <div className="font-bold text-white capitalize mb-1">{t.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-400">Standard layout for {t.split('_')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl text-white font-semibold">Invite Team Members</h2>
            <p className="text-sm text-gray-400">Enter email addresses separated by commas.</p>
            <textarea
              className="w-full h-32 bg-gg-navy border border-gray-600 rounded p-3 text-white focus:border-gg-cyan outline-none resize-none"
              placeholder="alice@example.com, bob@example.com..."
              value={emails}
              onChange={e => setEmails(e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl text-white font-semibold">Connect Your First Headset</h2>
            <div className="bg-white p-4 rounded-lg inline-block mx-auto">
               {/* Mock QR Code */}
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=greengalaxy-pair:${pairingCode}`} alt="QR" />
            </div>
            {pairingCode ? (
              <div>
                <p className="text-gray-400 mb-2">Or enter this code in the GreenGalaxy VR App:</p>
                <div className="text-4xl font-mono font-bold text-gg-cyan tracking-widest">{pairingCode}</div>
              </div>
            ) : (
              <div className="animate-pulse text-gg-cyan">Generating code...</div>
            )}
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Scan this code with your headset or enter the pairing code to link your device to the <strong>{orgName}</strong> organization.
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-end space-x-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-2 text-gray-300 hover:text-white"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading || (step === 1 && !orgName)}
            className={`px-8 py-2 bg-gg-cyan text-gg-navy font-bold rounded-full hover:bg-cyan-400 transition-colors ${
              (loading || (step === 1 && !orgName)) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : step === 4 ? 'Complete Setup' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;