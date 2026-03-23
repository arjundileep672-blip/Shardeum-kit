/**
 * useScaffoldContractWrite
 *
 * Mirrors the Scaffold-ETH v2 hook API exactly.
 * In a real Scaffold-ETH v2 app, replace this file's body with:
 *   import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
 *
 * API:
 *   const { writeAsync, isLoading, isMining } = useScaffoldContractWrite({
 *     contractName: "StudyToEarn",
 *     functionName: "completeSession",
 *     args: [sessionId],
 *     onBlockConfirmation: (txnReceipt) => { console.log(txnReceipt) },
 *   });
 *   // call with: await writeAsync({ args: [...] })
 */
import { useState, useCallback } from "react";
import { useMockBlockchain } from "../context/MockBlockchainContext";

export function useScaffoldContractWrite({
    contractName,
    functionName,
    onBlockConfirmation,
}) {
    const { contractWrite } = useMockBlockchain();
    const [isLoading, setLoading] = useState(false);
    const [isMining, setMining] = useState(false);
    const [error, setError] = useState(null);
    const [txHash, setTxHash] = useState(null);

    const writeAsync = useCallback(
        async ({ args = [] } = {}) => {
            setLoading(true);
            setMining(false);
            setError(null);
            try {
                // Phase 1: wallet signing simulation (~600ms included in contractWrite)
                const receipt = await contractWrite(contractName, functionName, args);
                setTxHash(receipt.hash);

                // Phase 2: block confirmation simulation
                setMining(true);
                await new Promise((r) => setTimeout(r, 600));
                setMining(false);

                if (onBlockConfirmation) onBlockConfirmation(receipt);
                return receipt;
            } catch (err) {
                setError(err);
                throw err;
            } finally {
                setLoading(false);
                setMining(false);
            }
        },
        [contractName, functionName, contractWrite, onBlockConfirmation]
    );

    return { writeAsync, isLoading, isMining, error, txHash };
}
