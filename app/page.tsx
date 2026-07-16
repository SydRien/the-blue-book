import { AuthGate } from "@/components/Auth/AuthGate";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}
