from langchain_openai import ChatOpenAI
from langchain_core.prompts.chat import ChatPromptTemplate

from langchain_core.output_parsers.json import JsonOutputParser
from langchain_core.output_parsers.string import StrOutputParser
import asyncio
import os
from schemas import Product
from typing import Dict, Any
import json
from .prompt import SUMMARY_PROMPT, ANALYSIS_PROMPT, TEXT2CONSTRAINT_PROMPT

from logger import file_logger as logger

class LLMEngine:
    def __init__(self, openai_api_key: str, model: str = "gpt-4o-mini", temperature: float = 0):
        """Initialize optimized LLM pipeline."""
        self.llm = ChatOpenAI(
            model_name=model,
            openai_api_key=openai_api_key,
            temperature=temperature,
        )

        # Define prompts
        self.summary_prompt = ChatPromptTemplate.from_template(SUMMARY_PROMPT)
        self.analysis_prompt = ChatPromptTemplate.from_template(ANALYSIS_PROMPT)
        self.text2constraint = ChatPromptTemplate.from_template(TEXT2CONSTRAINT_PROMPT)

        # Build LCEL-style chains
        self.summarize_chain = self.summary_prompt | self.llm | JsonOutputParser()
        self.analyze_chain = self.analysis_prompt | self.llm | JsonOutputParser()
        self.text2constraint_chain = self.text2constraint | self.llm | JsonOutputParser()

    async def analyze_product(self, product: Product) -> Dict[str, Any]:
        """Analyze all reviews for a given product asynchronously."""
        try:
            reviews_text = product.reviews
            if not reviews_text:
              output = {
                "aspects": [],
                "satisfaction_rate": 0,
                "summary": "Không có đánh giá người dùng để phân tích."
              }
            else:
              output = await self.analyze_chain.ainvoke({
                  "product_name": product.name,
                  "reviews": reviews_text
              })
            return output
        except Exception as e:
            logger.error(f"Failed to analyze review because of {e}.")

    async def compare_products(self, analyzed_products: Dict[str, Dict[str, Any]]) -> str:
        """
        Compare multiple analyzed products (aspects + summaries)
        and return a high-level comparative summary.
        """
        try:
            product_summaries = "\n\n".join(
                [
                    f"{name}:\n{json.dumps([a.dict() for a in summary], indent=2)}"
                    for name, summary in analyzed_products.items()
                ]
            )
            return await self.summarize_chain.ainvoke({
                "product_summaries": product_summaries
            })
        except Exception as e:
            logger.error(f"Failed to compare products because of {e}.")

    async def extract_constraints_from_query(self, user_query: str) -> dict:
        try:
            response = await self.text2constraint_chain.ainvoke({
                "user_query": user_query
            })
            return response
        except Exception as e:
            logger.error(f"Failed to extract constraint from query because of {e}.")

# Example usage
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(dotenv_path="local.env")
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    async def main():
        text = "Tôi cần laptop lập trình, pin tốt, dưới 15 triệu, thương hiệu Asus hoặc Dell"
        engine = LLMEngine(openai_api_key=openai_api_key)
        # result = await engine.analyze_product(product)
        result = await engine.extract_constraints_from_query(text)
        print(result)

    asyncio.run(main())
