import { useState, useEffect } from "react";

export function useOperationMode() {
  const [isOperationMode, setIsOperationMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("operationMode");
      if (stored !== null) {
        return stored === "true";
      }
      // Check cookie as fallback
      const match = document.cookie.match(/(?:^|; )operationMode=([^;]*)/);
      if (match) {
        return match[1] === "true";
      }
    }
    return false;
  });

  useEffect(() => {
    const syncState = () => {
      const stored = localStorage.getItem("operationMode");
      if (stored !== null) {
        setIsOperationMode(stored === "true");
      }
    };

    syncState();

    const handleStorageChange = (e: any) => {
      if (e.key === "operationMode" || e.type === "operationModeChanged") {
        syncState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("operationModeChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("operationModeChanged", handleStorageChange);
    };
  }, []);

  const toggleMode = (val: boolean) => {
    setIsOperationMode(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("operationMode", val ? "true" : "false");
      document.cookie = `operationMode=${val ? "true" : "false"}; path=/; max-age=31536000; samesite=lax`;
      window.dispatchEvent(new Event("operationModeChanged"));
    }
  };

  return { isOperationMode, toggleMode };
}
