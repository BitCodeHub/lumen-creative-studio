import { NextRequest, NextResponse } from "next/server";

const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

const HEADSHOT_STYLES: Record<string, { prompt: string; label: string; icon: string }> = {
  linkedin: {
    label: "LinkedIn Professional",
    icon: "💼",
    prompt: "professional headshot, business attire, navy blue suit, confident smile, modern office background blurred, sharp focus, photorealistic, 8k",
  },
  creative: {
    label: "Creative / Artistic",
    icon: "🎨",
    prompt: "creative portrait, artistic studio lighting, colorful bokeh background, professional photography, expressive, photorealistic, 8k",
  },
  casual: {
    label: "Casual / Friendly",
    icon: "😊",
    prompt: "casual portrait, warm friendly smile, natural daylight, outdoor park background softly blurred, approachable, photorealistic, 8k",
  },
  executive: {
    label: "Corporate Executive",
    icon: "🏢",
    prompt: "executive corporate portrait, power suit, authoritative confident pose, dark studio background, dramatic side lighting, photorealistic, 8k",
  },
  studio: {
    label: "Studio Portrait",
    icon: "📸",
    prompt: "clean studio portrait, white seamless background, professional three-point lighting, sharp detail, headshot, photorealistic, 8k",
  },
  glamour: {
    label: "Glamour",
    icon: "✨",
    prompt: "glamour portrait, dramatic makeup, beautiful golden hour lighting, fashion editorial style, photorealistic, 8k",
  },
};

function buildHeadshotWorkflow(
  uploadedFilename: string,
  style: string,
  seed: number
) {
  const s = HEADSHOT_STYLES[style] || HEADSHOT_STYLES.linkedin;
  const fullPrompt = `RAW photo, same person, same face, ${s.prompt}, photorealistic, detailed skin texture, subsurface scattering, professional photography, DSLR, maintaining facial identity`;
  const negPrompt = "painting, cartoon, anime, deformed, extra limbs, bad anatomy, text, watermark, ugly, disfigured, low quality, blur, distorted face, different person, wrong face, face swap, gender swap, female, woman";

  return {
    // Checkpoint + LoRA
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "RealVisXL_V4.safetensors" } },
    "2": {
      class_type: "LoraLoader",
      inputs: {
        model: ["1", 0], clip: ["1", 1],
        lora_name: "lumen_headshots_v1.safetensors",
        strength_model: 0.7, strength_clip: 0.7,
      },
    },
    // Load CLIP Vision
    "3": {
      class_type: "CLIPVisionLoader",
      inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" },
    },
    // Load IPAdapter face model
    "4": {
      class_type: "IPAdapterModelLoader",
      inputs: { ipadapter_file: "ip-adapter-plus-face_sdxl_vit-h.safetensors" },
    },
    // Load uploaded reference image
    "5": {
      class_type: "LoadImage",
      inputs: { image: uploadedFilename },
    },
    // Apply IPAdapter
    "6": {
      class_type: "IPAdapterAdvanced",
      inputs: {
        model: ["2", 0],
        ipadapter: ["4", 0],
        image: ["5", 0],
        clip_vision: ["3", 0],
        weight: 0.95,
        weight_type: "style transfer",
        combine_embeds: "concat",
        start_at: 0.0,
        end_at: 1.0,
        embeds_scaling: "V only",
      },
    },
    // Text conditioning
    "7": { class_type: "CLIPTextEncode", inputs: { text: fullPrompt, clip: ["2", 1] } },
    "8": { class_type: "CLIPTextEncode", inputs: { text: negPrompt, clip: ["2", 1] } },
    // Portrait latent
    "9": { class_type: "EmptyLatentImage", inputs: { width: 832, height: 1216, batch_size: 1 } },
    // Sample
    "10": {
      class_type: "KSampler",
      inputs: {
        model: ["6", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["9", 0],
        seed, steps: 35, cfg: 4.5,
        sampler_name: "dpmpp_2m_sde",
        scheduler: "karras",
        denoise: 1.0,
      },
    },
    "11": { class_type: "VAEDecode", inputs: { samples: ["10", 0], vae: ["1", 2] } },
    "12": { class_type: "SaveImage", inputs: { images: ["11", 0], filename_prefix: "headshot" } },
  } as Record<string, any>;
}

