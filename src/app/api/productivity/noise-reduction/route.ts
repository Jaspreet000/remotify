import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { enabled, audioData } = await req.json();

    if (enabled && audioData) {
      // Initialize the Gemini Pro Vision model for audio processing
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Process the audio data using Gemini AI
      // Note: This is a simplified example. In a real implementation,
      // you would need to properly handle audio processing and streaming
      const result = await model.generateContent([
        {
          text: 'Analyze and reduce background noise in the following audio data while preserving speech clarity.',
        },
        {
          audio: audioData,
        },
      ]);

      const response = await result.response;
      const processedAudio = response.text(); // In reality, this would be processed audio data

      return NextResponse.json({
        success: true,
        data: {
          enabled: true,
          processedAudio,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: false,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/productivity/noise-reduction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 