import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg-page">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 bg-bg-surface border-b border-line-200 sticky top-0 z-50">
        <span className="text-xl font-bold text-ink-900">ContractIQ</span>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
          AI-powered for NDAs &amp; MSAs
        </div>
        <h1 className="text-5xl font-extrabold text-ink-900 leading-tight mb-6">
          Understand any contract
          <br />
          <span className="text-blue-600">in under 15 minutes</span>
        </h1>
        <p className="text-lg text-ink-600 max-w-2xl mx-auto leading-relaxed mb-10">
          ContractIQ extracts the terms that actually matter from your NDAs and MSAs, shows exactly
          where each clause lives, and answers your questions in plain English — no legal background
          required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-base"
          >
            Review your first contract free
          </Link>
          <Link
            href="/signin"
            className="px-8 py-3 rounded-lg border border-line-200 text-ink-600 font-semibold hover:bg-line-100 transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '📋',
              title: 'Key term extraction',
              body: 'Automatically pulls the 10–30 terms that matter most from NDAs and MSAs — parties, governing law, liability cap, and more.',
            },
            {
              icon: '📍',
              title: 'Page-level citations',
              body: 'Every extracted term links to the exact page in your PDF. Click a term to jump straight to the source.',
            },
            {
              icon: '💬',
              title: 'Contract Q&A',
              body: 'Ask any question about your contract in plain English. ContractIQ answers using only your document — no hallucinations.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-bg-surface rounded-xl border border-line-200 p-6"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold text-ink-900 mb-2">{f.title}</h3>
              <p className="text-sm text-ink-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="border-t border-line-200 py-6 px-6 text-center">
        <p className="text-xs text-ink-400">
          ContractIQ is an AI-assisted review tool, not a law firm. Always consult a qualified
          lawyer for decisions with significant legal or financial consequences.
        </p>
      </footer>
    </main>
  )
}
