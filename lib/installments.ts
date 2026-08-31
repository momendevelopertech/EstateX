export interface InstallmentBreakdown {
  price: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  financedAmount: number;
  numberOfInstallments: number;
  frequencyLabel: string;
  perInstallment: number;
  approximateMonthly: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "monthly",
  quarterly: "quarterly",
  "semi-annual": "semi-annual",
  annual: "annual",
};

const MONTHS_PER_PAYMENT: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
};

export function computeInstallments(
  price: number,
  downPaymentPercent: number,
  numberOfInstallments: number,
  frequency = "monthly",
): InstallmentBreakdown {
  const down = downPaymentPercent / 100;
  const downPaymentAmount = Math.round(price * down);
  const financedAmount = price - downPaymentAmount;
  const perInstallment = numberOfInstallments > 0 ? Math.round(financedAmount / numberOfInstallments) : 0;
  const monthsPerPayment = MONTHS_PER_PAYMENT[frequency] ?? 1;
  const approximateMonthly = perInstallment > 0 ? Math.round(perInstallment / monthsPerPayment) : 0;

  return {
    price,
    downPaymentPercent,
    downPaymentAmount,
    financedAmount,
    numberOfInstallments,
    frequencyLabel: FREQUENCY_LABELS[frequency] ?? frequency,
    perInstallment,
    approximateMonthly,
  };
}