import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import PastCeremonies from '@/components/home/PastCeremonies';

export default function Home() {
  return (
    <>
      <Hero />
      <PastCeremonies />
      <Ceremonies />
    </>
  );
}
