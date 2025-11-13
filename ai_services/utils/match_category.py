from typing import List
from schemas import Product, AccessorySuggestion

def match_products(products: List[Product], constraints: dict) -> List[AccessorySuggestion]:
    matched = []

    budget = constraints.get("budget")
    brands = [b.lower() for b in constraints.get("brands", [])]
    category = (constraints.get("category") or "").lower()
    features = [f.lower() for f in constraints.get("features", [])]

    for p in products:
        score = 0

        # Safe handling for None values
        p_category = (p.category or "").lower()
        p_brand = (p.brand or "").lower()
        p_description = (p.description or "").lower()

        if category and category in p_category:
            score += 2

        if brands and any(b in p_brand for b in brands):
            score += 1

        if features and any(f in p_description for f in features):
            score += 1
        if budget is not None and p.price is not None:
            expression = "Less" if p.price <= budget else "More"
        else:
            expression = None

        matched.append((score, AccessorySuggestion(id=p.id, name=p.name, expression=expression)))

    # sort top k
    matched.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matched[:3]]
