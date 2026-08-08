"use client";

export interface VeteranBenefitFilterState {
  noIncomeTax: boolean;
  retiredPayTax: string;
  disabledPropertyTax: boolean;
  employmentPreference: boolean;
  educationBenefit: boolean;
  parksBenefit: boolean;
  huntFishBenefit: boolean;
}

export const DEFAULT_VETERAN_BENEFIT_FILTERS: VeteranBenefitFilterState = {
  noIncomeTax: false,
  retiredPayTax: "",
  disabledPropertyTax: false,
  employmentPreference: false,
  educationBenefit: false,
  parksBenefit: false,
  huntFishBenefit: false,
};

export default function VeteranBenefitFilters({
  value,
  onChange,
}: {
  value: VeteranBenefitFilterState;
  onChange: (next: VeteranBenefitFilterState) => void;
}) {
  const toggle = (key: keyof VeteranBenefitFilterState) => {
    if (key === "retiredPayTax") return;
    onChange({ ...value, [key]: !value[key] });
  };

  const checks: Array<{
    key: Exclude<keyof VeteranBenefitFilterState, "retiredPayTax">;
    label: string;
  }> = [
    { key: "noIncomeTax", label: "No state income tax" },
    { key: "disabledPropertyTax", label: "Disabled-vet property tax" },
    { key: "employmentPreference", label: "Veteran hiring preference" },
    { key: "educationBenefit", label: "State education benefit" },
    { key: "parksBenefit", label: "State parks benefit" },
    { key: "huntFishBenefit", label: "Hunting / fishing benefit" },
  ];

  return (
    <div className="border-t bg-background/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold">Veteran benefits</span>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Military retirement</span>
          <select
            className="h-8 rounded-md border bg-background px-2"
            value={value.retiredPayTax}
            onChange={(event) =>
              onChange({ ...value, retiredPayTax: event.target.value })
            }
          >
            <option value="">Any treatment</option>
            <option value="untaxed">Fully untaxed</option>
            <option value="partial">Partial exemption</option>
            <option value="conditional">Conditional exemption</option>
            <option value="taxed">Generally taxed</option>
          </select>
        </label>
        {checks.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              checked={Boolean(value[key])}
              onChange={() => toggle(key)}
            />
            <span>{label}</span>
          </label>
        ))}
        <span className="text-xs text-muted-foreground">
          Verified state rows only
        </span>
      </div>
    </div>
  );
}
