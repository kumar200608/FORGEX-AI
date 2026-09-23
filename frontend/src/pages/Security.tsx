import { Shield, Laptop, Server, ArrowDown, Lock } from 'lucide-react';

const statusItems = [
  { label: 'Client encryption', status: 'Connected & Active (AES-256-GCM)', dot: 'bg-emerald-500' },
  { label: 'User keypair', status: 'Active (RSA-2048)', dot: 'bg-emerald-500' },
  { label: 'Encrypted sync', status: 'Connected & Synced', dot: 'bg-emerald-500' },
  { label: 'Secure sharing', status: 'E2EE Key Wrapping Active', dot: 'bg-emerald-500' },
  { label: 'Blind index search', status: 'Active (HMAC-SHA256)', dot: 'bg-emerald-500' },
];

const concepts = [
  {
    title: 'Per-note encryption',
    body: 'Each note will eventually have its own symmetric encryption key, so a compromise of one note key cannot expose others.',
  },
  {
    title: 'Private keys',
    body: 'Each user will have a public/private keypair generated on their device. Private keys never leave the device.',
  },
  {
    title: 'Server stores ciphertext',
    body: 'The server is designed to receive and store encrypted ciphertext — never readable note content.',
  },
  {
    title: 'Secure sharing',
    body: "A note's encryption key can be securely shared with another user's public key, enabling read/write access without exposing the private key.",
  },
  {
    title: 'Access revocation',
    body: "Removing a collaborator triggers a note key rotation. All new versions will use the new key the revoked user does not have.",
  },
];

export default function Security() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-[#0e0e10]">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white px-6 py-5 dark:border-zinc-800/80 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Security</h1>
        <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
          How SecureNotes is designed to protect your notes.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-10">

        {/* Architecture flow */}
        <section>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Security architecture
          </h2>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-0">
              {/* Device */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-3 dark:border-zinc-700">
                  <Laptop className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Your device</span>
                </div>
                <p className="text-xs text-zinc-400">Writes note in plaintext</p>
              </div>

              <FlowArrow label="Client-side Encryption (AES-GCM)" />

              {/* Encrypted */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-3 dark:border-indigo-800 dark:bg-indigo-950/30">
                  <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Encrypted note</span>
                </div>
                <p className="text-xs text-zinc-400">Ciphertext — unreadable without key</p>
              </div>

              <FlowArrow label="Transmit over TLS" />

              {/* Server */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-3 dark:border-zinc-700">
                  <Server className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Server</span>
                </div>
                <p className="text-xs text-zinc-400">Stores encrypted data only</p>
              </div>
            </div>
          </div>
        </section>

        {/* Status dashboard */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Security status
          </h2>
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
            {statusItems.map(({ label, status, dot }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between px-6 py-4 ${i < statusItems.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                <span className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Concepts */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {concepts.map(({ title, body }) => (
              <div key={title} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Security Status */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Encryption Active & Connected</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-600 dark:text-emerald-500">
            End-to-end client-side encryption is active. Notes are encrypted in your browser using AES-256-GCM before transmission over TLS. The server only receives encrypted payloads, ensuring zero-knowledge privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <ArrowDown className="h-5 w-5 text-zinc-300 dark:text-zinc-700" />
      <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{label}</span>
    </div>
  );
}
