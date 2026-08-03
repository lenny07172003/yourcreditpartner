import Link from "next/link";

export default function ReferralSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <img src="/logo.png" alt="YourCreditPartner" className="h-10 w-auto mx-auto" />
        </Link>

        <div className="mt-8 rounded-2xl border border-brand-800 bg-brand-900 p-8">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/20 text-3xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white">You&rsquo;re All Set!</h2>
          <p className="mt-3 text-sm text-brand-400">
            Thank you for your interest in improving your credit. Our team will
            reach out shortly to schedule your{" "}
            <strong className="text-brand-300">free consultation</strong>.
          </p>
          <p className="mt-4 text-sm text-brand-400">
            Check your email — we&rsquo;ll send you a link to book a time that
            works best for you.
          </p>
        </div>
      </div>
    </div>
  );
}
