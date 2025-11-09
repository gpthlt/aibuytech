COMPOSE_FILE=docker-compose.yaml
MILVUS_SERVICES := etcd minio milvus attu api_server

.PHONY: up down logs stop

build:
	docker-compose -f $(COMPOSE_FILE) build -d $(MILVUS_SERVICES)

run:
	docker-compose -f $(COMPOSE_FILE) up -d $(MILVUS_SERVICES)

stop:
	docker-compose -f $(COMPOSE_FILE) down $(MILVUS_SERVICES)

logs:
	docker-compose -f $(COMPOSE_FILE) logs -f $(MILVUS_SERVICES)
