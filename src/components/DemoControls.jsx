import { useAdaptive } from '../adaptive/AdaptiveProvider.jsx'
import { useState } from 'react'
import { clear as clearCart } from '../cart.js'

const OPTIONS = {
  network: [['auto', 'Auto (live)'], ['fast', 'Fast 5G'], ['slow3g', 'Slow 3G']],
  device: [['auto', 'Auto (this device)'], ['high', 'High-end'], ['low', 'Low-end']],
}

const LABEL = { network: 'Network', device: 'Device' }

export default function DemoControls() {
  const { overrides, setOverride, resetOverrides, refresh, probe, decision, prediction, preemptive, setPreemptive } = useAdaptive()
  const [open, setOpen] = useState(false)
  const realNet = decision.signals?.network || {}
  const realDev = decision.signals?.device || {}

  return (
    <>
      <button
        className="demo-fab"
        onClick={() => setOpen(!open)}
        data-testid="demo-fab"
        aria-expanded={open}
        aria-controls="demo-controls-panel"
      >
        {open ? '×' : 'Demo'}
      </button>
      {open && (
        <aside
          className="demo-panel"
          id="demo-controls-panel"
          data-testid="demo-panel"
          aria-label="Demo controls"
        >
          <div className="panel-head">
            <h3>Demo controls</h3>
            <p className="panel-sub">Force the signals the engine sees. Everything else stays real.</p>
          </div>

          {Object.entries(OPTIONS).map(([key, opts]) => (
            <div className="control-group" key={key}>
              <span className="control-label" id={`demo-${key}-label`}>{LABEL[key]}</span>
              <div className="seg" role="group" aria-labelledby={`demo-${key}-label`}>
                {opts.map(([val, label]) => (
                  <button
                    key={val}
                    className={`seg-btn ${(overrides[key] || 'auto') === val ? 'active' : ''}`}
                    onClick={() => setOverride(key, val)}
                    aria-pressed={(overrides[key] || 'auto') === val}
                    data-testid={`${key}-${val}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="control-group">
            <span className="control-label" id="demo-save-data-label">Save-Data header</span>
            <div className="seg" role="group" aria-labelledby="demo-save-data-label">
              <button className={`seg-btn ${!overrides.saveData ? 'active' : ''}`} onClick={() => setOverride('saveData', false)} aria-pressed={!overrides.saveData}>Off</button>
              <button className={`seg-btn ${overrides.saveData ? 'active' : ''}`} onClick={() => setOverride('saveData', true)} aria-pressed={!!overrides.saveData}>On</button>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label" id="demo-preempt-label">Pre-emptive adaptation</span>
            <div className="seg" role="group" aria-labelledby="demo-preempt-label">
              <button
                className={`seg-btn ${!preemptive ? 'active' : ''}`}
                onClick={() => setPreemptive(false)}
                aria-pressed={!preemptive}
              >
                Off
              </button>
              <button
                className={`seg-btn ${preemptive ? 'active' : ''}`}
                onClick={() => setPreemptive(true)}
                aria-pressed={preemptive}
              >
                On
              </button>
            </div>
          </div>

          <div className="panel-actions">
            <button className="btn ghost" onClick={refresh}>Re-run probe</button>
            <button
              className="btn danger"
              onClick={() => { resetOverrides(); clearCart() }}
              data-testid="reset-demo"
            >
              Reset demo
            </button>
          </div>

          <div className="live-signals">
            <h4>Live signals (measured)</h4>
            <ul>
              <li>effectiveType <b>{realNet.effectiveType || '—'}</b></li>
              <li>downlink <b>{realNet.downlink ?? '—'}</b> Mbps · rtt <b>{realNet.rtt ?? '—'}</b> ms</li>
              <li>probe <b>{probe && probe.ok ? `${probe.mbps.toFixed(1)} Mbps` : probe ? 'failed' : '—'}</b></li>
              <li>
                memory <b>{realDev.memoryGB ?? '—'} GB</b> · cores <b>{realDev.cores ?? '—'}</b>
                {realDev.deviceFallback && <em> (estimated — this browser exposes no device memory API)</em>}
              </li>
              <li>viewport <b>{realDev.viewportW}×{realDev.viewportH}</b></li>
              <li>
                predicted next link{' '}
                <b>{prediction.ready ? `${prediction.state} (${Math.round(prediction.confidence * 100)}%)` : 'collecting…'}</b>
              </li>
            </ul>
          </div>
        </aside>
      )}
    </>
  )
}
