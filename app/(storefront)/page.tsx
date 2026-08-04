import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { FeaturedDrop } from "@/components/home/FeaturedDrop";
import { EditorialStrip } from "@/components/home/EditorialStrip";
import { Philosophy } from "@/components/home/Philosophy";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Intro />
        <FeaturedDrop />
        <EditorialStrip />
        <Philosophy />
      </main>
      <Footer />
    </>
  );
}
