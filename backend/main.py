"""
Lumen Creative Studio - FastAPI Backend
Connects to DGX Spark ComfyUI for AI generation
"""

import os
import json
import uuid
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(
    title="Lumen Creative Studio API",
    description="AI-powered creative tools backend",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
COMFYUI_URL = "http://100.79.93.27:8188"
OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

# Job storage (in production, use Redis/DB)
jobs = {}


class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = "blurry, low quality, distorted, ugly, bad anatomy"
    width: int = 1024
    height: int = 1024
    steps: int = 20
    cfg: float = 3.5
    seed: int = -1
    model: str = "flux1-dev"
    upscale: bool = True


class VideoGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = "blurry, low quality, distorted"
    width: int = 480
    height: int = 320
    frames: int = 33
    steps: int = 20
    cfg: float = 3.0
    seed: int = -1


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    result_url: Optional[str] = None
    error: Optional[str] = None


def build_flux_workflow(req: ImageGenerateRequest) -> dict:
    """Build FLUX.1-dev workflow with 4x upscale"""
    seed = req.seed if req.seed > 0 else int(uuid.uuid4().int % 2**32)
    
    # Use schnell for fast generations (4 steps), dev for quality (20 steps)
    ckpt = "flux1-schnell.safetensors" if req.steps <= 8 else "flux1-dev.safetensors"
    
    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": ckpt
            }
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": req.prompt,
                "clip": ["1", 1]
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": req.negative_prompt,
                "clip": ["1", 1]
            }
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": req.width,
                "height": req.height,
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
                "seed": seed,
                "steps": req.steps,
                "cfg": req.cfg,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0
            }
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            }
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["6", 0],
                "filename_prefix": "lumen_flux"
            }
        }
    }
    
    # Add upscaling if enabled
    if req.upscale:
        workflow["8"] = {
            "class_type": "UpscaleModelLoader",
            "inputs": {
                "model_name": "4x-UltraSharp.pth"
            }
        }
        workflow["9"] = {
            "class_type": "ImageUpscaleWithModel",
            "inputs": {
                "upscale_model": ["8", 0],
                "image": ["6", 0]
            }
        }
        workflow["7"]["inputs"]["images"] = ["9", 0]
    
    return workflow


def build_ltx_video_workflow(req: VideoGenerateRequest) -> dict:
    """Build LTX Video workflow"""
    seed = req.seed if req.seed > 0 else int(uuid.uuid4().int % 2**32)
    
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "ltx-video-2b-v0.9.1.safetensors"
            }
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": req.prompt,
                "clip": ["1", 1]
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": req.negative_prompt,
                "clip": ["1", 1]
            }
        },
        "4": {
            "class_type": "EmptyLTXVLatentVideo",
            "inputs": {
                "width": req.width,
                "height": req.height,
                "length": req.frames,
                "batch_size": 1
            }
        },
        "5": {
            "class_type": "BasicScheduler",
            "inputs": {
                "model": ["1", 0],
                "scheduler": "normal",
                "steps": req.steps,
                "denoise": 1.0
            }
        },
        "6": {
            "class_type": "KSamplerSelect",
            "inputs": {
                "sampler_name": "euler"
            }
        },
        "7": {
            "class_type": "RandomNoise",
            "inputs": {
                "noise_seed": seed
            }
        },
        "8": {
            "class_type": "SamplerCustom",
            "inputs": {
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
                "sigmas": ["5", 0],
                "sampler": ["6", 0],
                "noise": ["7", 0],
                "cfg": req.cfg
            }
        },
        "9": {
            "class_type": "VAEDecodeTiled",
            "inputs": {
                "samples": ["8", 0],
                "vae": ["1", 2],
                "tile_size": 512,
                "overlap": 64
            }
        },
        "10": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": ["9", 0],
                "frame_rate": 16,
                "filename_prefix": "lumen_video",
                "format": "video/h264-mp4",
                "save_output": True
            }
        }
    }