async function uploadImageToComfyUI(imageBytes: ArrayBuffer, filename: string): Promise<{ success: boolean; name?: string; error?: string }> {
  try {
    // Create FormData with explicit boundary handling
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const uint8Array = new Uint8Array(imageBytes);
    
    // Build multipart body manually for better compatibility
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    
    // Convert to binary
    const encoder = new TextEncoder();
    const header = encoder.encode(body);
    const footer = encoder.encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--${boundary}--\r\n`);
    
    // Combine header + image bytes + footer
    const fullBody = new Uint8Array(header.length + uint8Array.length + footer.length);
    fullBody.set(header, 0);
    fullBody.set(uint8Array, header.length);
    fullBody.set(footer, header.length + uint8Array.length);

    const r = await fetch(`${COMFYUI_URL}/upload/image`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: fullBody,
    });

    const responseText = await r.text();
    
    if (r.ok) {
      try {
        const d = JSON.parse(responseText);
        return { success: true, name: d.name || filename };
      } catch {
        return { success: true, name: filename };
      }
    }
    return { success: false, error: `Upload failed: ${r.status} - ${responseText}` };
  } catch (e: any) {
    return { success: false, error: `Upload error: ${e.message}` };
  }
}

async function queuePrompt(workflow: Record<string, any>): Promise<{ success: boolean; promptId?: string; error?: string }> {
  try {
    const r = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    
    const responseText = await r.text();
    
    if (r.ok) {
      try {
        const d = JSON.parse(responseText);
        return { success: true, promptId: d.prompt_id };
      } catch {
        return { success: false, error: `Invalid JSON response: ${responseText.substring(0, 200)}` };
      }
    }
    return { success: false, error: `Queue failed: ${r.status} - ${responseText.substring(0, 500)}` };
  } catch (e: any) {
    return { success: false, error: `Queue error: ${e.message}` };
  }
}

// GET — return available styles
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(HEADSHOT_STYLES).map(([id, s]) => ({
      id,
      label: s.label,
      icon: s.icon,
    })),
    comfyUrl: COMFYUI_URL, // Debug: show which URL is being used
  });
}

// POST — generate headshots
export async function POST(req: NextRequest) {
  const debugInfo: string[] = [];
  
  try {
    debugInfo.push(`COMFY_URL: ${COMFYUI_URL}`);
    
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const stylesRaw = formData.get("styles") as string | null;
    const styles: string[] = stylesRaw ? JSON.parse(stylesRaw) : ["linkedin", "creative", "casual"];

    if (!file) {
      return NextResponse.json({ error: "No photo uploaded", debug: debugInfo }, { status: 400 });
    }

    debugInfo.push(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);
    debugInfo.push(`Styles requested: ${styles.join(", ")}`);

    const bytes = await file.arrayBuffer();
    const timestamp = Date.now();
    const uploadFilename = `headshot_ref_${timestamp}.jpg`;

    // Upload reference image to ComfyUI
    const uploadResult = await uploadImageToComfyUI(bytes, uploadFilename);
    debugInfo.push(`Upload result: ${JSON.stringify(uploadResult)}`);
    
    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: "Failed to upload image to DGX", 
        detail: uploadResult.error,
        debug: debugInfo 
      }, { status: 500 });
    }

    const comfyFilename = uploadResult.name!;
    debugInfo.push(`ComfyUI filename: ${comfyFilename}`);

    // Queue one job per style
    const jobs: { style: string; promptId: string; label: string; icon: string }[] = [];
    const queueErrors: string[] = [];

    for (const style of styles.slice(0, 6)) {
      const seed = Math.floor(Math.random() * 999999999);
      const workflow = buildHeadshotWorkflow(comfyFilename, style, seed);
      const queueResult = await queuePrompt(workflow);
      
      if (queueResult.success && queueResult.promptId) {
        jobs.push({
          style,
          promptId: queueResult.promptId,
          label: HEADSHOT_STYLES[style]?.label || style,
          icon: HEADSHOT_STYLES[style]?.icon || "📸",
        });
        debugInfo.push(`Queued ${style}: ${queueResult.promptId}`);
      } else {
        queueErrors.push(`${style}: ${queueResult.error}`);
        debugInfo.push(`Failed to queue ${style}: ${queueResult.error}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!jobs.length) {
      return NextResponse.json({ 
        error: "Failed to queue jobs", 
        queueErrors,
        debug: debugInfo 
      }, { status: 500 });
    }

    return NextResponse.json({
      jobs,
      message: `Generating ${jobs.length} headshots...`,
      refImage: comfyFilename,
      debug: debugInfo,
    });
  } catch (e: any) {
    debugInfo.push(`Exception: ${e.message}`);
    return NextResponse.json({ error: e.message || "Internal error", debug: debugInfo }, { status: 500 });
  }
}
