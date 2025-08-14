import { redirect } from "next/navigation";
import { defaultLocale } from "@/configs/config";

export default function RootPage() {
  redirect(`/${defaultLocale}/auth`);
}
