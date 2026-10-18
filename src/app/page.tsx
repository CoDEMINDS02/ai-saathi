import { redirect } from "next/navigation";

// Root par koi alag page nahi. Login ke baad dashboard, warna proxy.ts login par bhej deta hai.
export default function Home() {
  redirect("/dashboard");
}
