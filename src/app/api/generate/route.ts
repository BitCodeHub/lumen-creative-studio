import { NextRequest, NextResponse } from "next/server";

// Use env var for ngrok URL, fallback to Tailscale for local dev
const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

// FLUX.1-dev workflow
function createFluxDevWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "UNETLoader", "inputs": { "unet_name": "flux1-dev.safetensors", "weight_dtype": "default" } },
    "2": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp16.safetensors", "type": "flux" } },
    "3": { "class_type": "VAELoader", "inputs": { "vae_name": "flux_ae.safetensors" } },
    "4": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["2", 0] } },
    "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "6": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["4", 0], "negative": ["7", 0], "latent_image": ["5", 0], "seed": actualSeed, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0 } },
    "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["2", 0] } },
    "8": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["3", 0] } },
    "9": { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "lumen_flux_dev" } },
  } as Record<string, any>;
}

// FLUX Schnell (fast, 4 steps)
function createFluxSchnellWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "UNETLoader", "inputs": { "unet_name": "flux1-schnell-fp8.safetensors", "weight_dtype": "default" } },
    "2": { "class_type": "DualCLIPLoader", "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp16.safetensors", "type": "flux" } },
    "3": { "class_type": "VAELoader", "inputs": { "vae_name": "flux_ae.safetensors" } },
    "4": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["2", 0] } },
    "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "6": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["4", 0], "negative": ["7", 0], "latent_image": ["5", 0], "seed": actualSeed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0 } },
    "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["2", 0] } },
    "8": { "class_type": "VAEDecode", "inputs": { "samples": ["6", 0], "vae": ["3", 0] } },
    "9": { "class_type": "SaveImage", "inputs": { "images": ["8", 0], "filename_prefix": "lumen_schnell" } },
  } as Record<string, any>;
}

// RealVisXL V4 — photorealistic (45 steps, DPM++ 2M SDE Karras)
function createRealVisWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `RAW photo, ${prompt}, extremely detailed face, photorealistic, 8k uhd, professional photography, dslr, bokeh background, cinematic lighting`;
  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "RealVisXL_V4.safetensors" } },
    "2": { "class_type": "CLIPTextEncode", "inputs": { "text": enhancedPrompt, "clip": ["1", 1] } },
    "3": { "class_type": "CLIPTextEncode", "inputs": { "text": "painting, illustration, cartoon, anime, drawing, sketch, 3d render, cgi, deformed, blurry, bad anatomy, text, watermark, ugly, disfigured", "clip": ["1", 1] } },
    "4": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "5": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": actualSeed, "steps": 45, "cfg": 4.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0 } },
    "6": { "class_type": "VAEDecode", "inputs": { "samples": ["5", 0], "vae": ["1", 2] } },
    "7": { "class_type": "SaveImage", "inputs": { "images": ["6", 0], "filename_prefix": "lumen_realvis" } },
  } as Record<string, any>;
}

// SDXL (JuggernautXL v9 — best photorealistic SDXL checkpoint)
function createSDXLWorkflow(prompt: string, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  return {
    "1": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "juggernautXL_v9.safetensors" } },
    "2": { "class_type": "CLIPTextEncode", "inputs": { "text": prompt, "clip": ["1", 1] } },
    "3": { "class_type": "CLIPTextEncode", "inputs": { "text": "ugly, blurry, low quality, distorted, deformed, watermark, text", "clip": ["1", 1] } },
    "4": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } },
    "5": { "class_type": "KSampler", "inputs": { "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": actualSeed, "steps": 30, "cfg": 4.5, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0 } },
    "6": { "class_type": "VAEDecode", "inputs": { "samples": ["5", 0], "vae": ["1", 2] } },
    "7": { "class_type": "SaveImage", "inputs": { "images": ["6", 0], "filename_prefix": "lumen_sdxl" } },
  } as Record<string, any>;
}

