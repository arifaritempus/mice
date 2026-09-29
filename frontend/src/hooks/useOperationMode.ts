import { useState, useEffect } from "react";

export function useOperationMode() {
  const [isOperationMode, setIsOperationMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("operationMode");
    if (stored === "true") {
      setIsOperationMode(true);
    }

    const handleStorageChange = (e: any) => {
      if (e.key === "operationMode" || e.type === "operationModeChanged") {
        const newVal = localStorage.getItem("operationMode") === "true";
        setIsOperationMode(newVal);
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
    localStorage.setItem("operationMode", val ? "true" : "false");
    window.dispatchEvent(new Event("operationModeChanged"));
  };

  return { isOperationMode, toggleMode };
}
