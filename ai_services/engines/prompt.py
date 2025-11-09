ANALYSIS_PROMPT = """
Bạn là một chuyên gia phân tích sản phẩm.
Phân tích các đánh giá của người dùng cho sản phẩm **{product_name}**.

1. Xác định các khía cạnh quan trọng (pin, camera, hiệu năng, thiết kế, v.v.)
2. Đánh giá cảm xúc của từng khía cạnh (-1 đến 1)
3. Cung cấp 1-2 trích dẫn minh họa.
4. Viết tóm tắt ngắn gọn cho từng khía cạnh.
5. Ước lượng mức độ hài lòng chung (0-100%), được tính bằng trung bình rating.

Đánh giá:
{reviews}

Trả về **một đối tượng JSON hợp lệ duy nhất**, không lặp key, không Markdown, tất cả bằng tiếng Việt.

Output:
{{
  "aspects": [
    {{"aspect": "...", "sentiment": 0.8, "summary": "...", "key_quotes": ["...", "..."]}}
  ],
  "satisfaction_rate": 87,
  "summary": "Tóm tắt chi tiết về sản phẩm"
}}
"""


SUMMARY_PROMPT = """
So sánh các sản phẩm sau dựa trên cảm xúc theo khía cạnh và tóm tắt:

{product_summaries}

Hãy tạo ra **một bản tóm tắt ngắn gọn bằng tiếng Việt**, thân thiện với người đọc, nêu rõ: ưu điểm, nhược điểm và sự khác biệt chính giữa các sản phẩm.
"""

TEXT2QUERY_PROMPT = """
Bạn là trợ lý mua sắm.
Trích xuất các sở thích mua sắm từ tin nhắn người dùng sau:

Tin nhắn: "{user_query}"

Hãy trả về **một đối tượng JSON hợp lệ** với:
- Không lặp key
- Không dùng định dạng markdown
- Sử dụng kiểu dữ liệu chuẩn (string, số, mảng)

Ví dụ cấu trúc JSON:
```json
{{
    "category": "Laptop",       // loại sản phẩm
    "budget": 1500.0,           // nếu có, nếu không thì null
    "brands": ["Apple", "Dell"],
    "features": ["màn hình lớn", "pin lâu"],
    "intent": "Mua để học tập và làm việc"
}}
```
"""


TEXT2CONSTRAINT_PROMPT = """
Bạn là trợ lý mua sắm.
Trích xuất các sở thích mua sắm từ tin nhắn người dùng sau:

Tin nhắn: "{user_query}"

Hãy trả về **một đối tượng JSON hợp lệ** với:
- Không lặp key
- Không dùng định dạng markdown
- Sử dụng kiểu dữ liệu chuẩn (string, số, mảng)

Ví dụ cấu trúc JSON:
```json
{{
    "category": "Laptop",       // loại sản phẩm
    "budget": 1500.0,           // nếu có, nếu không thì null
    "expression": "More"        // trả về "More", "Less" tùy vào tin nhắn của người dùng về budget, nếu không thì null 
}}
```

Ví dụ: 
Tin nhắn: Tôi muốn mua macbook air trên 10 triệu
Output: 
{{
    "category": "Laptop",       
    "budget": 10000000.0,       
    "expression": "More"       
}}
"""