// Patch EmptyLatentImage dimensions + optionally append 4x upscale node
function patchDimensions(workflow: Record<string, any>, w: number, h: number, upscale4k: boolean) {
  // Find highest node id
  const nodeIds = Object.keys(workflow).map(Number).sort((a, b) => a - b);
  const lastId = nodeIds[nodeIds.length - 1];
  const saveNodeId = String(lastId); // last node should be SaveImage

  for (const node of Object.values(workflow)) {
    if ((node as any).class_type === "EmptyLatentImage") {
      (node as any).inputs.width = w;
      (node as any).inputs.height = h;
    }
  }

  if (upscale4k) {
    // Get the image output node (SaveImage) and redirect through upscaler
    const saveNode = workflow[saveNodeId];
    if (saveNode?.class_type === "SaveImage") {
      const imageSource = saveNode.inputs.images; // e.g. ["6", 0]
      const upscalerId = String(lastId + 1);
      const newSaveId = String(lastId + 2);

      workflow[upscalerId] = {
        "class_type": "UpscaleModelLoader",
        "inputs": { "model_name": "4x-UltraSharp.pth" }
      };
      // Insert ImageUpscaleWithModel between decode and save
      const upscaleNodeId = String(lastId + 3);
      workflow[upscaleNodeId] = {
        "class_type": "ImageUpscaleWithModel",
        "inputs": { "upscale_model": [upscalerId, 0], "image": imageSource }
      };
      // Redirect SaveImage to use upscaled output
      workflow[newSaveId] = {
        "class_type": "SaveImage",
        "inputs": { "images": [upscaleNodeId, 0], "filename_prefix": saveNode.inputs.filename_prefix + "_4k" }
      };
      // Remove old SaveImage node
      delete workflow[saveNodeId];
    }
  }

  return workflow;
}

async function queuePrompt(workflow: object): Promise<string> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ComfyUI error: ${response.status} - ${text}`);
  }
  const data = await response.json();
  return data.prompt_id;
}

// POST — queue generation, return promptId immediately (no waiting)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model = "realvis",
      upscale4k = false,
      seed,
      width = 1024,
      height = 1024,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log(`[Generate] Model: ${model}, Size: ${width}x${height}, 4K: ${upscale4k}, Prompt: ${prompt.slice(0, 60)}...`);

    // Select workflow based on model
    let workflow: Record<string, any>;
    switch (model) {
      case "flux-dev":
        workflow = createFluxDevWorkflow(prompt, seed);
        break;
      case "flux-schnell":
        workflow = createFluxSchnellWorkflow(prompt, seed);
        break;
      case "sdxl":
        workflow = createSDXLWorkflow(prompt, seed);
        break;
      case "realvis":
      default:
        workflow = createRealVisWorkflow(prompt, seed);
        break;
    }

    // Apply user-selected dimensions (and optional 4K upscale node)
    patchDimensions(workflow, width, height, upscale4k);

    // Clear queue if backed up (>5 pending) so user isn't stuck behind auto-gen
    try {
      const queueRes = await fetch(`${COMFYUI_URL}/queue`, { signal: AbortSignal.timeout(3000) });
      const queueData = await queueRes.json();
      const pendingCount = Array.isArray(queueData.queue_pending) ? queueData.queue_pending.length : 0;
      if (pendingCount > 5) {
        console.log(`[Generate] Clearing ${pendingCount} pending jobs to prioritize user request`);
        await fetch(`${COMFYUI_URL}/queue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clear: true }),
        });
        await new Promise(r => setTimeout(r, 300));
      }
    } catch { /* non-fatal */ }

    // Queue and return promptId immediately — frontend polls GET
    const promptId = await queuePrompt(workflow);
    console.log(`[Generate] Queued: ${promptId}`);

    return NextResponse.json({ promptId, model });

  } catch (error) {
    console.error("[Generate] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

// GET — poll status by promptId, or health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get("promptId");

  // Poll mode
  if (promptId) {
    try {
      const response = await fetch(`${COMFYUI_URL}/history/${promptId}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return NextResponse.json({ status: "pending" });
      }
      const history = await response.json();
      if (history[promptId]?.outputs) {
        const outputs = history[promptId].outputs;
        for (const nodeId in outputs) {
          if (outputs[nodeId].images?.[0]) {
            const image = outputs[nodeId].images[0];
            const imageUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || "")}&type=${image.type}`;
            return NextResponse.json({ status: "complete", imageUrl });
          }
        }
      }
      // Check for error in history
      if (history[promptId]?.status?.status_str === "error") {
        return NextResponse.json({ status: "error" });
      }
      return NextResponse.json({ status: "pending" });
    } catch {
      return NextResponse.json({ status: "pending" });
    }
  }

  // Health check mode
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const stats = await response.json();
      return NextResponse.json({
        status: "ok",
        comfyui: "connected",
        url: COMFYUI_URL,
        gpu: stats.devices?.[0]?.name || "unknown",
      });
    }
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  } catch {
    return NextResponse.json({ status: "error", comfyui: "unreachable" }, { status: 503 });
  }
}
