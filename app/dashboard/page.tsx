import { redirect } from "next/navigation";

// /dashboard is deprecated — redirect to /competicoes

export default function DashboardRedirect() {
  redirect("/competicoes");
}
