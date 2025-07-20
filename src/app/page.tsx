import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import VideoCarousel from '@/components/home/VideoCarousel';

export default function Home() {
  return (
    <>
      <Hero />
      <VideoCarousel />
      <Ceremonies />
    </>
  );
}
