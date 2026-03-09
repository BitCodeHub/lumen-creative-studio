import { NextRequest, NextResponse } from "next/server";

// Sample gallery data - in production, this would come from a database
const sampleGalleryImages = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500",
    prompt: "A mystical forest at twilight, rays of golden light filtering through ancient trees, fireflies dancing in the mist, fantasy art style, highly detailed",
    model: "FLUX.1-dev",
    likes: 234,
    createdAt: "2026-03-08T10:30:00Z"
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
    prompt: "Majestic mountain peaks at sunrise, snow-capped summits reflecting orange and pink light, dramatic clouds, landscape photography, 8k ultra HD",
    model: "RealVisXL",
    likes: 189,
    createdAt: "2026-03-08T09:15:00Z"
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
    prompt: "Photorealistic portrait of a woman with flowing auburn hair, soft studio lighting, shallow depth of field, professional photography, detailed skin texture",
    model: "RealVisXL",
    likes: 456,
    createdAt: "2026-03-08T08:45:00Z"
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500",
    prompt: "Futuristic cyberpunk cityscape at night, neon lights reflecting on wet streets, flying vehicles, holographic advertisements, blade runner aesthetic",
    model: "FLUX.1-dev",
    likes: 312,
    createdAt: "2026-03-08T07:30:00Z"
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500",
    prompt: "Beautiful young woman with natural makeup, warm golden hour lighting, candid smile, bokeh background, lifestyle photography",
    model: "RealVisXL",
    likes: 567,
    createdAt: "2026-03-08T06:20:00Z"
  },
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500",
    prompt: "Handsome man in casual street style, urban background, natural daylight, fashion photography, high resolution",
    model: "RealVisXL",
    likes: 289,
    createdAt: "2026-03-08T05:10:00Z"
  },
  {
    id: "7",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
    prompt: "Professional headshot, male executive, confident expression, neutral gray background, corporate photography style",
    model: "FLUX Schnell",
    likes: 145,
    createdAt: "2026-03-08T04:00:00Z"
  },
  {
    id: "8",
    imageUrl: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=500",
    prompt: "Dramatic ocean waves crashing against rocky cliffs, stormy sky, moody atmosphere, nature photography, long exposure",
    model: "FLUX.1-dev",
    likes: 423,
    createdAt: "2026-03-07T23:30:00Z"
  },
  {
    id: "9",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500",
    prompt: "Abstract art composition with flowing colors, purple and gold palette, fluid dynamics, modern art, digital painting",
    model: "FLUX.1-dev",
    likes: 198,
    createdAt: "2026-03-07T22:15:00Z"
  },
  {
    id: "10",
    imageUrl: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=500",
    prompt: "Cute robot companion with expressive LED eyes, white and chrome design, soft lighting, product visualization, 3D render",
    model: "FLUX.1-dev",
    likes: 367,
    createdAt: "2026-03-07T21:00:00Z"
  },
  {
    id: "11",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500",
    prompt: "Milky way galaxy over snowy mountain, astrophotography, night sky, stars, long exposure, wilderness landscape",
    model: "FLUX.1-dev",
    likes: 521,
    createdAt: "2026-03-07T20:30:00Z"
  },
  {
    id: "12",
    imageUrl: "https://images.unsplash.com/photo-1516820215024-2fa9c7eb9ed5?w=500",
    prompt: "Vintage sports car, red Ferrari 250 GTO, studio lighting, showroom photography, automotive art, high detail",
    model: "RealVisXL",
    likes: 445,
    createdAt: "2026-03-07T19:45:00Z"
  },
  {
    id: "13",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    prompt: "Minimalist product photography, luxury watch on marble surface, soft shadows, high-end advertising, clean composition",
    model: "FLUX Schnell",
    likes: 234,
    createdAt: "2026-03-07T18:30:00Z"
  },
  {
    id: "14",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    prompt: "Sleek wireless headphones floating with dynamic lighting, product photography, tech aesthetic, minimalist background",
    model: "FLUX.1-dev",
    likes: 312,
    createdAt: "2026-03-07T17:15:00Z"
  },
  {
    id: "15",
    imageUrl: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=500",
    prompt: "Golden retriever puppy playing in autumn leaves, natural sunlight, shallow depth of field, pet photography, adorable",
    model: "RealVisXL",
    likes: 678,
    createdAt: "2026-03-07T16:00:00Z"
  },
  {
    id: "16",
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=500",
    prompt: "Serene Japanese zen garden, cherry blossoms, traditional architecture, peaceful morning light, fine art photography",
    model: "FLUX.1-dev",
    likes: 389,
    createdAt: "2026-03-07T15:30:00Z"
  },
  {
    id: "17",
    imageUrl: "https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=500",
    prompt: "Delicious gourmet burger with melted cheese, sesame bun, fresh ingredients, food photography, restaurant quality",
    model: "RealVisXL",
    likes: 256,
    createdAt: "2026-03-07T14:45:00Z"
  },
  {
    id: "18",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
    prompt: "Artisan coffee latte art, rosetta pattern, rustic wooden table, café atmosphere, warm tones, lifestyle photography",
    model: "FLUX Schnell",
    likes: 198,
    createdAt: "2026-03-07T13:20:00Z"
  },
  {
    id: "19",
    imageUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=500",
    prompt: "Colorful breakfast spread, fresh fruits, pancakes with berries, morning light, food styling, top-down view",
    model: "RealVisXL",
    likes: 345,
    createdAt: "2026-03-07T12:00:00Z"
  },
  {
    id: "20",
    imageUrl: "https://images.unsplash.com/photo-1485217988980-11786ced9454?w=500",
    prompt: "Modern home office setup, minimalist desk, large monitor, plants, natural light, interior design photography",
    model: "FLUX.1-dev",
    likes: 278,
    createdAt: "2026-03-07T11:30:00Z"
  },
  // Add more sample images for infinite scroll
  {
    id: "21",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500",
    prompt: "Team collaboration in modern office, diverse group working together, creative workspace, corporate photography",
    model: "RealVisXL",
    likes: 167,
    createdAt: "2026-03-07T10:15:00Z"
  },
  {
    id: "22",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    prompt: "Developer coding on laptop, lines of code visible, moody lighting, technology aesthetic, programming",
    model: "FLUX Schnell",
    likes: 234,
    createdAt: "2026-03-07T09:00:00Z"
  },
  {
    id: "23",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500",
    prompt: "Futuristic AI neural network visualization, glowing connections, dark background, technology concept art",
    model: "FLUX.1-dev",
    likes: 456,
    createdAt: "2026-03-07T08:30:00Z"
  },
  {
    id: "24",
    imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500",
    prompt: "Smartphone displaying social media feed, hand holding phone, blurred background, lifestyle technology",
    model: "RealVisXL",
    likes: 189,
    createdAt: "2026-03-07T07:45:00Z"
  },
  {
    id: "25",
    imageUrl: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500",
    prompt: "Elegant fashion model in haute couture, dramatic studio lighting, high fashion photography, editorial style",
    model: "RealVisXL",
    likes: 534,
    createdAt: "2026-03-07T06:20:00Z"
  },
  {
    id: "26",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500",
    prompt: "Street style fashion, urban background, confident pose, trendy outfit, lifestyle photography",
    model: "FLUX.1-dev",
    likes: 312,
    createdAt: "2026-03-07T05:00:00Z"
  },
  {
    id: "27",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
    prompt: "Fitness athlete mid-workout, dynamic action shot, gym setting, motivational, sports photography",
    model: "RealVisXL",
    likes: 267,
    createdAt: "2026-03-07T04:30:00Z"
  },
  {
    id: "28",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500",
    prompt: "Tropical beach paradise, crystal clear water, palm trees, sunset colors, travel photography, vacation vibes",
    model: "FLUX.1-dev",
    likes: 623,
    createdAt: "2026-03-07T03:15:00Z"
  },
  {
    id: "29",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500",
    prompt: "Misty forest path with sunbeams, enchanted woodland, nature photography, moody atmosphere, wanderlust",
    model: "FLUX.1-dev",
    likes: 445,
    createdAt: "2026-03-07T02:00:00Z"
  },
  {
    id: "30",
    imageUrl: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=500",
    prompt: "Northern lights aurora borealis over snowy landscape, night photography, Iceland, natural wonder, vibrant colors",
    model: "FLUX.1-dev",
    likes: 789,
    createdAt: "2026-03-07T01:30:00Z"
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const paginatedImages = sampleGalleryImages.slice(start, end);
  const hasMore = end < sampleGalleryImages.length;
  
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json({
    images: paginatedImages,
    hasMore,
    total: sampleGalleryImages.length,
    page,
    limit
  });
}

// POST endpoint to add new images to gallery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, prompt, model } = body;
    
    // In production, save to database
    const newImage = {
      id: Date.now().toString(),
      imageUrl,
      prompt,
      model,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    
    // Add to beginning of array (in production, save to DB)
    sampleGalleryImages.unshift(newImage);
    
    return NextResponse.json({ success: true, image: newImage });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
