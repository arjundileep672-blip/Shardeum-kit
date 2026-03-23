import React from "react";
import { MockBlockchainProvider } from "./context/MockBlockchainContext";
import StudyDashboard from "./components/StudyDashboard";

/**
 * App — root component.
 *
 * In a real Scaffold-ETH v2 project:
 *   - Replace MockBlockchainProvider with ScaffoldEthAppWithProviders
 *   - Replace the mock hooks with real Scaffold-ETH v2 hooks from "~~/hooks/scaffold-eth"
 *   - The StudyDashboard component itself stays unchanged
 */
export default function App() {
    return (
        <MockBlockchainProvider>
            <StudyDashboard />
        </MockBlockchainProvider>
    );
}
