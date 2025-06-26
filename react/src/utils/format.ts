export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (unixSeconds: bigint): string =>  {
  const newDate = new Date(Number(unixSeconds) * 1000);
  return newDate.toLocaleDateString();
}