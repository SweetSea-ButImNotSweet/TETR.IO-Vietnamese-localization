import copy
from fontTools.ttLib import TTFont

# Đường dẫn file font nguồn và font đích
source_font_path = "MplusCodeLatin50-Regular.ttf"  # Thay bằng file font nguồn của bạn
dest_font_path   = source_font_path                # Thay bằng file font đích của bạn
output_font_path = "dest_with_vietnamese_pua.ttf"  # File font đích sau khi chỉnh sửa

# Mở hai file font
source_font = TTFont(source_font_path)
dest_font = TTFont(dest_font_path)

# Danh sách các ký tự tiếng Việt (precomposed)
vietnamese_chars = [
    'A', 'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ', 'Â', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ',
    'B', 'C', 'D', 'Đ', 'E', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ê', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ',
    'G', 'H', 'I', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị', 'K', 'L', 'M', 'N', 'O', 'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ',
    'Ô', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ', 'Ơ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ',
    'P', 'Q', 'R', 'S', 'T', 'U', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ư', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự',
    'V', 'X', 'Y', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
    'a', 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ',
    'b', 'c', 'd', 'đ', 'e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ',
    'g', 'h', 'i', 'ì', 'í', 'ỉ', 'ĩ', 'ị', 'k', 'l', 'm', 'n', 'o', 'ò', 'ó', 'ỏ', 'õ', 'ọ',
    'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ',
    'p', 'q', 'r', 's', 't', 'u', 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự',
    'v', 'x', 'y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'
]

# Lấy bảng cmap của font nguồn: mapping từ mã Unicode sang tên glyph
source_cmap = source_font.getBestCmap()

# Truy cập bảng glyf và hmtx của hai font
source_glyf = source_font["glyf"]
dest_glyf = dest_font["glyf"]
source_hmtx = source_font["hmtx"]
dest_hmtx = dest_font["hmtx"]

# Tìm subtable cmap của font đích cho Windows Unicode BMP (platformID=3, encodingID=1)
dest_cmap_table = None
for table in dest_font["cmap"].tables:
    if table.platformID == 3 and table.platEncID == 1:
        dest_cmap_table = table
        break

if dest_cmap_table is None:
    raise ValueError("Font đích không có bảng cmap cho Windows Unicode BMP (platformID=3, encodingID=1).")

# Khởi tạo mã Unicode bắt đầu ở vùng PUA (0xE000)
pua_code = 0xE000

for char in vietnamese_chars:
    code_point = ord(char)
    # Nếu font nguồn không có glyph cho ký tự này, bỏ qua
    if code_point not in source_cmap:
        print(f"Không tìm thấy glyph cho ký tự {char} trong font nguồn.")
        continue
    glyph_name = source_cmap[code_point]

    # Nếu glyph chưa có trong font đích, sao chép từ font nguồn
    if glyph_name not in dest_glyf.glyphs:
        # Sao chép sâu glyph từ font nguồn sang font đích
        dest_glyf.glyphs[glyph_name] = copy.deepcopy(source_glyf[glyph_name])
        # Sao chép các thông số horizontal metrics nếu có
        if glyph_name in source_hmtx.metrics:
            dest_hmtx.metrics[glyph_name] = source_hmtx.metrics[glyph_name]

    # Thêm mapping mới: mã PUA -> tên glyph
    dest_cmap_table.cmap[pua_code] = glyph_name
    print(f"Mapping {char} (glyph: {glyph_name}) sang U+{pua_code:04X}")
    pua_code += 1

# Lưu font đích mới
dest_font.save(output_font_path)
print(f"Đã lưu font mới vào {output_font_path}")
