import asyncio
from typing import Any, Dict, List, Optional, Sequence, Union
from pymilvus import (
    connections,
    FieldSchema, CollectionSchema, DataType,
    Collection, utility
)
import numpy as np

from logger import file_logger as logger


class VectorDB:
    def __init__(
        self,
        dim: int,
        milvus_host: str = "localhost",
        milvus_port: str = "19530",
        collection_name: str = "images",
        metric: str = "cosine",
        create_if_missing: bool = True,
        index_params: Optional[Dict[str, Any]] = None,
        connect_uri: Optional[str] = None,
        timeout: Optional[float] = 30.0,
    ) -> None:
        self.dim = int(dim)
        self.collection_name = collection_name
        self.metric = metric.lower()
        assert self.metric in ("cosine", "l2"), "metric must be 'cosine' or 'l2'"
        self._milvus_metric = "COSINE" if self.metric == "cosine" else "L2"

        try:
            if connect_uri:
                connections.connect(uri=connect_uri, timeout=timeout)
            else:
                connections.connect(host=milvus_host, port=milvus_port, timeout=timeout)
            logger.info(f"Connected to Milvus at {milvus_host}:{milvus_port}")
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            raise

        self.index_params = index_params or {
            "index_type": "HNSW",
            "metric_type": self._milvus_metric,
            "params": {"M": 16, "efConstruction": 200}
        }

        try:
            if not utility.has_collection(self.collection_name):
                if create_if_missing:
                    logger.info(f"Collection '{self.collection_name}' not found. Creating...")
                    self._create_collection_sync()
                else:
                    raise RuntimeError(f"Collection '{self.collection_name}' not found and create_if_missing=False")

            self._col = Collection(self.collection_name)
            logger.info(f"Collection '{self.collection_name}' handle initialized.")

            self.create_index_sync(force=False)

            logger.info(f"Collection '{self.collection_name}' ready.")
        except Exception as e:
            logger.error(f"Initialization error for collection '{self.collection_name}': {e}")
            raise

    def _create_collection_sync(self):
        try:
            id_field = FieldSchema(
                name="id", dtype=DataType.VARCHAR,
                is_primary=True, max_length=128
            )
            vec_field = FieldSchema(
                name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.dim
            )
            meta_field = FieldSchema(name="metadata", dtype=DataType.JSON)
            schema = CollectionSchema(
                fields=[id_field, vec_field, meta_field],
                description=f"Collection {self.collection_name} created by VectorDB"
            )
            Collection(name=self.collection_name, schema=schema)
            self._col = Collection(self.collection_name)
            self._col.flush()
            logger.info(f"Collection '{self.collection_name}' created successfully.")
        except Exception as e:
            logger.error(f"Failed to create collection '{self.collection_name}': {e}")
            raise

    def create_index_sync(self, force: bool = False):
        try:
            field_name = "embedding"
            existing_indexes = []
            try:
                existing_indexes = utility.list_indexes(self.collection_name, field_name=field_name)
            except TypeError:
                all_indexes = utility.list_indexes(self.collection_name)
                existing_indexes = [n for n in all_indexes if field_name in n]

            if force and existing_indexes:
                for idx_name in existing_indexes:
                    self._col.drop_index(index_name=idx_name)
                    logger.info(f"Dropped old index '{idx_name}'.")

            if not existing_indexes:
                params = self.index_params.copy()
                params["metric_type"] = self._milvus_metric
                self._col.create_index(field_name=field_name, index_params=params)
                logger.info(f"Created new index on '{field_name}'.")
            else:
                logger.info(f"Index already exists on '{field_name}', skipped.")
        except Exception as e:
            logger.error(f"Create index error: {e}")
            raise

    async def upsert_vector(self, id: str, vector: Union[Sequence[float], np.ndarray], metadata: Optional[Dict[str, Any]] = None):
        try:
            vec = np.asarray(vector, dtype=np.float32)
            if vec.ndim != 1 or vec.shape[0] != self.dim:
                raise ValueError(f"Vector must be 1-D with dim={self.dim}")

            if await self.exists(id):
                await self.delete(id)

            entities = [[id], [vec.tolist()], [metadata or {}]]

            def _sync_insert():
                insert_result = self._col.insert(entities)
                self._col.flush()
                return insert_result

            insert_result = await asyncio.to_thread(_sync_insert)
            logger.info(f"Upserted vector id='{id}' successfully.")
            return insert_result
        except Exception as e:
            logger.error(f"Failed to upsert id='{id}': {e}")
            raise

    async def retrieve_similar(
        self,
        query_vector: Union[Sequence[float], np.ndarray],
        top_k: int = 5,
        expr: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
        output_fields: Optional[List[str]] = None,
    ):
        try:
            q = np.asarray(query_vector, dtype=np.float32)
            if q.ndim == 1:
                queries = [q.tolist()]
                single = True
            elif q.ndim == 2:
                queries = [row.tolist() for row in q]
                single = False
            else:
                raise ValueError("query_vector must be 1-D or 2-D")

            search_params = params or {"metric_type": self._milvus_metric, "params": {"ef": 64}}
            out_fields = output_fields or ["metadata", "id"]

            def _sync_search():
                self._col.load()
                results = self._col.search(
                    data=queries,
                    anns_field="embedding",
                    param=search_params,
                    limit=top_k,
                    expr=expr,
                    output_fields=out_fields
                )
                return results

            results = await asyncio.to_thread(_sync_search)

            formatted = []
            for res in results:
                hits = []
                for hit in res:
                    hits.append({
                        "image_id": hit.entity.get("id"),
                        "similarity": float(hit.score),
                        "metadata": hit.entity.get("metadata")
                    })
                formatted.append(hits)
            logger.info(f"Retrieve similar done for top_k={top_k}.")
            return formatted[0] if single else formatted
        except Exception as e:
            logger.error(f"Search error: {e}")
            raise

    # helpers
    async def exists(self, id: str) -> bool:
        try:
            safe_id = id.replace("'", "\\'")
            expr = f"id == '{safe_id}'"

            res = await asyncio.to_thread(self._col.query, expr=expr, output_fields=["id"])
            return len(res) > 0
        except Exception as e:
            logger.error(f"Exists check failed for id='{id}': {e}")
            return False

    async def delete(self, id: str):
        try:
            safe_id = id.replace("'", "\\'")
            expr = f"id == '{safe_id}'"

            def _sync_delete():
                res = self._col.delete(expr)
                self._col.flush()
                return res

            res = await asyncio.to_thread(_sync_delete)
            logger.info(f"Deleted id='{id}'.")
            return res
        except Exception as e:
            logger.error(f"Delete failed for id='{id}': {e}")
            raise

    async def create_index(self, force: bool = False):
        try:
            field_name = "embedding"

            def _sync_list_indexes():
                try:
                    return utility.list_indexes(self.collection_name, field_name=field_name)
                except TypeError:
                    all_indexes = utility.list_indexes(self.collection_name)
                    return [n for n in all_indexes if field_name in n]

            existing_indexes = await asyncio.to_thread(_sync_list_indexes)

            if force and existing_indexes:
                # drop indexes in thread(s)
                for idx_name in existing_indexes:
                    await asyncio.to_thread(self._col.drop_index, index_name=idx_name)
                    logger.info(f"Dropped old index '{idx_name}'.")

            if not existing_indexes:
                params = self.index_params.copy()
                params["metric_type"] = self._milvus_metric
                await asyncio.to_thread(self._col.create_index, field_name=field_name, index_params=params)
                logger.info(f"Created new index on '{field_name}'.")
            else:
                logger.info(f"Index already exists on '{field_name}', skipped.")
        except Exception as e:
            logger.error(f"Create index error: {e}")
            raise

    async def load(self):
        try:
            await asyncio.to_thread(self._col.load)
            logger.info("Collection loaded into memory.")
        except Exception as e:
            logger.error(f"Load error: {e}")
            raise

    async def release(self):
        try:
            await asyncio.to_thread(self._col.release)
            logger.info("Collection released from memory.")
        except Exception as e:
            logger.error(f"Release error: {e}")
            raise

    async def flush(self):
        try:
            await asyncio.to_thread(self._col.flush)
            logger.info("Flushed collection to disk.")
        except Exception as e:
            logger.error(f"Flush error: {e}")
            raise

if __name__ == "__main__":

    vdb = VectorDB(dim=128, milvus_host="localhost", milvus_port="19530", collection_name="images", metric="cosine")

    cat = np.random.rand(128)
    asyncio.run(vdb.upsert_vector("img_1", cat, metadata={"id": "cat_1234"}))
    results = asyncio.run(vdb.retrieve_similar(cat, top_k=3))
    print(results)
    asyncio.run(vdb.delete("img_1"))