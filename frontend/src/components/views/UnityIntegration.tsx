import React from 'react';

const UnityIntegration: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Unity Integration Guide</h2>
        <p className="text-gray-400">Configure your Unity Project to handle GreenGalaxy Deep Links.</p>
      </div>

      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gg-cyan mb-4">1. Android Manifest Configuration</h3>
        <p className="text-sm text-gray-300 mb-4">Add this intent filter to your <code>AndroidManifest.xml</code> to capture deep links.</p>
        <div className="bg-black/50 p-4 rounded text-xs font-mono text-gray-300 overflow-x-auto">
{`<activity android:name=".UnityPlayerActivity" android:label="@string/app_name">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="greengalaxy" android:host="join" />
    </intent-filter>
</activity>`}
        </div>
      </div>

      <div className="bg-gg-navy-secondary rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gg-purple mb-4">2. DeepLinkManager.cs</h3>
        <p className="text-sm text-gray-300 mb-4">Use this script to parse the <code>spaceId</code> and <code>sessionId</code> and load the correct content.</p>
        <div className="bg-black/50 p-4 rounded text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre">
{`using UnityEngine;
using System.Collections;

public class DeepLinkManager : MonoBehaviour {
    public static DeepLinkManager Instance { get; private set; }
    public string spaceId;
    public string sessionId;

    void Awake() {
        if (Instance == null) { Instance = this; DontDestroyOnLoad(gameObject); }
        else { Destroy(gameObject); return; }
        
        Application.deepLinkActivated += OnDeepLinkActivated;
        if (!string.IsNullOrEmpty(Application.absoluteURL)) {
            OnDeepLinkActivated(Application.absoluteURL);
        }
    }

    private void OnDeepLinkActivated(string url) {
        // url: greengalaxy://join?spaceId=...&sessionId=...
        Debug.Log("Deep link activated: " + url);
        // Parse params and trigger scene load...
    }
}`}
        </div>
      </div>
    </div>
  );
};

export default UnityIntegration;