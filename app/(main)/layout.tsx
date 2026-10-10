import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

import Header from "@/components/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <PageTransition>
        {children}
      </PageTransition>
      <Footer />
    </>
  );
}
