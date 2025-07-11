import { baseSepolia } from "wagmi/chains";

const ViewTransaction = ({ txHash } : {txHash: string}) => {
  return (
    <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-center">
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
