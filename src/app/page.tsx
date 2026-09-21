import { redirect } from "next/navigation";

/** Splash entry — session gate will live elsewhere; start at login for now. */
export default function HomePage() {
  redirect("/login");
}
