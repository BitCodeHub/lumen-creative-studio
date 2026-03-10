import { NextRequest, NextResponse } from "next/server";

const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

const HEADSHOT_STYLES: Record<string, { prompt: string; label: string; icon: string }> = {
  linkedin: {
    label: "LinkedIn Professional",
    icon: "💼",
    prompt: "professional headshot, business attire, navy blue suit, confident smile, modern office background softly blurred, sharp focus, photorealistic, 8k",
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
    prompt: "clean studio portrait, white seamless background, professional three-point lighting, sharp detail, photorealistic, 8k",
  },
  glamour: {
    label: "Glamour",
    icon: "✨",
    prompt: "glamour portrait, dramatic lighting, fashion editorial style, photorealistic, 8k",
  },
};

function buildInstantIDWorkflow(uploadedFilename: string, style: string, seed: number) {
  const s = HEADSHOT_STYLES[style] || HEADSHOT_STYLES.linkedin;
  const positivePrompt = `RAW photo, ${s.prompt}, photorealistic, detailed skin texture, subsurface scattering, DSLR, sharp focus`;
  const negativePrompt =
    "deformed, blurry, bad anatomy, extra limbs, text, watermark, ugly, disfigured, low quality, painting, cartoon, anime, gender swap, wrong gender, changed appearance";

  return {
    // 1. Load checkpoint
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "RealVisXL_V4.safetensors" },
    },
    // 2. Load LoRA
    "2": {
      class_type: "LoraLoader",
      inputs: {
        model: ["1", 0],
        clip: ["1", 1],
        lora_name: "lumen_headshots_v1.safetensors",
        strength_model: 0.5,
        strength_clip: 0.5,
      },
    },
    // 3. Load reference image (uploaded by user)
    "3": {
      class_type: "LoadImage",
      inputs: { image: uploadedFilename, upload: "image" },
    },
    // 4. InstantID Face Analysis
    "4": {
      class_type: "InstantIDFaceAnalysis",
      inputs: { provider: "CPU" },
    },
    // 5. Load InstantID model (ip-adapter.bin)
    "5": {
      class_type: "InstantIDModelLoader",
      inputs: { instantid_file: "ip-adapter.bin" },
    },
    // 6. Load InstantID ControlNet
    "6": {
      class_type: "ControlNetLoader",
      inputs: { control_net_name: "instantid-controlnet.safetensors" },
    },
    // 7. Positive prompt
    "7": {
      class_type: "CLIPTextEncode",
      inputs: { text: positivePrompt, clip: ["2", 1] },
    },
    // 8. Negative prompt
    "8": {
      class_type: "CLIPTextEncode",
      inputs: { text: negativePrompt, clip: ["2", 1] },
    },
    // 9. Apply InstantID — strong face lock (weight=0.8)
    "9": {
      class_type: "ApplyInstantID",
      inputs: {
        instantid: ["5", 0],
        insightface: ["4", 0],
        control_net: ["6", 0],
        image: ["3", 0],
        model: ["2", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        weight: 0.8,
        start_at: 0.0,
        end_at: 1.0,
      },
    },
    // 10. Latent image (portrait 832×1216)
    "10": {
      class_type: "EmptyLatentImage",
      inputs: { width: 832, height: 1216, batch_size: 1 },
    },
    // 11. KSampler
    "11": {
      class_type: "KSampler",
      inputs: {
        model: ["9", 0],
        positive: ["9", 1],
        negative: ["9", 2],
        latent_image: ["10", 0],
        seed,
        steps: 30,
        cfg: 5.0,
        sampler_name: "dpmpp_2m_sde",
        scheduler: "karras",
        denoise: 1.0,
      },
    },
    // 12. VAE Decode
    "12": {
      class_type: "VAEDecode",
      inputs: { samples: ["11", 0], vae: ["1", 2] },
    },
    // 13. Save Image
    "13": {
      class_type: "SaveImage",
      inputs: { images: ["12", 0], filename_prefix: "headshot" },
    },
  } as Record<string, any>;
}

async function uploadImageToComfyUI(imageBytes: ArrayBuffer, filename: string): Promise<string | null> {
  try {
    const boundary = `----FormBoundary${Math.random().toString(36).substring(2)}`;
    const uint8Array = new Uint8Array(imageBytes);
    const encoder = new TextEncoder();

    const header = encoder.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const footer = encoder.encode(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--${boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--${boundary}--\r\n`
    );

    const fullBody = new Uint8Array(header.length + uint8Array.length + footer.length);
    fullBody.set(header, 0);
    fullBody.set(uint8Array, header.length);
    fullBody.set(footer, header.length + uint8Array.length);

    const r = await fetch(`${COMFYUI_URL}/upload/image`, {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body: fullBody,
    });

    if (r.ok) {
      const d = await r.json();
      return d.name || filename;
    }
    console.error("Upload failed:", r.status, await r.text());
  } catch (e) {
    console.error("Upload error:", e);
  }
  return null;
}

async function queuePrompt(workflow: Record<string, any>): Promise<string | null> {
  try {
    const r = await fetch(`${COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (r.ok) {
      const d = await r.json();
      return d.prompt_id || null;
    }
    const text = await r.text();
    console.error("Queue failed:", r.status, text);
  } catch (e) {
    console.error("Queue error:", e);
  }
  return null;
}

export async function GET() {
  return NextResponse.json({
    styles: Object.entries(HEADSHOT_STYLES).map(([id, s]) => ({ id, label: s.label, icon: s.icon })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const stylesRaw = formData.get("styles") as string | null;
    const styles: string[] = stylesRaw ? JSON.parse(stylesRaw) : ["linkedin", "creative", "casual"];

    if (!file) return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const uploadFilename = `headshot_ref_${Date.now()}.jpg`;
    const comfyFilename = await uploadImageToComfyUI(bytes, uploadFilename);

    if (!comfyFilename) {
      return NextResponse.json(
        { error: "Failed to upload image to DGX — try again" },
        { status: 500 }
      );
    }

    const jobs: { style: string; promptId: string; label: string; icon: string }[] = [];

    for (const style of styles.slice(0, 6)) {
      const seed = Math.floor(Math.random() * 999999999);
      const workflow = buildInstantIDWorkflow(comfyFilename, style, seed);
      const promptId = await queuePrompt(workflow);
      if (promptId) {
        jobs.push({
          style,
          promptId,
          label: HEADSHOT_STYLES[style]?.label || style,
          icon: HEADSHOT_STYLES[style]?.icon || "📸",
        });
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!jobs.length) {
      return NextResponse.json(
        { error: "Failed to queue jobs — DGX may be busy, try again" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs,
      message: `Generating ${jobs.length} headshots...`,
      refImage: comfyFilename,
    });
  } catch (e: any) {
    console.error("Headshots error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
