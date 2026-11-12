import React from 'react';
import Hero from '@/components/home/Hero';
import ToolCards from '@/components/home/ToolCards';
import Steps from '@/components/home/Steps';
import BeforeAfter from '@/components/home/BeforeAfter';
import Pricing from '@/components/home/Pricing';
import SampleThumbnails from '@/components/home/SampleThumbnails';

export default function Home() {
  return (
    <div>
      <Hero />
      <ToolCards />
      <SampleThumbnails />
      <Steps />
      <BeforeAfter />
      <Pricing />
    </div>
  );
}
