import { safeExternalUrl } from "@shared/lib/utils";
import { DollarSignIcon, ExternalLinkIcon, InfoIcon } from "lucide-react";
import { toArray } from "../../lib/product-format";
import type { FeeEntry, Product } from "../../types/product.types";
import { DetailCard } from "./DetailCard";

interface ProductFeesTabProps {
  product: Product;
}

/**
 * Fees tab — up to three cards (each conditional on matching v19 data):
 *   1. Tuition & fees table from `fees_and_funding.fees[]`
 *   2. Fee notes (free-text context)
 *   3. Funding options link (`funding_options_url`)
 *
 * `amount` is the human-readable string scraped verbatim ("AU$18,400",
 * "GBP 9,250–12,000") and is what we render. `value` is numeric (for
 * future totals / sorting) — we don't use it here because ranges like
 * "9,250–12,000" collapse to their lower bound and misrepresent the fee.
 */
export function ProductFeesTab({ product }: ProductFeesTabProps) {
  const fees = toArray<FeeEntry>(product.fees_and_funding?.fees);
  const fundingUrl = safeExternalUrl(product.fees_and_funding?.funding_options_url);
  const feeNotes = product.fees_and_funding?.fee_notes;

  return (
    <div className="space-y-4">
      {fees.length > 0 ? (
        <DetailCard
          title="Tuition & fees"
          icon={DollarSignIcon}
          subtitle={`${fees.length} ${fees.length === 1 ? "entry" : "entries"}`}
          flush
        >
          <table className="w-full border-collapse text-[0.8125rem]">
            <thead>
              <tr>
                <th className="border-b border-border-subtle bg-muted px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Fee type
                </th>
                <th className="border-b border-border-subtle bg-muted px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Cadence
                </th>
                <th className="border-b border-border-subtle bg-muted px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Audience
                </th>
                <th className="border-b border-border-subtle bg-muted px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f, i) => (
                <tr key={i} className="align-middle transition-colors hover:bg-muted/60">
                  <td className="border-b border-border-subtle px-5 py-3 last:border-b-0">
                    <div className="font-medium text-foreground">{f.fee_type ?? "—"}</div>
                    {f.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{f.description}</div>
                    )}
                    {f.academic_year && (
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {f.academic_year}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-border-subtle px-5 py-3 text-muted-foreground last:border-b-0">
                    {f.frequency ?? "—"}
                  </td>
                  <td className="border-b border-border-subtle px-5 py-3 text-muted-foreground last:border-b-0">
                    <AudienceCell fee={f} />
                  </td>
                  <td className="border-b border-border-subtle px-5 py-3 text-right last:border-b-0">
                    <span className="font-semibold tracking-[-0.01em]">{f.amount ?? "—"}</span>
                    {f.currency && !f.amount?.toUpperCase().includes(f.currency) && (
                      <span className="ml-1 font-mono text-[0.6875rem] text-muted-foreground">
                        {f.currency}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailCard>
      ) : (
        <DetailCard title="Tuition & fees" icon={DollarSignIcon}>
          <p className="text-sm italic text-muted-foreground">
            No fees on file for this course yet.
          </p>
        </DetailCard>
      )}

      {feeNotes && (
        <DetailCard title="Fee notes" icon={InfoIcon}>
          <p className="whitespace-pre-wrap text-[0.8125rem] leading-[1.6] text-foreground text-pretty">
            {feeNotes}
          </p>
        </DetailCard>
      )}

      {fundingUrl && (
        <DetailCard title="Funding & scholarships" icon={DollarSignIcon}>
          <a
            href={fundingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft px-3.5 py-2 text-[0.8125rem] font-medium text-primary-strong transition-colors hover:bg-primary/20"
          >
            View funding options
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </DetailCard>
      )}
    </div>
  );
}

function AudienceCell({ fee }: { fee: FeeEntry }) {
  const parts: string[] = [];
  if (fee.for_international_students === "Yes") {
    parts.push("International");
  }
  if (fee.study_mode) {
    parts.push(fee.study_mode);
  }
  if (fee.campus) {
    parts.push(fee.campus);
  }
  if (fee.delivery_mode) {
    parts.push(fee.delivery_mode);
  }
  return <>{parts.length > 0 ? parts.join(" · ") : "—"}</>;
}
