import type { Metadata } from "next";
import ShortlistClient from "./ShortlistClient";

export const metadata: Metadata = {
  title: "My Shortlist — FlatBytes",
  description: "Your saved flats, all in one place.",
};

export default function ShortlistPage() {
  return <ShortlistClient />;
}
