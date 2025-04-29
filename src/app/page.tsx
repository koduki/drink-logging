
import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/components/app-layout";

export const metadata: Metadata = {
  title: "Drink Logging App",
  description: "Log and rate your favorite drinks.",
};

export default function Home() {
  return (
    <SidebarProvider defaultOpen>
        <AppLayout />
    </SidebarProvider>
  );
}
