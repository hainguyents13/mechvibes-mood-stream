import { NextRequest } from 'next/server';
import { JsonObject } from 'type-fest';

type Song = {
  id: number;
  name: string;
  artist_name: string;
  duration: number; // in seconds
  image: string;
  audio: string;
};

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get('genre') || 'lofi';

  try {
    // Call API to get list of songs
    const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_CLIENT_ID}&format=json&limit=100&tags=${genre}&audioformat=mp31`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const results = ((data as JsonObject).results || []) as Song[];

    const songs = results.map((song: Song) => ({
      id: song.id,
      title: song.name,
      artist: song.artist_name,
      duration: song.duration,
      image: song.image,
      audio: song.audio,
    }));

    const total_duration = songs.reduce((total: number, song) => total + song.duration, 0);

    // Return the list of songs
    return new Response(
      JSON.stringify({
        success: true,
        data: songs,
        total_duration: Math.round(total_duration / 60),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'CDN-Cache-Control': 'max-age=3600',
          'Vercel-CDN-Cache-Control': 'max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching songs:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch songs from API',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
