import React, { useState, useEffect, useMemo } from 'react';

// Placeholder controls panel for Task 1.4.3; inputs are disabled and not wired yet
export default function ControlsPanel({ value, onChange }) {
  const [temp, setTemp] = useState(value?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(value?.maxTokens ?? 512);
  const [topP, setTopP] = useState(value?.topP ?? 1.0);
  const [model, setModel] = useState(value?.model ?? 'default');
  // Presets mapping; model intentionally left unchanged when applying
  const presets = useMemo(() => ({
    precise: { temperature: 0.2, topP: 0.9, maxTokens: 256 },
    balanced: { temperature: 0.7, topP: 1.0, maxTokens: 512 },
    creative: { temperature: 0.95, topP: 1.0, maxTokens: 768 },
  }), []);
  const currentPreset = useMemo(() => {
    const approx = (a, b) => Math.abs(a - b) < 1e-6;
    if (approx(temp, presets.precise.temperature) && approx(topP, presets.precise.topP) && maxTokens === presets.precise.maxTokens) return 'precise';
    if (approx(temp, presets.balanced.temperature) && approx(topP, presets.balanced.topP) && maxTokens === presets.balanced.maxTokens) return 'balanced';
    if (approx(temp, presets.creative.temperature) && approx(topP, presets.creative.topP) && maxTokens === presets.creative.maxTokens) return 'creative';
    return 'custom';
  }, [temp, topP, maxTokens, presets]);
  const applyPreset = (key) => {
    const p = presets[key];
    if (!p) return;
    setTemp(p.temperature);
    setTopP(p.topP);
    setMaxTokens(p.maxTokens);
  };

  // Sync down when parent value changes (e.g., load from storage)
  useEffect(() => {
    if (!value) return;
    setTemp(value.temperature ?? 0.7);
    setMaxTokens(value.maxTokens ?? 512);
    setTopP(value.topP ?? 1.0);
    setModel(value.model ?? 'default');
  }, [value]);

  // Notify parent on any change
  useEffect(() => {
    onChange?.({ temperature: temp, maxTokens, topP, model });
  }, [temp, maxTokens, topP, model]);
  return (
    <div>
      <div className="controls-grid">
        <div className="control">
          <label className="control-label" htmlFor="preset">
            <span className="control-label-name">Preset</span>
          </label>
          <div className="control-help">Quickly set temperature, top-p, and max tokens.</div>
          <select id="preset" value={currentPreset} onChange={(e) => applyPreset(e.target.value)}>
            <option value="custom">Custom</option>
            <option value="precise">Precise (temp 0.20, top-p 0.90, max 256)</option>
            <option value="balanced">Balanced (temp 0.70, top-p 1.00, max 512)</option>
            <option value="creative">Creative (temp 0.95, top-p 1.00, max 768)</option>
          </select>
        </div>
        <div className="control">
          <label className="control-label" htmlFor="model">
            <span className="control-label-name">Model</span>
          </label>
          <div className="control-help">Backend may restrict available models.</div>
              <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="default">Default (backend)</option>
            <option value="gpt-4o">OpenAI gpt-4o</option>
            <option value="gpt-4o-mini">OpenAI gpt-4o-mini</option>
          </select>
        </div>
        <div className="control">
          <label className="control-label" htmlFor="temp">
            <span className="control-label-name">Temperature</span>
            <span className="control-label-value"> [{temp.toFixed(2)}]</span>
          </label>
          <div className="control-help">0 = deterministic, 1 = more creative (default 0.7)</div>
          <input
            id="temp"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temp}
            onChange={(e) => setTemp(parseFloat(e.target.value))}
          />
        </div>
        <div className="control">
          <label className="control-label" htmlFor="maxTokens">
            <span className="control-label-name">Max tokens</span>
            <span className="control-label-value"> [{maxTokens}]</span>
          </label>
          <div className="control-help">Limits length of the assistant response (default 512)</div>
          <input
            id="maxTokens"
            type="range"
            min="256"
            max="1024"
            step="64"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="control">
          <label className="control-label" htmlFor="topP">
            <span className="control-label-name">Top-p</span>
            <span className="control-label-value"> [{topP.toFixed(2)}]</span>
          </label>
          <div className="control-help">Alternative to temperature; nucleus sampling (default 1.0)</div>
          <input
            id="topP"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