async def queue_prompt(workflow: dict, client_id: str) -> str:
    """Queue a prompt to ComfyUI and return prompt_id"""
    payload = {
        "prompt": workflow,
        "client_id": client_id
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{COMFYUI_URL}/prompt", json=payload) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=500, detail="Failed to queue prompt")
            result = await resp.json()
            return result.get("prompt_id")


async def get_history(prompt_id: str) -> dict:
    """Get prompt history from ComfyUI"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{COMFYUI_URL}/history/{prompt_id}") as resp:
            if resp.status == 200:
                return await resp.json()
            return {}


async def download_output(filename: str, subfolder: str = "") -> str:
    """Download output file from ComfyUI"""
    params = {"filename": filename}
    if subfolder:
        params["subfolder"] = subfolder
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{COMFYUI_URL}/view", params=params) as resp:
            if resp.status == 200:
                local_path = OUTPUT_DIR / filename
                async with aiofiles.open(local_path, 'wb') as f:
                    await f.write(await resp.read())
                return str(local_path)
    return None


async def poll_job(job_id: str, prompt_id: str, job_type: str = "image"):
    """Poll ComfyUI for job completion"""
    max_attempts = 300  # 5 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        await asyncio.sleep(1)
        attempt += 1
        
        history = await get_history(prompt_id)
        
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            
            # Find the save node output
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    image_info = node_output["images"][0]
                    filename = image_info["filename"]
                    subfolder = image_info.get("subfolder", "")
                    
                    local_path = await download_output(filename, subfolder)
                    if local_path:
                        jobs[job_id] = {
                            "status": "completed",
                            "progress": 100,
                            "result_url": f"/api/outputs/{filename}",
                            "filename": filename
                        }
                        return
                
                if "gifs" in node_output:
                    video_info = node_output["gifs"][0]
                    filename = video_info["filename"]
                    subfolder = video_info.get("subfolder", "")
                    
                    local_path = await download_output(filename, subfolder)
                    if local_path:
                        jobs[job_id] = {
                            "status": "completed",
                            "progress": 100,
                            "result_url": f"/api/outputs/{filename}",
                            "filename": filename
                        }
                        return
        
        # Update progress estimate
        progress = min(95, int((attempt / max_attempts) * 100))
        jobs[job_id]["progress"] = progress
    
    jobs[job_id] = {
        "status": "failed",
        "progress": 0,
        "error": "Generation timed out"
    }


@app.get("/")
async def root():
    return {"message": "Lumen Creative Studio API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    """Check ComfyUI connection"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{COMFYUI_URL}/system_stats", timeout=5) as resp:
                if resp.status == 200:
                    stats = await resp.json()
                    return {
                        "status": "healthy",
                        "comfyui": "connected",
                        "gpu": stats.get("devices", [{}])[0].get("name", "Unknown")
                    }
    except Exception as e:
        return {"status": "degraded", "comfyui": "disconnected", "error": str(e)}


@app.post("/api/generate/image", response_model=JobResponse)
async def generate_image(req: ImageGenerateRequest, background_tasks: BackgroundTasks):
    """Generate an image using FLUX.1-dev"""
    job_id = str(uuid.uuid4())
    client_id = str(uuid.uuid4())
    
    # Build workflow
    workflow = build_flux_workflow(req)
    
    # Queue the prompt
    try:
        prompt_id = await queue_prompt(workflow, client_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Initialize job
    jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "prompt_id": prompt_id
    }
    
    # Start polling in background
    background_tasks.add_task(poll_job, job_id, prompt_id, "image")
    
    return JobResponse(
        job_id=job_id,
        status="processing",
        message="Image generation started"
    )


@app.post("/api/generate/video", response_model=JobResponse)
async def generate_video(req: VideoGenerateRequest, background_tasks: BackgroundTasks):
    """Generate a video using LTX Video"""
    job_id = str(uuid.uuid4())
    client_id = str(uuid.uuid4())
    
    # Build workflow
    workflow = build_ltx_video_workflow(req)
    
    # Queue the prompt
    try:
        prompt_id = await queue_prompt(workflow, client_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    # Initialize job
    jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "prompt_id": prompt_id
    }
    
    # Start polling in background
    background_tasks.add_task(poll_job, job_id, prompt_id, "video")
    
    return JobResponse(
        job_id=job_id,
        status="processing",
        message="Video generation started"
    )


@app.get("/api/job/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return JobStatus(
        job_id=job_id,
        status=job.get("status", "unknown"),
        progress=job.get("progress", 0),
        result_url=job.get("result_url"),
        error=job.get("error")
    )


@app.get("/api/outputs/{filename}")
async def get_output(filename: str):
    """Serve generated output files"""
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    media_type = "image/png"
    if filename.endswith(".mp4"):
        media_type = "video/mp4"
    elif filename.endswith(".webm"):
        media_type = "video/webm"
    elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
        media_type = "image/jpeg"
    
    return FileResponse(file_path, media_type=media_type)


@app.get("/api/models")
async def list_models():
    """List available models"""
    return {
        "image": [
            {"id": "flux1-dev", "name": "FLUX.1-dev", "description": "High quality image generation"},
            {"id": "flux1-schnell", "name": "FLUX.1-schnell", "description": "Fast image generation"},
        ],
        "video": [
            {"id": "ltx-video", "name": "LTX Video", "description": "Text-to-video generation"},
        ],
        "upscale": [
            {"id": "4x-ultrasharp", "name": "4x UltraSharp", "description": "4x upscaling"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
