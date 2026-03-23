/**
 * useScaffoldContractRead
 *
 * Mirrors the Scaffold-ETH v2 hook API exactly.
 * In a real Scaffold-ETH v2 app, replace this file's body with:
 *   import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
 *
 * API:
 *   const { data, isLoading, error, refetch } = useScaffoldContractRead({
 *     contractName: "StudyToEarn",
 *     functionName: "getSession",
 *     args: [sessionId],
 *   });
 */
import { useState, useEffect, useCallback } from "react";
import { useMockBlockchain } from "../context/MockBlockchainContext";

export function useScaffoldContractRead({ contractName, functionName, args = [], watch = false }) {
    const { contractRead } = useMockBlockchain();
    const [data, setData] = useState(undefined);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const argsKey = JSON.stringify(args, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
    );

    const fetch = useCallback(() => {
        setLoading(true);
        setError(null);
        // Simulate a short async read (RPC latency ~300ms)
        const timer = setTimeout(() => {
            try {
                const result = contractRead(contractName, functionName, args);
                setData(result);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractName, functionName, argsKey, contractRead]);

    useEffect(() => {
        const cleanup = fetch();
        return cleanup;
    }, [fetch]);

    // If watch=true, re-read every 4 seconds (simulates block polling)
    useEffect(() => {
        if (!watch) return;
        const id = setInterval(fetch, 4000);
        return () => clearInterval(id);
    }, [watch, fetch]);

    return { data, isLoading, error, refetch: fetch };
}
