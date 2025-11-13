from typing import List
import random
from datetime import datetime
from schemas import Review, ReviewFilter

def filter_representative_reviews(reviews: List[Review]) -> List[Review]:
    """Filter representative reviews based on criteria."""
    filter_params = ReviewFilter() 
    filtered = [
        r for r in reviews
        if (filter_params.min_rating <= r.rating <= filter_params.max_rating)
        and (not filter_params.verified_only or (r.verified_purchase or False))
        and (not filter_params.date_from or r.date >= filter_params.date_from)
    ]

    if not filtered:
        return []


    positive = [r for r in filtered if r.rating >= 4]
    neutral = [r for r in filtered if r.rating == 3]
    negative = [r for r in filtered if r.rating <= 2]

    total = len(filtered)
    max_reviews = min(filter_params.max_reviews_per_product, total)

    def sample(reviews, count):
        return random.sample(reviews, min(count, len(reviews))) if reviews else []

    pos_n = int(max_reviews * (len(positive) / total))
    neu_n = int(max_reviews * (len(neutral) / total))
    neg_n = int(max_reviews * (len(negative) / total))

    selected = sample(positive, pos_n) + sample(neutral, neu_n) + sample(negative, neg_n)
    return selected[:max_reviews]
