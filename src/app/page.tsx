import Hero from '@/components/home/Hero';
import Ceremonies from '@/components/home/Ceremonies';
import PastCeremonies from '@/components/home/PastCeremonies';
import { EditableProvider } from '@/components/home/EditableProvider';

export default function Home() {
  return (
    <EditableProvider>
      <Hero />
      <PastCeremonies />
      <Ceremonies />
    </EditableProvider>
  );
}
