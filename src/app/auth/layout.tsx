import { AuthProvider } from "@/lib/auth";

// AuthProvider moved here from the root layout so the public site does not load it.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
