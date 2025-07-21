
import fs from 'fs/promises';
import path from 'path';

/**
 * Retrieves the list of video filenames from the public/videos directory.
 * This function should only be run on the server-side.
 */
export async function getLocalVideos(): Promise<string[]> {
  const videosDirectory = path.join(process.cwd(), 'public/videos');
  try {
    const filenames = await fs.readdir(videosDirectory);
    // Filter to only include video files if necessary, or just return all files.
    const videoFiles = filenames.filter(
      (file) =>
        file.endsWith('.mp4') ||
        file.endsWith('.webm') ||
        file.endsWith('.ogg')
    );
    return videoFiles;
  } catch (error: any) {
    // If the directory doesn't exist, it's not a critical error, just return an empty array.
    if (error.code === 'ENOENT') {
      console.warn('The public/videos directory does not exist. Returning empty list.');
      return [];
    }
    // For other errors, re-throw them.
    console.error('Error reading videos directory:', error);
    throw error;
  }
}
