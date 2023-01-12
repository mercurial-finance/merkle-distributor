export const fromLamports = (amount: number, decimal: number) => {
  return amount / Math.pow(10, decimal);
};
export const toLamports = (amount: number, decimal: number) => {
  return amount * Math.pow(10, decimal);
};
