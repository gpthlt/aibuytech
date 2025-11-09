SERVICE_HOST=0.0.0.0
SERVICE_PORT=8003

IMAGE_NAME=ai_api_server
CONTAINER_NAME=ai_service

build:
	docker build -t $(IMAGE_NAME) .

run:
	docker run -d \
		--name $(CONTAINER_NAME) \
		--gpus all \
		--env-file .env \
		-e SERVICE_HOST=$(SERVICE_HOST) \
		-e SERVICE_PORT=$(SERVICE_PORT) \
		-p $(SERVICE_PORT):$(SERVICE_PORT) \
		$(IMAGE_NAME)

	@echo ""
	@echo "AI server is running!"
	@echo "Docs available at: http://$(SERVICE_HOST):$(SERVICE_PORT)/docs"

stop:
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

logs:
	docker logs -f $(CONTAINER_NAME)
