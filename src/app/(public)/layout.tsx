import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
