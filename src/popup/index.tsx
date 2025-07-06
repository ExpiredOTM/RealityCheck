import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/options.css';
import { VulnerabilityIndex, ExtensionMessage, MessageType } from '../types/index.js';

function PopupApp() {
  const [vi, setVi] = useState<VulnerabilityIndex | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'get_latest_vi', source: 'popup', timestamp: Date.now() }, (response) => {
      if (response?.vi) {
        setVi(response.vi as VulnerabilityIndex);
      }
    });
  }, []);

  return (
    <div class="space-y-2">
      <h1 class="font-bold">Vulnerability Index</h1>
      {vi ? <p class="text-lg">{vi.current}</p> : <p>Loading...</p>}
      <button class="px-2 py-1 bg-primary-500 text-white" onClick={() => chrome.runtime.openOptionsPage()}>Options</button>
    </div>
  );
}

render(<PopupApp />, document.getElementById('app')!);
