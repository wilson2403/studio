import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import PastCeremonies from '@/components/home/PastCeremonies';
import { EditableProvider } from '@/components/home/EditableProvider';
import AyahuascaInfo from '@/components/home/AyahuascaInfo';

export default function Home() {
  return (
    <EditableProvider>
      <Hero />
      <AyahuascaInfo />
      <PastCeremonies />
      <Ceremonies />
    </EditableProvider>
  );
}
