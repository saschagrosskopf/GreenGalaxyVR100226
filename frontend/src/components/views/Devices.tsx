import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Device } from '../../types';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  useEffect(() => {
    // API returns a promise of Device[] (as per updated api.ts)
    api.devices.list().then(setDevices);
  }, []);

  const generateCode = async () => {
    const res = await api.devices.pairingCode();
    setPairingCode(res.code);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Devices</h2>
        <button 
          onClick={generateCode}
          className="bg-gg-cyan text-gg-navy px-4 py-2 rounded font-bold hover:bg-cyan-400"
        >
          Generate Pairing Code
        </button>
      </div>

      {pairingCode && (
        <div className="bg-gg-cyan/10 border border-gg-cyan text-center p-6 rounded-xl mb-8">
          <p className="text-gg-cyan mb-2">Enter this code in your headset:</p>
          <div className="text-4xl font-mono font-bold text-white">{pairingCode}</div>
          <button onClick={() => setPairingCode(null)} className="text-xs text-gray-400 mt-4 hover:text-white">Close</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-gg-navy-secondary p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">🥽</span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  device.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {device.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{device.name}</h3>
              <p className="text-sm text-gray-500">ID: {device.id}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
              <span>Last seen: {device.lastSeen}</span>
              <button className="text-gg-cyan hover:underline">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Devices;