import React, { createContext, useContext, useState } from "react";

interface ThemeContextType {
    isDark: boolean;
    colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark] = useState(false);
    const colors = {
        primary: "#1D5A34",
        primaryLight: "#66BB6A",
        primaryDark: "#164829",
        bgLight: "#F1F8E9",
        softGreen: "#E8F5E9",
        accentOrange: "#FF9800",
        background: "#F1F8E9",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        text: "#1F2937",
        textSecondary: "#4B5563",
        textMuted: "#6B7280",
        border: "#D6E4D2",
        statusBar: "dark",
    };

    return (
        <ThemeContext.Provider value={{ isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
