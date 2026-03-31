import React, { createContext, useContext, useState } from "react";

interface BranchContextType {
    currentBranch: any | null;
    branches: any[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentBranch] = useState<any>(null);
    const [branches] = useState<any[]>([]);

    return (
        <BranchContext.Provider value={{ currentBranch, branches }}>
            {children}
        </BranchContext.Provider>
    );
};

export const useBranch = () => {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
};
