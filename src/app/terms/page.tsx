'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-black p-8 md:p-24 max-w-4xl mx-auto">
            <Link href="/finances" className="inline-flex items-center gap-2 text-sm font-bold text-black mb-12 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <header className="mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
                <p className="text-black/40 font-medium">Last updated: February 20, 2026</p>
            </header>

            <div className="space-y-12 text-[15px] leading-relaxed text-black/70">
                <section>
                    <h2 className="text-xl font-bold text-black mb-4">1. Agreement to Terms</h2>
                    <p>
                        By using KarrOS and connecting your bank accounts, you agree to these
                        terms. KarrOS is a private tool provided "as-is" for personal use.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-black mb-4">2. Bank Connectivity</h2>
                    <p>
                        Banking features are powered by Enable Banking. You are responsible for
                        maintaining the security of your own bank credentials and your
                        KarrOS environment.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-black mb-4">3. No Financial Advice</h2>
                    <p>
                        KarrOS provides data visualization and organization. It does not
                        provide professional financial, investment, or legal advice. Use of
                        the insights provided is at your own risk.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-black mb-4">4. Limitation of Liability</h2>
                    <p>
                        KarrOS and its developers are not liable for any financial losses,
                        data inaccuracies, or issues arising from third-party banking API
                        availability.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-black mb-4">5. Continuous Consent</h2>
                    <p>
                        Bank authorizations typically expire after 90 days. You will need to
                        re-authorize your connection periodically to maintain transaction
                        syncing.
                    </p>
                </section>
            </div>

            <footer className="mt-24 pt-12 border-t border-black/[0.05] text-black/30 text-[13px]">
                &copy; 2026 KarrOS. Use responsibly.
            </footer>
        </div>
    )
}
