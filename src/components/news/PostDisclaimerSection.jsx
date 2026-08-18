'use client';

import Link from 'next/link';
import { Shield, Award } from 'lucide-react';

/**
 * Standard anonymity + reward disclaimer shown by default on published
 * bounty/case pages, after the evidence gallery.
 */
export default function PostDisclaimerSection({ className = '' }) {
    return (
        <div className={`space-y-8 border-t pt-6 ${className}`}>
            <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 flex-shrink-0 mt-1 text-primary" />
                <div>
                    <h3 className="font-semibold text-xl mb-2">Anonymity</h3>
                    <p className="text-muted-foreground">
                        WhistleBlower.ng guarantees complete anonymity, meaning anyone who submits information
                        through our platform can do so without ever giving away any personal details. IP addresses
                        are never logged, submissions are never traced back to you, and no account or personal
                        information is ever required.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <Award className="h-6 w-6 flex-shrink-0 mt-1 text-primary" />
                <div>
                    <h3 className="font-semibold text-xl mb-2">Claiming a reward</h3>
                    <p className="text-muted-foreground">
                        The reward will only be payable for information submitted directly through WhistleBlower.ng
                        and verified against this case. After submitting information using the button above, you
                        can{' '}
                        <Link href="/track-report" className="text-primary underline hover:no-underline">
                            track your report
                        </Link>{' '}
                        and request your reward once it is marked as resolved. Once approved, you&apos;ll receive a
                        secure Monnify Paycode that can be withdrawn instantly and anonymously at any Moniepoint POS
                        or agent — no bank account or identification required.
                    </p>
                    <p className="text-muted-foreground mt-3">
                        More details about the rewards process — at the heart of which is ensuring you stay 100%
                        anonymous — can be found{' '}
                        <Link href="/rewards-for-information" className="text-primary underline hover:no-underline">
                            here
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
