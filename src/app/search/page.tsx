import type { Metadata } from "next";
import { getFlatsForSearch } from "@/lib/data";
import type { FlatType } from "@/lib/types";
import SearchClient from "./SearchClient";
import Navbar from "@/components/layout/Navbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Your Flat",
  description: "Browse available flats by BHK type, budget, and location. Explore in 3D and schedule a visit.",
};

const VALID_TYPES = ["studio","1bhk","2bhk","3bhk","4bhk","penthouse","office_suite","office_floor"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { types?: string; maxPrice?: string };
}) {
  const rawTypes = (searchParams.types ?? "").split(",").filter(Boolean);
  const types = rawTypes.filter((t) => VALID_TYPES.includes(t)) as FlatType[];
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;

  const flats = await getFlatsForSearch({ types, maxPrice });

  return (
    <>
      <Navbar />
      <SearchClient
        initialFlats={flats}
        initialTypes={types}
        initialMaxPrice={maxPrice}
      />
    </>
  );
}
