import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export default function useTabs(defaultValue: string) {
  const search = useLocation({ select: (location) => location.search });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(search.tab ?? defaultValue);

  function wrappedSetActiveTab(newActiveTab: string) {
    setActiveTab(newActiveTab);

    void navigate({ to: ".", search: { tab: newActiveTab }, replace: true });
  }

  return { activeTab, setActiveTab: wrappedSetActiveTab };
}
