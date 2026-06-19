'use client';
import dynamic from 'next/dynamic';

const AnimeSketchWorld = dynamic(() => import('@/components/AnimeSketchWorld'), { ssr: false });

export default function Home() {
  return <AnimeSketchWorld />;
}
