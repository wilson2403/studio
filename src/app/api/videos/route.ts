
import { NextResponse } from 'next/server';
import { getLocalVideos } from '@/lib/firebase/videos';

export async function GET() {
  try {
    const videos = await getLocalVideos();
    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Failed to get local videos:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve local videos', details: error.message },
      { status: 500 }
    );
  }
}
