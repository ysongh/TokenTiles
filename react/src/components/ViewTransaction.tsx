import { baseSepolia } from "wagmi/chains";

const ViewTransaction = ({ txHash } : {txHash: string}) => {
  return (
    <div className="mt-4">
      <a
        href={baseSepolia.blockExplorers?.default?.url + "/tx/" + txHash}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Transaction
      </a>
    </div>
  );
};

export default ViewTransaction;
