import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function useTabs(defaultValue: string) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? defaultValue);

  function wrappedSetActiveTab(newActiveTab: string) {
    setActiveTab(newActiveTab);

    const url = new URL(location.href);
    url.searchParams.set("tab", newActiveTab);
    window.history.replaceState(null, "", url.toString());
  }

  return { activeTab, setActiveTab: wrappedSetActiveTab };
}
