import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import FeaturedDrinks from "@/components/featured-drinks";
import About from "@/components/about";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedDrinks />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
