import { headers } from "next/headers";
import ClientPage from "./client-page";

export const runtime = 'edge';

export default async function Home() {
  const headersList = await headers();
  const vercelRegion = headersList.get("x-vercel-id") || headersList.get("cf-ray") || "unknown";
  
  return <ClientPage vercelRegion={vercelRegion} />;
}
