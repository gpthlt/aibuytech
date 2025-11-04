from typing import Union, Optional
import io
import asyncio
import time

import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModel
from transformers.image_utils import load_image

from logger import file_logger as logger

ImageInput = Union[str, bytes, Image.Image]


class ImageEmbedder:
    def __init__(
        self,
        model_name_or_path: str,
        device: Optional[str] = None, #"cuda:0", "cpu"
        device_map: Optional[Union[str, dict]] = "auto",
        torch_dtype: Optional[torch.dtype] = None,
    ):
        self.model_id = model_name_or_path
        self.device = torch.device(device) if device else None
        self.device_map = device_map
        self.torch_dtype = torch_dtype

        self.processor = AutoImageProcessor.from_pretrained(self.model_id)

        model_kwargs = {}
        if self.device_map is not None:
            model_kwargs["device_map"] = self.device_map
        if self.torch_dtype is not None:
            model_kwargs["torch_dtype"] = self.torch_dtype

        self.model = AutoModel.from_pretrained(self.model_id, **model_kwargs)
        if self.device:
            self.model.to(self.device)
        self.model.eval()
        logger.info("Image embedding model loaded")

    def _load_image(self, inp: ImageInput) -> Image.Image:
        """Load image from URL/path/bytes/PIL -> PIL.Image (RGB)."""
        try:
            if isinstance(inp, Image.Image):
                img = inp.convert("RGB")
            elif isinstance(inp, bytes):
                img = Image.open(io.BytesIO(inp)).convert("RGB")
            elif isinstance(inp, str):
                if inp.startswith("http://") or inp.startswith("https://"):
                    img = load_image(inp).convert("RGB")
                else:
                    img = Image.open(inp).convert("RGB")
            else:
                raise TypeError("image must be URL string, local path, bytes, or PIL.Image.Image")
            logger.debug("Image loaded successfully.")
            return img
        except Exception:
            logger.error("Failed to load image.")
            raise

    def _prepare_inputs(self, pil_image: Image.Image):
        try:
            inputs = self.processor(images=pil_image, return_tensors="pt")
            # try to move inputs to a device if model has a single device attribute
            try:
                first_param = next(self.model.parameters())
                primary_device = first_param.device
                inputs = {k: v.to(primary_device) for k, v in inputs.items()}
                logger.debug(f"Inputs moved to device {primary_device}.")
            except Exception:
                logger.debug("Could not move inputs to model device (model may be sharded). Leaving on CPU.")
            return inputs
        except Exception:
            logger.error("Failed to prepare inputs with processor.")
            raise

    def _postprocess_output(self, outputs: torch.nn.Module) -> np.ndarray:
        try:
            with torch.no_grad():
                if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                    vec = outputs.pooler_output
                else:
                    vec = outputs.last_hidden_state[:, 0, :]

            vec = vec.detach().cpu().numpy().reshape(-1).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            logger.debug("Postprocessing complete (pooled embedding extracted and normalized).")
            return vec
        except Exception:
            logger.error("Failed to postprocess model outputs.")
            raise

    def _infer_blocking(self, pil_image: Image.Image) -> np.ndarray:
        try:
            inputs = self._prepare_inputs(pil_image)
            start = time.time()
            with torch.inference_mode():
                outputs = self.model(**inputs)
            emb = self._postprocess_output(outputs)
            elapsed = time.time() - start
            logger.debug(f"Inference completed in {elapsed:.4f}s")
            return emb
        except Exception:
            logger.error("Inference failed.")
            raise

    async def embed(self, image: ImageInput) -> np.ndarray:
        """
        Async wrapper for producing a single embedding.
        Accepts URL (http/https), local path, bytes, or PIL.Image.
        Returns: 1-D L2-normalized np.ndarray (float32).
        """
        logger.info("Embed request received.")
        try:
            pil = await asyncio.to_thread(self._load_image, image)
            emb = await asyncio.to_thread(self._infer_blocking, pil)
            logger.info("Embed request completed successfully.")
            return emb
        except Exception:
            logger.error("Embed request failed.")
            raise

    def warmup(self):
        try:
            size = None
            try:
                # processor may have size dict with shortest_edge or height/width
                if isinstance(self.processor.size, dict):
                    # use shortest_edge if present, else fallback
                    size = self.processor.size.get("shortest_edge") or next(iter(self.processor.size.values()))
                else:
                    size = int(self.processor.size)
            except Exception:
                size = 224

            dummy = Image.new("RGB", (size, size), color=(127, 127, 127))
            _ = self._infer_blocking(dummy)
            logger.info("Warmup completed.")
            return True
        except Exception:
            logger.error("Warmup failed.")
            return False

    def close(self):
        logger.info("Closing ImageEmbedder and freeing resources...")
        try:
            if self.model is not None and hasattr(self.model, "cpu"):
                try:
                    self.model.cpu()
                    logger.debug("Model moved to CPU.")
                except Exception:
                    logger.debug("Failed to move model to CPU.")
        except Exception:
            logger.error("Error while trying to move model to CPU.")
        try:
            if self.model is not None:
                del self.model
                logger.debug("Model reference deleted.")
        except Exception:
            logger.error("Failed to delete model reference.")
        self.model = None
        logger.info("ImageEmbedder closed.")


if __name__ == "__main__":
    import asyncio

    async def example():
        try:
            embedder = ImageEmbedder(
                model_name_or_path="model/dinov3-vitl16-pretrain-lvd1689m",
                device="cuda:0",
                device_map="auto",
                torch_dtype=None,  # or torch.float16 
            )
        except Exception as e:
            logger.error("Failed to initialize embedder in __main__.")
            return

        try:
            # url example
            url = "http://images.cocodataset.org/val2017/000000039769.jpg"
            vec = await embedder.embed(url)
            print("embedding shape:", vec.shape)
        except Exception:
            logger.error("Embedding example failed.")
        finally:
            try:
                embedder.close()
            except Exception:
                logger.error("Error while closing embedder in __main__.")

    asyncio.run(example())