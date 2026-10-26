import Navbar from '../src/components/Navbar';
import Hero from '../src/components/Hero';
import About from '../src/components/About';
import Skills from '../src/components/Skills';
import Experience from '../src/components/Experience';
import Achievements from '../src/components/Achievements';
import Projects from '../src/components/Projects';
import GitHub from '../src/components/GitHub';
import Contact from '../src/components/Contact';
import Footer from '../src/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Achievements />
        <Projects />
        <GitHub />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
