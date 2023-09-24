const formatter = new Intl.NumberFormat("hu-HU", {
  style: "currency",
  currency: "HUF",
});

export function formatCurrency(currency: number) {
  return formatter.format(currency);
}
