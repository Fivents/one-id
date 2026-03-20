'use client';

import { useEffect,useState } from 'react';

import { Button } from '@/components/ui/button';

export default function TotemDebugPage() {
  const [output, setOutput] = useState<string[]>([]);

  const addLog = (message: string) => {
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    addLog('Debug page loaded');

    // Test 1: localStorage availability
    try {
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      localStorage.removeItem('test');

      if (value === 'value') {
        addLog('✅ localStorage: WORKING');
      } else {
        addLog('❌ localStorage: NOT WORKING - value mismatch');
      }
    } catch (error) {
      addLog(`❌ localStorage: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Check for existing token
    try {
      const token = localStorage.getItem('oneid.totem.token');
      if (token) {
        addLog(`✅ Totem token found: ${token.slice(0, 20)}...`);
      } else {
        addLog('⚠️  No totem token in localStorage');
      }
    } catch (error) {
      addLog(`❌ Error reading token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Check window object
    addLog(`ℹ️  Window object: ${typeof window === 'undefined' ? 'UNDEFINED' : 'AVAILABLE'}`);

    // Test 4: Check navigator
    addLog(`ℹ️  Navigator online: ${navigator.onLine ? 'YES' : 'NO'}`);

    // Test 5: Browser info
    addLog(`ℹ️  User Agent: ${navigator.userAgent.slice(0, 50)}...`);
  }, []);

  const testLogin = async () => {
    addLog('Testing login with code: 7DC175AC');

    try {
      const response = await fetch('/api/totem/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: '7DC175AC' })
      });

      const data = await response.json();

      if (response.ok) {
        addLog(`✅ Login successful`);
        addLog(`Token: ${data.token?.slice(0, 50)}...`);

        // Try to store token
        localStorage.setItem('oneid.totem.token', data.token);
        addLog('✅ Token stored in localStorage');

        const stored = localStorage.getItem('oneid.totem.token');
        if (stored === data.token) {
          addLog('✅ Token verified in localStorage');
        } else {
          addLog('❌ Token NOT verified in localStorage');
        }

        addLog(`Active event: ${data.activeEvent?.name}`);
      } else {
        addLog(`❌ Login failed with status ${response.status}`);
        addLog(`Error: ${data.error || data.code || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSession = async () => {
    const token = localStorage.getItem('oneid.totem.token');

    if (!token) {
      addLog('❌ No token to test session with');
      return;
    }

    addLog('Testing session with stored token...');

    try {
      const response = await fetch('/api/totem/session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        addLog(`✅ Session valid`);
        addLog(`Event: ${data.activeEvent?.name}`);
        addLog(`Expires at: ${new Date(data.expiresAt).toLocaleString()}`);
      } else {
        addLog(`❌ Session invalid with status ${response.status}`);
        addLog(`Error: ${data.error || data.code || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`❌ Session error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearDebug = () => {
    setOutput([]);
    localStorage.removeItem('oneid.totem.token');
    addLog('Debug cleared and token removed');
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <section className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Totem Debug</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button onClick={testLogin} className="bg-cyan-500 text-black hover:bg-cyan-400">
            Test Login
          </Button>
          <Button onClick={testSession} className="bg-emerald-500 text-black hover:bg-emerald-400">
            Test Session
          </Button>
          <Button onClick={clearDebug} className="bg-rose-500 text-black hover:bg-rose-400">
            Clear
          </Button>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
          {output.length === 0 ? (
            <p className="text-zinc-500">Output appear here...</p>
          ) : (
            output.map((line, i) => (
              <div key={i} className="text-zinc-300 mb-1">
                {line}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Test Login" to authenticate with the totem code</li>
            <li>Click "Test Session" to validate the session</li>
            <li>Check the output for any errors</li>
            <li>If successful, you should be able to visit /totem/credentialing</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
