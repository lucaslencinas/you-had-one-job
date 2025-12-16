import { headers } from "next/headers";
import ClientPage from "./client-page";

export default async function Home() {
  const headersList = await headers();
  const vercelRegion = headersList.get("x-vercel-id") || "dev (local)";
  
  return <ClientPage vercelRegion={vercelRegion} />;
}
