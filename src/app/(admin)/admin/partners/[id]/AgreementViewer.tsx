"use client";

import { useState } from "react";
import { AgreementClickwrap } from "@/components/apply/AgreementClickwrap";

export function AgreementViewer({ version }: { version: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        {open ? "Hide Full Agreement ↑" : `View Full Agreement (${version}) →`}
      </button>

      {open && (
        <div className="mt-4 max-h-[500px] overflow-y-auto rounded-xl border border-line bg-surface-soft p-6">
          <AgreementClickwrap />
        </div>
      )}
    </div>
  );
}
