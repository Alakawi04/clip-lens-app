import React, { useEffect } from 'react';
import Hero from '@/components/home/Hero';
import ToolCards from '@/components/home/ToolCards';
import Steps from '@/components/home/Steps';
import BeforeAfter from '@/components/home/BeforeAfter';
import RecentAnalyses from '@/components/home/RecentAnalyses';
import SampleThumbnails from '@/components/home/SampleThumbnails';

export default function Home() {
  // Desktop: each section snaps gently into its own screen.
  useEffect(() => {
    document.documentElement.classList.add('snap-scroll');
    return () => document.documentElement.classList.remove('snap-scroll');
  }, []);

  return (
    <div>
      <Hero />
      <ToolCards />
      <SampleThumbnails />
      <Steps />
      <BeforeAfter />
      <RecentAnalyses />
    </div>
  );
}