import { h, render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../styles/options.css';
import { Platform } from '../types/index.js';

interface Settings {
  enabledPlatforms: Platform[];
  breakThreshold: number;
  greyOut: boolean;
}

function OptionsApp() {
  const [settings, setSettings] = useState<Settings>({
    enabledPlatforms: [],
    breakThreshold: 75,
    greyOut: false,
  });

  useEffect(() => {
    chrome.storage.local.get(['settings']).then((data) => {
      if (data.settings) {
        setSettings({
          enabledPlatforms: data.settings.enabledPlatforms || [],
          breakThreshold: data.settings.interventionThresholds?.break_suggestion?.threshold || 75,
          greyOut: data.settings.interventionThresholds?.grey_out?.enabled || false,
        });
      }
    });
  }, []);

  const togglePlatform = (p: Platform) => {
    setSettings((s) => {
      const enabled = s.enabledPlatforms.includes(p);
      const list = enabled ? s.enabledPlatforms.filter(x => x !== p) : [...s.enabledPlatforms, p];
      return { ...s, enabledPlatforms: list };
    });
  };

  const save = () => {
    chrome.storage.local.get(['settings']).then((data) => {
      const current = data.settings || {};
      current.enabledPlatforms = settings.enabledPlatforms;
      current.interventionThresholds = current.interventionThresholds || {};
      current.interventionThresholds.break_suggestion = { enabled: true, threshold: settings.breakThreshold };
      current.interventionThresholds.grey_out = { enabled: settings.greyOut, threshold: 90 };
      chrome.storage.local.set({ settings: current });
    });
  };

  return (
    <div class="p-4 space-y-4">
      <h1 class="text-xl font-bold">Reality Check Options</h1>
      <div>
        <h2 class="font-semibold">Enabled Platforms</h2>
        {Object.values(Platform).map(p => (
          <label class="block" key={p}>
            <input type="checkbox" checked={settings.enabledPlatforms.includes(p)} onChange={() => togglePlatform(p)} /> {p}
          </label>
        ))}
      </div>
      <div>
        <label class="block">Break Suggestion Threshold: {settings.breakThreshold}
          <input type="range" min="50" max="100" value={settings.breakThreshold} onInput={(e) => setSettings({ ...settings, breakThreshold: parseInt((e.target as HTMLInputElement).value, 10) })} />
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={settings.greyOut} onChange={e => setSettings({ ...settings, greyOut: (e.target as HTMLInputElement).checked })} /> Grey-out lockout
        </label>
      </div>
      <button class="px-2 py-1 bg-primary-500 text-white" onClick={save}>Save</button>
    </div>
  );
}

render(<OptionsApp />, document.getElementById('app')!);
