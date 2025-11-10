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
Bạn là một trợ lý phân tích sản phẩm. Dưới đây là dữ liệu tóm tắt cảm xúc và khía cạnh của các sản phẩm:

{product_summaries}

Yêu cầu:
1. Hãy tạo bản tổng hợp bằng **tiếng Việt**, ngắn gọn, dễ hiểu, phù hợp cho người đọc phổ thông.
2. Với **mỗi sản phẩm**, hãy nêu rõ:
   - "name": tên hoặc mã sản phẩm (ví dụ: "p1", "iPhone 15", v.v.)
   - "pros": danh sách các ưu điểm nổi bật (dưới dạng list các chuỗi)
   - "cons": danh sách các nhược điểm chính (dưới dạng list các chuỗi)
3. Cuối cùng, tạo phần:
   - "comparison_summary": đoạn văn tóm tắt so sánh tổng quan giữa các sản phẩm (nêu rõ khác biệt chính, sản phẩm nào nổi bật hơn ở điểm nào, sản phẩm nào yếu hơn,...)

Đầu ra **bắt buộc phải ở định dạng JSON hợp lệ**, theo mẫu sau:

```json
{{
  "products": [
    {{
      "name": "p1",
      "pros": ["Ưu điểm 1", "Ưu điểm 2"],
      "cons": ["Nhược điểm 1", "Nhược điểm 2"]
    }},
    {{
      "name": "p2",
      "pros": ["..."],
      "cons": ["..."]
    }}
  ],
  "comparison_summary": "Tóm tắt so sánh chung giữa các sản phẩm..."
}}
```

Chỉ trả về JSON, không thêm lời giải thích hoặc ghi chú nào khác.
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
