import { GoogleGenerativeAI } from '@google/generative-ai';
import { type NextRequest, NextResponse } from 'next/server';

interface ContextData {
  context: string;
  keywords: string[];
  event_type: string;
  people_count: number;
  setting: string;
  colors: string[];
  objects: string[];
  mood: string;
  // Use a more specific type for additional properties
  [key: string]: string | string[] | number | boolean | null | undefined;
}

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Fetch the image data
    const response = await fetch(imageUrl);
    const imageData = await response.arrayBuffer();
    
    // Convert to base64
    const base64Image = Buffer.from(imageData).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    // Initialize the Gemini 1.5 Flash model (replacing the deprecated gemini-pro-vision)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare the image parts for the model
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ];

    // Generate context and keywords for the image
    const result = await model.generateContent([
      'Analyze this image and provide the following in JSON format:\n' +
      '1. A detailed description of the image (context)\n' +
      '2. A list of keywords that describe the content (keywords)\n' +
      '3. Identify any events or occasions visible (event_type)\n' +
      '4. Estimate the number of people visible (people_count)\n' +
      '5. Describe the setting or location (setting)\n' +
      '6. Identify the dominant colors (colors)\n' +
      '7. Identify any notable objects (objects)\n' +
      '8. Determine the overall mood or emotion (mood)\n\n' +
      'Format the response as a valid JSON object with these fields.',
      ...imageParts,
    ]);

    const textResult = result.response.text();
    
    // Extract the JSON part from the response
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    let contextData: ContextData;
    
    if (jsonMatch) {
      try {
        contextData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // If parsing fails, try to clean up the JSON
        const cleanedJson = jsonMatch[0]
          .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
          .replace(/:\s*'([^']*)'/g, ': "$1"')  // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}');  // Remove trailing commas
        
        try {
          contextData = JSON.parse(cleanedJson);
        } catch (e) {
          // If still fails, return a structured error response
          return NextResponse.json(
            { 
              error: 'Failed to parse AI response',
              rawResponse: textResult 
            },
            { status: 500 }
          );
        }
      }
    } else {
      // If no JSON found, create a basic structure from the text
      contextData = {
        context: textResult,
        keywords: [],
        event_type: "unknown",
        people_count: 0,
        setting: "unknown",
        colors: [],
        objects: [],
        mood: "unknown"
      };
    }

    // Create a rich context text for embedding
    const contextText = [
      contextData.context,
      ...(contextData.keywords || []),
      contextData.event_type,
      contextData.setting,
      ...(contextData.objects || []),
      contextData.mood
    ].filter(Boolean).join(' ');

    // Generate embeddings using Gemini's embedding model
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddingResult = await embeddingModel.embedContent([contextText]);
    const embedding = embeddingResult.embedding.values;

    // Return the context data along with the embedding
    return NextResponse.json({
      ...contextData,
      contextText,
      embedding
    });
  } catch (error) {
    console.error('Error generating context:', error);
    return NextResponse.json(
      { error: 'Failed to generate context', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
