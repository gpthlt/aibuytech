# 🧩 Development Guide

## 1. Pre-Build Configuration

Before building and running the service, make sure your environment meets the following requirements.

### ⚙️ System Requirements

- **Docker version:** `28.5.1`  
- **Docker Compose version:** `v2.40.2`  
- **GPU:** NVIDIA GPU with CUDA **≥ 12.6**

### 📂 Model Setup

Download the pretrained model from the following link and place it under the `models/` directory:

👉 [Pretrained Model (Google Drive)](https://drive.google.com/drive/folders/1UYfGdRUzQRC4Xi3RR5S_kNcmQkCjoz73?usp=drive_link)

Your directory structure should look like this:

```bash

ai_service/
├── models/
│   └── dinov3-vitl16-pretrain-lvd1689m/
├── ...
├── docker-compose.yaml
├── Makefile
└── .env.example
```

### 🧾 Environment Configuration

Copy the provided `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Then open `.env` and configure the following variables:

```bash
VECTOR_DIM=1024

# Milvus configuration
MILVUS_HOST=milvus        # Must match the service name in docker-compose.yaml
MILVUS_PORT=19530         # Must match the port defined for the Milvus service
COLLECTION_NAME=images

# Model configuration
MODEL_PATH=models/dinov3-vitl16-pretrain-lvd1689m
DEVICE=cuda:0             # Change to cuda:1, cuda:2, ... if using multiple GPUs

# LLM configuration
OPENAI_API_KEY=your-openai-api-key
llm_model=gpt-4o-mini      # Match the type of OpenAI API key you have
```

### 🖥️ API Server Configuration

You can configure the **service host IP and port** directly inside the `docker-compose.yaml` file under the `api_server` service:

```yaml
api_server:
    ...
        SERVICE_HOST: 0.0.0.0 # Service host ip
        SERVICE_PORT: 8003 # Service port
    ports:
        - "8003:8003" # Exposed port
```

Modify these values if you need to change the service port or host binding.

---

## 2. Running the Service

Use the provided `Makefile` commands to build, run, and manage the service.

### 🏗️ Build the Service

```bash
make build
```

### 🚀 Run the Service

```bash
make run
```

### 🧯 Stop the Service

```bash
make stop
```

### 📜 View Service Logs

```bash
make logs
```

> ⏳ **Note:** After running `make run`, please wait a short moment before using the API endpoints — the containers may take a few seconds to initialize.

## 3. API Endpoints

Below are the endpoints provided by the **AI Service API**.  
All endpoints are accessible under the base path:

```
http://<host>:<port>/api/v1
```

Example (default):  
```
http://localhost:8003/api/v1
```

---

## 🩺 Health Check

**Endpoint:**  
`GET /health`

**Description:**  
Simple endpoint to verify that the API service is running.

**Response Example:**
```json
{
  "status": "ok",
  "message": "AI service is running."
}
```

---

## 🖼️ Upsert Image

**Endpoint:**  
`POST /upsert/`

**Description:**  
Uploads an image, embeds it into a vector representation, and stores it in the vector database (Milvus) along with metadata.

**Request (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `image_id` | string | Unique identifier for the image |
| `image_bytes` | file | Image file to upload |
| `item_id` | string | Associated product/item ID |

**Response (JSON):**
```json
{
  "image_id": "img123",
  "status": "success",
  "metadata": {
    "item_id": "item567",
    "created_at": 1731218345
  }
}
```

---

## 🔍 Retrieve Similar Images

**Endpoint:**  
`POST /retrieve/`

**Description:**  
Given an image, retrieve the top-K most similar images from the vector database.

**Request (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `image_bytes` | file | Image to search for |
| `top_k` | integer | Number of most similar results to return (default: 5) |

**Response (JSON):**
```json
{
  "results": [
    {
      "image_id": "img001",
      "metadata": {
        "item_id": "item1001",
        "created_at": 1731218123
      },
      "similarity": 0.94
    }
  ]
}
```

---

## 🗑️ Delete Image Record

**Endpoint:**  
`DELETE /record/{image_id}`

**Description:**  
Deletes an image embedding and metadata from the vector database.

**Path Parameter:**
| Name | Type | Description |
|------|------|-------------|
| `image_id` | string | The ID of the image to delete |

**Response (JSON):**
```json
{
  "image_id": "img123",
  "status": "deleted"
}
```

---

## 🛒 Compare Products

**Endpoint:**  
`POST /compare/`

**Description:**  
Compares 2–4 products based on user reviews using an LLM to analyze sentiment, summarize aspects, and compute satisfaction rates.

**Example Request Body (application/json):**
```json
{
  "products": [
    {
      "id": "p1",
      "name": "iPhone 15",
      "reviews": [
        {
          "id": "r1",
          "content": "Battery life is great and lasts all day!",
          "rating": 4.8,
          "date": "2024-09-01T12:00:00",
          "verified_purchase": true
        },
        {
          "id": "r3",
          "content": "Camera is decent but not the best.",
          "rating": 3.8,
          "date": "2024-09-03T09:00:00",
          "verified_purchase": true
        }
      ]
    },
    {
      "id": "p2",
      "name": "Samsung S24",
      "reviews": [
        {
          "id": "r3",
          "content": "Sản phẩm đúng với mô tả",
          "rating": 4.5,
          "date": "2024-09-02T09:00:00",
          "verified_purchase": true
        },
        {
          "id": "r2",
          "content": "Camera is decent but not the best.",
          "rating": 3.8,
          "date": "2024-09-03T09:00:00",
          "verified_purchase": true
        }
      ]
    }
  ]
}
```

**Example Response (JSON):**
```json
{
  "product_summaries": {
    "iPhone 15": [
      {
        "aspect": "Pin",
        "sentiment": 0.8,
        "summary": "Thời lượng pin của iPhone 15 được người dùng đánh giá cao, cho phép sử dụng cả ngày mà không cần sạc lại.",
        "key_quotes": ["Battery life is great and lasts all day!"]
      }
    ],
    "Samsung S24": [
      {
        "aspect": "Pin",
        "sentiment": 0.8,
        "summary": "Thời lượng pin của Samsung S24 được người dùng đánh giá cao, cho phép sử dụng cả ngày mà không cần sạc lại.",
        "key_quotes": ["Battery life is great and lasts all day!", "Sản phẩm đúng với mô tả"]
      },
      {
        "aspect": "Thiết kế",
        "sentiment": 0.5,
        "summary": "Thiết kế của sản phẩm được người dùng chấp nhận, nhưng không có nhiều ý kiến cụ thể về điểm này.",
        "key_quotes": ["Sản phẩm đúng với mô tả"]
      }
    ]
  },
  "overall_comparison": {
    "products": [
      {
        "name": "iPhone 15",
        "pros": ["Thời lượng pin tuyệt vời, sử dụng cả ngày không cần sạc"],
        "cons": []
      },
      {
        "name": "Samsung S24",
        "pros": ["Thời lượng pin tuyệt vời, sử dụng cả ngày không cần sạc", "Thiết kế được người dùng chấp nhận"],
        "cons": ["Thiết kế không có nhiều ý kiến đóng góp"]
      }
    ],
    "comparison_summary": "Cả iPhone 15 và Samsung S24 đều có thời lượng pin xuất sắc, cho phép người dùng sử dụng cả ngày mà không cần sạc. Tuy nhiên, Samsung S24 có thêm điểm cộng về thiết kế được người dùng chấp nhận, trong khi iPhone 15 không có nhược điểm nào đáng kể."
  },
  "satisfaction_rates": {
    "iPhone 15": 87.0,
    "Samsung S24": 85.0
  }
}

```
> ⏳ **Note:** The list under each product name in product_summaries is dynamic in length - the number of elements depends on how many distinct aspects the LLM extracts from that product’s reviews.
---

## 💬 Extract Product Constraints

**Endpoint:**  
`POST /constraint/`

**Description:**  
Extracts constraints (like category, budget, and expression) from a natural language query using the LLM. These constraints can be used to dynamically filter out item given an user natural language query.

**Request Body (application/json):**
```json
{
  "user_query": "I want a smartphone under $800"
}
```

**Response (JSON):**
```json
{
  "category": "smartphone",
  "budget": 800.0,
  "expression": "Less" // less then 800$
}
```
