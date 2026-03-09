import { NextRequest, NextResponse } from "next/server";

// Use env var for ngrok URL, fallback to Tailscale for local dev
const COMFYUI_URL = process.env.COMFY_URL || "http://100.79.93.27:8188";

// FLUX.1-dev workflow with 4x upscaling
function createFluxDevWorkflow(prompt: string, seed?: number, upscale = true) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  
  const workflow: Record<string, any> = {
    "1": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "flux1-dev.safetensors",
        "weight_dtype": "default"
      }
    },
    "2": {
      "class_type": "DualCLIPLoader",
      "inputs": {
        "clip_name1": "clip_l.safetensors",
        "clip_name2": "t5xxl_fp16.safetensors",
        "type": "flux"
      }
    },
    "3": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "flux_ae.safetensors"
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": prompt,
        "clip": ["2", 0]
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["4", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0],
        "seed": actualSeed,
        "steps": 25,
        "cfg": 1.0,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1.0
      }
    },
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "",
        "clip": ["2", 0]
      }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["6", 0],
        "vae": ["3", 0]
      }
    }
  };

  if (upscale) {
    // Add 4x upscaling
    workflow["9"] = {
      "class_type": "UpscaleModelLoader",
      "inputs": {
        "model_name": "4x-UltraSharp.pth"
      }
    };
    workflow["10"] = {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["9", 0],
        "image": ["8", 0]
      }
    };
    workflow["11"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["10", 0],
        "filename_prefix": "lumen_flux_4k"
      }
    };
  } else {
    workflow["9"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": "lumen_flux"
      }
    };
  }

  return workflow;
}

// FLUX Schnell (fast) workflow with 4x upscaling
function createFluxSchnellWorkflow(prompt: string, seed?: number, upscale = true) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  
  const workflow: Record<string, any> = {
    "1": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "flux1-schnell.safetensors",
        "weight_dtype": "default"
      }
    },
    "2": {
      "class_type": "DualCLIPLoader",
      "inputs": {
        "clip_name1": "clip_l.safetensors",
        "clip_name2": "t5xxl_fp16.safetensors",
        "type": "flux"
      }
    },
    "3": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "flux_ae.safetensors"
      }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": prompt,
        "clip": ["2", 0]
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["4", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0],
        "seed": actualSeed,
        "steps": 4,
        "cfg": 1.0,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1.0
      }
    },
    "7": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "",
        "clip": ["2", 0]
      }
    },
    "8": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["6", 0],
        "vae": ["3", 0]
      }
    }
  };

  if (upscale) {
    workflow["9"] = {
      "class_type": "UpscaleModelLoader",
      "inputs": {
        "model_name": "4x-UltraSharp.pth"
      }
    };
    workflow["10"] = {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["9", 0],
        "image": ["8", 0]
      }
    };
    workflow["11"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["10", 0],
        "filename_prefix": "lumen_schnell_4k"
      }
    };
  } else {
    workflow["9"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": "lumen_schnell"
      }
    };
  }

  return workflow;
}

// RealVisXL V4 workflow for photorealistic images with 4x upscaling
function createRealVisWorkflow(prompt: string, seed?: number, upscale = true) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `RAW photo, ${prompt}, extremely detailed face, photorealistic, 8k uhd, professional photography`;
  
  const workflow: Record<string, any> = {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "RealVisXL_V4.0.safetensors"
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": enhancedPrompt,
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "ugly, blurry, low quality, distorted, deformed, watermark, text",
        "clip": ["1", 1]
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "seed": actualSeed,
        "steps": 45,
        "cfg": 4.5,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 1.0
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      }
    }
  };

  if (upscale) {
    workflow["7"] = {
      "class_type": "UpscaleModelLoader",
      "inputs": {
        "model_name": "4x-UltraSharp.pth"
      }
    };
    workflow["8"] = {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["7", 0],
        "image": ["6", 0]
      }
    };
    workflow["9"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": "lumen_realvis_4k"
      }
    };
  } else {
    workflow["7"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["6", 0],
        "filename_prefix": "lumen_realvis"
      }
    };
  }

  return workflow;
}

// SDXL workflow with 4x upscaling
function createSDXLWorkflow(prompt: string, seed?: number, upscale = true) {
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000);
  
  const workflow: Record<string, any> = {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": prompt,
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "ugly, blurry, low quality, distorted",
        "clip": ["1", 1]
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "seed": actualSeed,
        "steps": 25,
        "cfg": 7.0,
        "sampler_name": "euler_ancestral",
        "scheduler": "normal",
        "denoise": 1.0
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      }
    }
  };

  if (upscale) {
    workflow["7"] = {
      "class_type": "UpscaleModelLoader",
      "inputs": {
        "model_name": "4x-UltraSharp.pth"
      }
    };
    workflow["8"] = {
      "class_type": "ImageUpscaleWithModel",
      "inputs": {
        "upscale_model": ["7", 0],
        "image": ["6", 0]
      }
    };
    workflow["9"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["8", 0],
        "filename_prefix": "lumen_sdxl_4k"
      }
    };
  } else {
    workflow["7"] = {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["6", 0],
        "filename_prefix": "lumen_sdxl"
      }
    };
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

async function waitForImage(promptId: string, maxWaitMs = 180000): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
      const history = await response.json();
      
      if (history[promptId]?.outputs) {
        const outputs = history[promptId].outputs;
        for (const nodeId in outputs) {
          if (outputs[nodeId].images?.[0]) {
            const image = outputs[nodeId].images[0];
            return `${COMFYUI_URL}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || "")}&type=${image.type}`;
          }
        }
      }
    } catch (e) {
      // Ignore polling errors
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  throw new Error("Timeout waiting for image generation (3 min)");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      model = "flux-dev",
      upscale = true,
      seed
    } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    console.log(`[Generate] Model: ${model}, Prompt: ${prompt.slice(0, 50)}..., Upscale: ${upscale}`);
    
    // Select workflow based on model
    let workflow;
    switch (model) {
      case "realvis":
        workflow = createRealVisWorkflow(prompt, seed, upscale);
        break;
      case "flux-schnell":
        workflow = createFluxSchnellWorkflow(prompt, seed, upscale);
        break;
      case "sdxl":
        workflow = createSDXLWorkflow(prompt, seed, upscale);
        break;
      case "flux-dev":
      default:
        workflow = createFluxDevWorkflow(prompt, seed, upscale);
        break;
    }
    
    // Queue the generation
    const promptId = await queuePrompt(workflow);
    console.log(`[Generate] Queued: ${promptId}`);
    
    // Wait for result
    const imageUrl = await waitForImage(promptId);
    console.log(`[Generate] Complete: ${imageUrl}`);
    
    return NextResponse.json({ 
      success: true,
      imageUrl,
      promptId,
      model,
      upscaled: upscale
    });
    
  } catch (error) {
    console.error("[Generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - verify ComfyUI connection
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const stats = await response.json();
      return NextResponse.json({ 
        status: "ok", 
        comfyui: "connected",
        url: COMFYUI_URL,
        gpu: stats.devices?.[0]?.name || "unknown"
      });
    }
    return NextResponse.json({ status: "error", comfyui: "unreachable", url: COMFYUI_URL }, { status: 503 });
  } catch {
    return NextResponse.json({ status: "error", comfyui: "unreachable", url: COMFYUI_URL }, { status: 503 });
  }
}
