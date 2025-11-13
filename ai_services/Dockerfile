FROM nvidia/cuda:12.6.0-runtime-ubuntu22.04

# Avoid tzdata interactive prompt
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR /app

# Install Python 3.12 via deadsnakes PPA
RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common curl git build-essential tzdata && \
    add-apt-repository ppa:deadsnakes/ppa -y && \
    apt-get update && apt-get install -y --no-install-recommends \
    python3.12 python3.12-venv && \
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12 && \
    ln -sf /usr/bin/python3.12 /usr/bin/python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Download model files during build
RUN echo "Downloading model files from Google Drive..." && \
    python3 download.py && \
    echo "Model download complete"

EXPOSE 8003

CMD ["sh", "-c", "python3 server.py --host ${SERVICE_HOST:-0.0.0.0} --port ${SERVICE_PORT:-8003}"]
