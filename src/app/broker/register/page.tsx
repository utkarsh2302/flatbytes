import type { Metadata } from "next";
import BrokerRegisterClient from "./BrokerRegisterClient";

export const metadata: Metadata = {
  title: "Broker Registration | FlatBytes",
  description: "Join FlatBytes as a channel partner. Register now to access live inventory, earn commissions, and grow your business.",
};

export default function BrokerRegisterPage() {
  return <BrokerRegisterClient />;
}
