export const metadata = {
  title: "OneID Totem",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function TotemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background select-none overscroll-none">
      {children}
    </div>
  );
}
