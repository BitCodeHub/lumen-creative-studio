import { NextRequest, NextResponse } from "next/server";

// Extended gallery data with AI-style prompts
// In production, this would come from a database connected to your generations
const sampleGalleryImages = [
  // Page 1 (1-20)
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=90",
    prompt: "Photorealistic portrait of a woman with flowing auburn hair, detailed skin pores, piercing green eyes, soft diffused studio lighting, 8k uhd, hyperrealistic, professional portrait photography, shallow depth of field, cinematic",
    model: "RealVisXL V4",
    likes: 2847,
    createdAt: "2026-03-09T06:30:00Z"
  },
  {
    id: "2", 
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=90",
    prompt: "A mystical enchanted forest at twilight, rays of ethereal golden light filtering through ancient towering trees, fireflies dancing in luminous mist, fantasy art style, highly detailed foliage, magical atmosphere, 4k",
    model: "FLUX.1-dev",
    likes: 1923,
    createdAt: "2026-03-09T05:45:00Z"
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=90",
    prompt: "Majestic snow-capped mountain peaks at golden hour sunrise, dramatic alpine landscape, warm orange and pink light reflecting off pristine snow, sweeping vista, landscape photography, National Geographic style, 8k ultra HD",
    model: "FLUX.1-dev",
    likes: 3156,
    createdAt: "2026-03-09T05:00:00Z"
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=90",
    prompt: "Beautiful young woman with natural makeup and warm smile, golden hour sunlight, candid expression, soft bokeh background, lifestyle portrait photography, genuine emotion, high resolution",
    model: "RealVisXL V4",
    likes: 4521,
    createdAt: "2026-03-09T04:30:00Z"
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=90",
    prompt: "Futuristic cyberpunk cityscape at night, towering neon-lit skyscrapers, flying vehicles streaming through rain-slicked streets, holographic advertisements, blade runner aesthetic, cinematic composition, volumetric fog, 4k",
    model: "FLUX.1-dev",
    likes: 2678,
    createdAt: "2026-03-09T04:00:00Z"
  },
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=90",
    prompt: "Handsome male model in contemporary street fashion, urban cityscape background, natural daylight, confident stance, fashion editorial photography, high-end magazine style, detailed textures",
    model: "RealVisXL V4",
    likes: 1834,
    createdAt: "2026-03-09T03:30:00Z"
  },
  {
    id: "7",
    imageUrl: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=90",
    prompt: "Dramatic ocean waves crashing violently against ancient rocky cliffs, stormy tempestuous sky with dark clouds, moody atmospheric seascape, long exposure photography, powerful nature, fine art landscape",
    model: "FLUX.1-dev",
    likes: 2945,
    createdAt: "2026-03-09T03:00:00Z"
  },
  {
    id: "8",
    imageUrl: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=800&q=90",
    prompt: "Adorable robot companion with expressive glowing LED eyes, sleek white and chrome futuristic design, soft studio lighting, product visualization render, friendly personality, Disney Pixar style, 3D render",
    model: "FLUX.1-dev",
    likes: 3678,
    createdAt: "2026-03-09T02:30:00Z"
  },
  {
    id: "9",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=90",
    prompt: "Abstract fluid art composition with flowing organic colors, deep purple and molten gold palette, fluid dynamics simulation, modern contemporary art, digital painting, museum quality, large canvas",
    model: "FLUX.1-dev",
    likes: 1567,
    createdAt: "2026-03-09T02:00:00Z"
  },
  {
    id: "10",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=90",
    prompt: "Breathtaking milky way galaxy arcing over snow-covered mountain peak, astrophotography, millions of stars visible, night sky, long exposure, wilderness landscape, cosmic wonder, 8k resolution",
    model: "FLUX.1-dev",
    likes: 4234,
    createdAt: "2026-03-09T01:30:00Z"
  },
  {
    id: "11",
    imageUrl: "https://images.unsplash.com/photo-1516820215024-2fa9c7eb9ed5?w=800&q=90",
    prompt: "Classic vintage Ferrari 250 GTO in racing red, showroom studio lighting, automotive photography, chrome details gleaming, luxury sports car, collector's edition, high detail, reflective surfaces",
    model: "RealVisXL V4",
    likes: 2156,
    createdAt: "2026-03-09T01:00:00Z"
  },
  {
    id: "12",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=90",
    prompt: "Luxury minimalist product photography, elegant gold watch on white marble surface, soft diffused shadows, high-end advertising, clean composition, premium brand aesthetic, commercial photography",
    model: "FLUX Schnell",
    likes: 1789,
    createdAt: "2026-03-09T00:30:00Z"
  },
  {
    id: "13",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=90",
    prompt: "Premium wireless headphones floating with dynamic RGB lighting effects, product photography, sleek modern design, dark gradient background, tech gadget, commercial advertisement, studio shot",
    model: "FLUX.1-dev",
    likes: 2345,
    createdAt: "2026-03-08T23:45:00Z"
  },
  {
    id: "14",
    imageUrl: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=800&q=90",
    prompt: "Adorable golden retriever puppy playing joyfully in colorful autumn leaves, natural warm sunlight, shallow depth of field, pet photography, heartwarming moment, happy expression, professional quality",
    model: "RealVisXL V4",
    likes: 5678,
    createdAt: "2026-03-08T23:00:00Z"
  },
  {
    id: "15",
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=90",
    prompt: "Serene traditional Japanese zen garden in spring, delicate cherry blossoms in full bloom, raked sand patterns, ancient wooden architecture, peaceful morning light, fine art photography, tranquil atmosphere",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-08T22:30:00Z"
  },
  {
    id: "16",
    imageUrl: "https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&q=90",
    prompt: "Gourmet artisan burger with perfectly melted aged cheddar, crispy bacon, fresh brioche bun, studio food photography, appetizing styling, restaurant quality, culinary art, mouth-watering detail",
    model: "RealVisXL V4",
    likes: 1923,
    createdAt: "2026-03-08T22:00:00Z"
  },
  {
    id: "17",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=90",
    prompt: "Artisan coffee latte with intricate rosetta art pattern, rustic reclaimed wood table, cozy café atmosphere, warm ambient lighting, lifestyle photography, hipster aesthetic, inviting mood",
    model: "FLUX Schnell",
    likes: 1456,
    createdAt: "2026-03-08T21:30:00Z"
  },
  {
    id: "18",
    imageUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=800&q=90",
    prompt: "Colorful healthy breakfast spread flat lay, fresh tropical fruits, fluffy pancakes with mixed berries, morning sunlight, food styling, top-down composition, Instagram aesthetic, vibrant colors",
    model: "RealVisXL V4",
    likes: 2789,
    createdAt: "2026-03-08T21:00:00Z"
  },
  {
    id: "19",
    imageUrl: "https://images.unsplash.com/photo-1485217988980-11786ced9454?w=800&q=90",
    prompt: "Modern minimalist home office workspace, sleek white desk, large ultrawide monitor, indoor plants, natural window light, Scandinavian interior design, productivity aesthetic, architectural photography",
    model: "FLUX.1-dev",
    likes: 2134,
    createdAt: "2026-03-08T20:30:00Z"
  },
  {
    id: "20",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=90",
    prompt: "Diverse creative team collaborating in contemporary open office, natural lighting, animated discussion, modern workspace, corporate lifestyle photography, inclusive environment, professional",
    model: "RealVisXL V4",
    likes: 1567,
    createdAt: "2026-03-08T20:00:00Z"
  },
  // Page 2 (21-40)
  {
    id: "21",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=90",
    prompt: "Software developer coding at night, multiple monitors with colorful code syntax, moody ambient lighting, tech workspace, programming aesthetic, focus and concentration, realistic detail",
    model: "FLUX Schnell",
    likes: 1890,
    createdAt: "2026-03-08T19:30:00Z"
  },
  {
    id: "22",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=90",
    prompt: "Advanced AI neural network visualization, glowing interconnected nodes, deep learning concept art, futuristic technology, dark background with blue energy streams, data science aesthetic",
    model: "FLUX.1-dev",
    likes: 3567,
    createdAt: "2026-03-08T19:00:00Z"
  },
  {
    id: "23",
    imageUrl: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&q=90",
    prompt: "Elegant haute couture fashion model on runway, dramatic studio lighting, flowing designer gown, high fashion editorial, Vogue magazine style, sophisticated pose, luxury fashion photography",
    model: "RealVisXL V4",
    likes: 4123,
    createdAt: "2026-03-08T18:30:00Z"
  },
  {
    id: "24",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=90",
    prompt: "Confident woman in trendy street style fashion, urban graffiti wall background, natural daylight, candid pose, fashion blogger aesthetic, contemporary clothing, lifestyle photography",
    model: "FLUX.1-dev",
    likes: 2345,
    createdAt: "2026-03-08T18:00:00Z"
  },
  {
    id: "25",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=90",
    prompt: "Athletic fitness model mid-workout, dynamic action shot, gym environment, powerful movement, sports photography, motivational energy, defined muscles, professional lighting",
    model: "RealVisXL V4",
    likes: 2678,
    createdAt: "2026-03-08T17:30:00Z"
  },
  {
    id: "26",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=90",
    prompt: "Pristine tropical beach paradise, crystal clear turquoise water, swaying palm trees, golden sunset colors, travel photography, vacation destination, paradise island, serene escape",
    model: "FLUX.1-dev",
    likes: 4890,
    createdAt: "2026-03-08T17:00:00Z"
  },
  {
    id: "27",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=90",
    prompt: "Mysterious misty forest path with ethereal sunbeams, enchanted woodland atmosphere, nature photography, magical lighting, wanderlust adventure, pacific northwest, fine art landscape",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-08T16:30:00Z"
  },
  {
    id: "28",
    imageUrl: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=90",
    prompt: "Spectacular northern lights aurora borealis dancing over icy Icelandic landscape, vibrant green and purple colors, night photography, natural wonder, breathtaking phenomenon, 8k resolution",
    model: "FLUX.1-dev",
    likes: 5234,
    createdAt: "2026-03-08T16:00:00Z"
  },
  {
    id: "29",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90",
    prompt: "Professional executive headshot portrait, confident male businessman, clean neutral gray background, corporate photography, sharp focus, leadership presence, LinkedIn profile quality",
    model: "FLUX Schnell",
    likes: 1234,
    createdAt: "2026-03-08T15:30:00Z"
  },
  {
    id: "30",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=90",
    prompt: "Stunning female portrait with flawless skin, professional beauty lighting, fashion makeup, editorial style, high-end magazine cover look, detailed eyes and lips, studio photography",
    model: "RealVisXL V4",
    likes: 4567,
    createdAt: "2026-03-08T15:00:00Z"
  },
  {
    id: "31",
    imageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&q=90",
    prompt: "Rugged male model with defined jawline, casual outdoor setting, natural lighting, GQ magazine style, masculine aesthetic, authentic expression, fashion photography",
    model: "RealVisXL V4",
    likes: 2890,
    createdAt: "2026-03-08T14:30:00Z"
  },
  {
    id: "32",
    imageUrl: "https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=800&q=90",
    prompt: "Glamorous red carpet celebrity portrait, elegant evening gown, professional event photography, sparkling jewelry, confident pose, Hollywood premiere atmosphere, paparazzi lighting",
    model: "RealVisXL V4",
    likes: 3678,
    createdAt: "2026-03-08T14:00:00Z"
  },
  {
    id: "33",
    imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=90",
    prompt: "Radiant young woman with natural curly hair, golden hour outdoor portrait, authentic smile, bohemian style, lifestyle photography, warm color tones, carefree spirit",
    model: "RealVisXL V4",
    likes: 4012,
    createdAt: "2026-03-08T13:30:00Z"
  },
  {
    id: "34",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=90",
    prompt: "Approachable professional man in business casual attire, friendly genuine smile, office environment bokeh background, corporate headshot, trustworthy appearance, natural expression",
    model: "FLUX Schnell",
    likes: 1678,
    createdAt: "2026-03-08T13:00:00Z"
  },
  {
    id: "35",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=90",
    prompt: "Fashion model with striking features, avant-garde editorial styling, dramatic side lighting, high contrast photography, artistic portrait, magazine editorial, bold makeup",
    model: "RealVisXL V4",
    likes: 3890,
    createdAt: "2026-03-08T12:30:00Z"
  },
  {
    id: "36",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=90",
    prompt: "Sophisticated woman in minimalist modern interior, clean white background, luxury fashion brand campaign, elegant simplicity, professional model, high-end commercial photography",
    model: "RealVisXL V4",
    likes: 3456,
    createdAt: "2026-03-08T12:00:00Z"
  },
  {
    id: "37",
    imageUrl: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=90",
    prompt: "Young man with creative artistic hairstyle, urban rooftop setting, golden hour lighting, youth culture aesthetic, generation Z style, authentic personality, candid portrait",
    model: "FLUX.1-dev",
    likes: 2234,
    createdAt: "2026-03-08T11:30:00Z"
  },
  {
    id: "38",
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=90",
    prompt: "Ethereal beauty portrait with soft focus, dreamy romantic atmosphere, delicate features, natural makeup, fine art photography, feminine elegance, painterly quality",
    model: "RealVisXL V4",
    likes: 4789,
    createdAt: "2026-03-08T11:00:00Z"
  },
  {
    id: "39",
    imageUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=90",
    prompt: "Distinguished older gentleman with silver hair and beard, timeless classic style, wisdom in eyes, natural window light portrait, mature elegance, sophisticated gentleman",
    model: "RealVisXL V4",
    likes: 2567,
    createdAt: "2026-03-08T10:30:00Z"
  },
  {
    id: "40",
    imageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=90",
    prompt: "Creative professional in modern co-working space, laptop and coffee, focused concentration, startup culture aesthetic, entrepreneur lifestyle, contemporary workspace",
    model: "FLUX Schnell",
    likes: 1890,
    createdAt: "2026-03-08T10:00:00Z"
  },
  // Page 3 (41-60)
  {
    id: "41",
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=90",
    prompt: "Charismatic young professional with confident smile, business casual outfit, modern office background, approachable personality, corporate culture, authentic leadership",
    model: "RealVisXL V4",
    likes: 2345,
    createdAt: "2026-03-08T09:30:00Z"
  },
  {
    id: "42",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=90",
    prompt: "Intense male portrait with dramatic chiaroscuro lighting, artistic black and white photography, powerful gaze, fine art portrait, museum quality, emotional depth",
    model: "FLUX.1-dev",
    likes: 3123,
    createdAt: "2026-03-08T09:00:00Z"
  },
  {
    id: "43",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=90",
    prompt: "Joyful woman laughing naturally, spontaneous candid moment, outdoor summer setting, infectious happiness, lifestyle photography, genuine emotion, feel-good portrait",
    model: "RealVisXL V4",
    likes: 4567,
    createdAt: "2026-03-08T08:30:00Z"
  },
  {
    id: "44",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=90",
    prompt: "Tech startup founder portrait, Silicon Valley aesthetic, casual hoodie and jeans, confident visionary stance, innovation culture, entrepreneurial spirit, modern CEO",
    model: "FLUX Schnell",
    likes: 2678,
    createdAt: "2026-03-08T08:00:00Z"
  },
  {
    id: "45",
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=90",
    prompt: "Beautiful African woman with intricate natural hairstyle, vibrant cultural elements, warm earth tones, celebration of heritage, portrait photography, powerful beauty",
    model: "RealVisXL V4",
    likes: 5234,
    createdAt: "2026-03-08T07:30:00Z"
  },
  {
    id: "46",
    imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&q=90",
    prompt: "Asian male model with modern hairstyle, urban street photography, contemporary fashion, cool confident attitude, K-fashion influence, editorial style portrait",
    model: "RealVisXL V4",
    likes: 3456,
    createdAt: "2026-03-08T07:00:00Z"
  },
  {
    id: "47",
    imageUrl: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&q=90",
    prompt: "Fitness trainer demonstrating perfect form, motivational athletic pose, gym lighting, health and wellness brand imagery, strong physique, inspirational energy",
    model: "RealVisXL V4",
    likes: 2890,
    createdAt: "2026-03-08T06:30:00Z"
  },
  {
    id: "48",
    imageUrl: "https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&q=90",
    prompt: "Bohemian woman at outdoor music festival, flower crown and flowing dress, golden sunset backlight, carefree summer vibes, lifestyle portrait, youth culture",
    model: "FLUX.1-dev",
    likes: 3678,
    createdAt: "2026-03-08T06:00:00Z"
  },
  {
    id: "49",
    imageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&q=90",
    prompt: "Natural beauty portrait with minimal makeup, freckles visible, authentic unretouched skin, real beauty movement, inclusive representation, genuine authenticity",
    model: "RealVisXL V4",
    likes: 4123,
    createdAt: "2026-03-08T05:30:00Z"
  },
  {
    id: "50",
    imageUrl: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=800&q=90",
    prompt: "Elegant ballerina in graceful pose, professional dance photography, perfect form and lines, artistic performance capture, classical beauty, movement frozen in time",
    model: "FLUX.1-dev",
    likes: 4890,
    createdAt: "2026-03-08T05:00:00Z"
  },
  {
    id: "51",
    imageUrl: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=800&q=90",
    prompt: "Steaming hot chocolate with marshmallows, cozy winter atmosphere, rustic wooden table, comfort food photography, warm inviting mood, hygge aesthetic",
    model: "RealVisXL V4",
    likes: 2567,
    createdAt: "2026-03-08T04:30:00Z"
  },
  {
    id: "52",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=90",
    prompt: "Vibrant healthy salad bowl, fresh colorful vegetables, quinoa and avocado, clean eating aesthetic, food styling perfection, nutrition focused, Instagram-worthy presentation",
    model: "FLUX Schnell",
    likes: 1890,
    createdAt: "2026-03-08T04:00:00Z"
  },
  {
    id: "53",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=90",
    prompt: "Authentic Neapolitan pizza fresh from wood-fired oven, bubbling mozzarella, perfect char marks, Italian cuisine photography, rustic restaurant atmosphere, appetizing detail",
    model: "RealVisXL V4",
    likes: 3234,
    createdAt: "2026-03-08T03:30:00Z"
  },
  {
    id: "54",
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=90",
    prompt: "Stacked fluffy pancakes drizzled with maple syrup, fresh berries topping, breakfast perfection, food photography, morning comfort food, delicious indulgence",
    model: "RealVisXL V4",
    likes: 2678,
    createdAt: "2026-03-08T03:00:00Z"
  },
  {
    id: "55",
    imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=90",
    prompt: "Elegant wedding cake with delicate sugar flowers, multi-tiered masterpiece, soft romantic lighting, luxury event photography, celebration of love, pastry artistry",
    model: "FLUX.1-dev",
    likes: 3890,
    createdAt: "2026-03-08T02:30:00Z"
  },
  {
    id: "56",
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=90",
    prompt: "Perfectly crafted espresso with golden crema, professional barista art, specialty coffee culture, cafe atmosphere, aromatic coffee photography, Italian tradition",
    model: "FLUX Schnell",
    likes: 2123,
    createdAt: "2026-03-08T02:00:00Z"
  },
  {
    id: "57",
    imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=90",
    prompt: "Artisan chocolate truffles with cocoa powder dusting, luxury confectionery display, gourmet dessert photography, indulgent treats, premium chocolate brand",
    model: "RealVisXL V4",
    likes: 1789,
    createdAt: "2026-03-08T01:30:00Z"
  },
  {
    id: "58",
    imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=90",
    prompt: "Fresh sushi platter with premium quality fish, Japanese culinary art, traditional presentation, raw fish photography, Michelin star quality, umami perfection",
    model: "RealVisXL V4",
    likes: 3456,
    createdAt: "2026-03-08T01:00:00Z"
  },
  {
    id: "59",
    imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=90",
    prompt: "Grilled ribeye steak with perfect char marks, medium rare doneness, herb butter melting, steakhouse quality, carnivore's dream, food photography perfection",
    model: "RealVisXL V4",
    likes: 2890,
    createdAt: "2026-03-08T00:30:00Z"
  },
  {
    id: "60",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=90",
    prompt: "Refreshing summer cocktail with fresh fruit garnish, poolside setting, tropical vibes, beverage photography, vacation mood, colorful drink styling",
    model: "FLUX Schnell",
    likes: 2234,
    createdAt: "2026-03-08T00:00:00Z"
  },
  // Page 4 (61-80)
  {
    id: "61",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90",
    prompt: "Hyperrealistic dragon breathing fire, scales with iridescent reflections, fantasy creature design, epic mythology, cinematic lighting, detailed texture work, 8k render",
    model: "FLUX.1-dev",
    likes: 5678,
    createdAt: "2026-03-07T23:30:00Z"
  },
  {
    id: "62",
    imageUrl: "https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&q=90",
    prompt: "Anime-style character portrait, vibrant hair colors, expressive large eyes, Japanese animation aesthetic, digital art, manga influence, character design",
    model: "FLUX.1-dev",
    likes: 4234,
    createdAt: "2026-03-07T23:00:00Z"
  },
  {
    id: "63",
    imageUrl: "https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&q=90",
    prompt: "Majestic lion portrait with flowing golden mane, wildlife photography, king of the jungle, powerful presence, African savanna, National Geographic quality",
    model: "RealVisXL V4",
    likes: 3890,
    createdAt: "2026-03-07T22:30:00Z"
  },
  {
    id: "64",
    imageUrl: "https://images.unsplash.com/photo-1497206365907-f5e630693df0?w=800&q=90",
    prompt: "Powerful eagle in flight, wings fully extended, sharp talons visible, wildlife action photography, bird of prey, freedom and power, crisp detail",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-07T22:00:00Z"
  },
  {
    id: "65",
    imageUrl: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&q=90",
    prompt: "Sea turtle gliding through crystal clear tropical water, underwater photography, marine life, coral reef ecosystem, ocean conservation, peaceful serenity",
    model: "FLUX.1-dev",
    likes: 4123,
    createdAt: "2026-03-07T21:30:00Z"
  },
  {
    id: "66",
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&q=90",
    prompt: "Adorable baby elephant playing in water, African wildlife photography, family bond, playful innocence, safari adventure, heartwarming animal moment",
    model: "RealVisXL V4",
    likes: 5234,
    createdAt: "2026-03-07T21:00:00Z"
  },
  {
    id: "67",
    imageUrl: "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&q=90",
    prompt: "Fluffy orange tabby cat with bright green eyes, pet portrait photography, adorable feline, cozy home setting, whiskers detail, beloved companion",
    model: "RealVisXL V4",
    likes: 4890,
    createdAt: "2026-03-07T20:30:00Z"
  },
  {
    id: "68",
    imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&q=90",
    prompt: "Stunning peacock displaying iridescent feathers, vibrant blue and green colors, exotic bird photography, natural beauty, symmetrical pattern, zoo portrait",
    model: "FLUX.1-dev",
    likes: 3678,
    createdAt: "2026-03-07T20:00:00Z"
  },
  {
    id: "69",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=90",
    prompt: "Happy golden retriever with tongue out, joyful dog portrait, pet photography, man's best friend, loyal companion, heartwarming expression, family pet",
    model: "RealVisXL V4",
    likes: 5567,
    createdAt: "2026-03-07T19:30:00Z"
  },
  {
    id: "70",
    imageUrl: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=90",
    prompt: "Curious bunny rabbit with soft fur, adorable pet portrait, big expressive eyes, Easter aesthetic, fluffy cuteness, gentle creature, pet photography",
    model: "RealVisXL V4",
    likes: 4012,
    createdAt: "2026-03-07T19:00:00Z"
  },
  {
    id: "71",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=90",
    prompt: "Ancient stone temple ruins overgrown with jungle vines, lost civilization, archaeological discovery, Indiana Jones aesthetic, mysterious atmosphere, adventure setting",
    model: "FLUX.1-dev",
    likes: 3234,
    createdAt: "2026-03-07T18:30:00Z"
  },
  {
    id: "72",
    imageUrl: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=90",
    prompt: "Colorful hot air balloons floating over Cappadocia landscape at sunrise, travel photography, bucket list destination, magical moment, Turkish adventure",
    model: "FLUX.1-dev",
    likes: 4567,
    createdAt: "2026-03-07T18:00:00Z"
  },
  {
    id: "73",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=90",
    prompt: "Eiffel Tower at blue hour with city lights, Paris cityscape, romantic destination, iconic landmark photography, French elegance, travel dreams",
    model: "FLUX.1-dev",
    likes: 3890,
    createdAt: "2026-03-07T17:30:00Z"
  },
  {
    id: "74",
    imageUrl: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=90",
    prompt: "London Tower Bridge illuminated at night, Thames River reflections, British landmark, architectural photography, UK travel destination, historic structure",
    model: "FLUX.1-dev",
    likes: 2678,
    createdAt: "2026-03-07T17:00:00Z"
  },
  {
    id: "75",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=90",
    prompt: "Majestic Mount Fuji with cherry blossoms in foreground, Japanese landscape, iconic scenery, spring season, travel photography, cultural heritage",
    model: "FLUX.1-dev",
    likes: 4234,
    createdAt: "2026-03-07T16:30:00Z"
  },
  {
    id: "76",
    imageUrl: "https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&q=90",
    prompt: "Venetian canal with gondolas at sunset, Italian romance, water reflections, European travel destination, historic architecture, timeless beauty",
    model: "FLUX.1-dev",
    likes: 3567,
    createdAt: "2026-03-07T16:00:00Z"
  },
  {
    id: "77",
    imageUrl: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=90",
    prompt: "Santorini blue domed churches overlooking Aegean Sea, Greek island paradise, whitewashed architecture, Mediterranean travel, postcard perfect scenery",
    model: "FLUX.1-dev",
    likes: 4890,
    createdAt: "2026-03-07T15:30:00Z"
  },
  {
    id: "78",
    imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=90",
    prompt: "New York City skyline at night, Empire State Building illuminated, urban landscape, American dream, metropolitan energy, iconic cityscape",
    model: "FLUX.1-dev",
    likes: 3123,
    createdAt: "2026-03-07T15:00:00Z"
  },
  {
    id: "79",
    imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=90",
    prompt: "Sydney Opera House and Harbour Bridge, Australian landmark, architectural marvel, harbor view, travel destination, cultural icon, sunset colors",
    model: "FLUX.1-dev",
    likes: 2890,
    createdAt: "2026-03-07T14:30:00Z"
  },
  {
    id: "80",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=90",
    prompt: "Dubai skyline with Burj Khalifa, modern architectural wonder, futuristic cityscape, Middle Eastern luxury, urban development, impressive engineering",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-07T14:00:00Z"
  },
  // Page 5 (81-100)
  {
    id: "81",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=90",
    prompt: "Luxury resort infinity pool overlooking ocean, five-star hospitality, vacation paradise, tropical destination, relaxation goals, premium travel experience",
    model: "FLUX.1-dev",
    likes: 4123,
    createdAt: "2026-03-07T13:30:00Z"
  },
  {
    id: "82",
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=90",
    prompt: "Cozy cabin interior with fireplace, rustic mountain retreat, warm ambient lighting, hygge lifestyle, winter getaway, comfort and relaxation",
    model: "RealVisXL V4",
    likes: 3234,
    createdAt: "2026-03-07T13:00:00Z"
  },
  {
    id: "83",
    imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=90",
    prompt: "Minimalist Scandinavian living room interior, clean white walls, natural wood furniture, indoor plants, modern home design, IKEA aesthetic",
    model: "FLUX.1-dev",
    likes: 2678,
    createdAt: "2026-03-07T12:30:00Z"
  },
  {
    id: "84",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90",
    prompt: "Luxurious master bathroom with freestanding tub, marble finishes, spa-like atmosphere, interior design goals, home renovation inspiration",
    model: "FLUX.1-dev",
    likes: 2890,
    createdAt: "2026-03-07T12:00:00Z"
  },
  {
    id: "85",
    imageUrl: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=90",
    prompt: "Modern kitchen with marble island, professional-grade appliances, chef's dream, interior photography, contemporary design, culinary workspace",
    model: "RealVisXL V4",
    likes: 3567,
    createdAt: "2026-03-07T11:30:00Z"
  },
  {
    id: "86",
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=90",
    prompt: "Romantic bedroom with soft neutral palette, luxury bedding, warm ambient lighting, interior design, peaceful sanctuary, sleep goals",
    model: "FLUX.1-dev",
    likes: 2345,
    createdAt: "2026-03-07T11:00:00Z"
  },
  {
    id: "87",
    imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=90",
    prompt: "Modern exterior house with large windows, contemporary architecture, green lawn, dream home, real estate photography, curb appeal",
    model: "FLUX.1-dev",
    likes: 2567,
    createdAt: "2026-03-07T10:30:00Z"
  },
  {
    id: "88",
    imageUrl: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=90",
    prompt: "Rooftop garden terrace with city views, urban oasis, outdoor living space, apartment goals, green living in the city, relaxation spot",
    model: "FLUX.1-dev",
    likes: 3123,
    createdAt: "2026-03-07T10:00:00Z"
  },
  {
    id: "89",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=90",
    prompt: "Elegant dining room with chandelier and statement art, entertaining space, luxury interior, formal dining, sophisticated home design",
    model: "RealVisXL V4",
    likes: 2890,
    createdAt: "2026-03-07T09:30:00Z"
  },
  {
    id: "90",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=90",
    prompt: "Industrial loft apartment with exposed brick, high ceilings, modern urban living, New York style, creative space, architectural character",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-07T09:00:00Z"
  },
  {
    id: "91",
    imageUrl: "https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&q=90",
    prompt: "Ultra-modern sports car, aerodynamic design, matte black finish, automotive photography, supercar dreams, speed and luxury combined",
    model: "RealVisXL V4",
    likes: 4567,
    createdAt: "2026-03-07T08:30:00Z"
  },
  {
    id: "92",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=90",
    prompt: "Vintage Porsche 911 on coastal highway, classic car photography, driving dreams, automotive elegance, timeless design, road trip vibes",
    model: "FLUX.1-dev",
    likes: 3890,
    createdAt: "2026-03-07T08:00:00Z"
  },
  {
    id: "93",
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=90",
    prompt: "Lamborghini Huracán in dramatic lighting, Italian supercar, aggressive styling, automotive art, dream garage, performance excellence",
    model: "RealVisXL V4",
    likes: 4234,
    createdAt: "2026-03-07T07:30:00Z"
  },
  {
    id: "94",
    imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=90",
    prompt: "Tesla Model S Plaid in motion blur, electric future, sustainable luxury, automotive innovation, clean energy, modern transportation",
    model: "FLUX.1-dev",
    likes: 2678,
    createdAt: "2026-03-07T07:00:00Z"
  },
  {
    id: "95",
    imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=90",
    prompt: "Classic muscle car burnout, American automotive power, smoke and rubber, drag racing vibes, horsepower display, pure adrenaline",
    model: "RealVisXL V4",
    likes: 3567,
    createdAt: "2026-03-07T06:30:00Z"
  },
  {
    id: "96",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=90",
    prompt: "Rolls Royce Phantom in front of mansion, ultimate luxury, chauffeur lifestyle, wealth and success, prestigious automotive, British excellence",
    model: "RealVisXL V4",
    likes: 3123,
    createdAt: "2026-03-07T06:00:00Z"
  },
  {
    id: "97",
    imageUrl: "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=90",
    prompt: "Custom motorcycle chopper with chrome details, biker culture, freedom on two wheels, American iron, custom build, road warrior",
    model: "FLUX.1-dev",
    likes: 2890,
    createdAt: "2026-03-07T05:30:00Z"
  },
  {
    id: "98",
    imageUrl: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800&q=90",
    prompt: "Futuristic concept car design, automotive innovation, sleek aerodynamic form, transportation of tomorrow, prototype vehicle, design study",
    model: "FLUX.1-dev",
    likes: 3456,
    createdAt: "2026-03-07T05:00:00Z"
  },
  {
    id: "99",
    imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=90",
    prompt: "Racing car on track at sunset, motorsport photography, speed and competition, professional racing, automotive action, adrenaline sport",
    model: "RealVisXL V4",
    likes: 2567,
    createdAt: "2026-03-07T04:30:00Z"
  },
  {
    id: "100",
    imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=90",
    prompt: "Off-road 4x4 truck in muddy terrain, adventure vehicle, rugged capability, outdoor exploration, extreme driving, wilderness adventure",
    model: "FLUX.1-dev",
    likes: 2234,
    createdAt: "2026-03-07T04:00:00Z"
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
  await new Promise(resolve => setTimeout(resolve, 200));
  
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