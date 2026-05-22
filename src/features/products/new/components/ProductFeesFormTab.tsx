import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/components/ui/Form";
import { Input } from "@shared/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/Select";
import { CoinsIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { DetailCard } from "../../detail/components/DetailCard";
import { CURRENCIES, type ProductFormValues } from "../../lib/product.schema";

/**
 * Fees & Funding tab. Currently captures the headline tuition only (amount
 * + currency). Funding sources, scholarships, and recurring fees are
 * unsupported by the flat schema — they render as read-only placeholders on
 * the detail page and will join this form once the schema grows.
 */
export function ProductFeesFormTab() {
  const form = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-4">
      <DetailCard title="Tuition" icon={CoinsIcon}>
        <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
          <FormField
            control={form.control}
            name="fees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const raw = event.target.value;
                      field.onChange(raw === "" ? 0 : Number(raw));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((ccy) => (
                      <SelectItem key={ccy} value={ccy}>
                        {ccy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </DetailCard>
    </div>
  );
}
