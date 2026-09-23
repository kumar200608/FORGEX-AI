from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="WebMorph API")

# Allow the WebMorph frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "WebMorph",
        "status": "Backend running",
        "message": "Adaptive Web Delivery API"
    }


@app.get("/network")
def network(
    network: str = "MEDIUM",
    device: str = "Desktop"
):
    if network == "FAST":
        quality = "HIGH"
    elif network == "SLOW":
        quality = "LOW"
    else:
        quality = "MEDIUM"

    return {
        "network": network,
        "device": device,
        "quality": quality,
        "adaptive": True
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
@app.post("/optimize-image")
async def optimize_image(
    file: UploadFile = File(...),
    quality: str = "MEDIUM"
):
    image_data = await file.read()

    image = Image.open(io.BytesIO(image_data))
    image = image.convert("RGB")

    if quality == "HIGH":
        image.thumbnail((1200, 1200))
        jpeg_quality = 90

    elif quality == "LOW":
        image.thumbnail((500, 500))
        jpeg_quality = 40

    else:
        image.thumbnail((800, 800))
        jpeg_quality = 70

    output = io.BytesIO()

    image.save(
        output,
        format="JPEG",
        quality=jpeg_quality,
        optimize=True
    )

    output.seek(0)

    return {
        "status": "success",
        "quality": quality,
        "width": image.width,
        "height": image.height,
        "message": "Image optimized successfully"
    }