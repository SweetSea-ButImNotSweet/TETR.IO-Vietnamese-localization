import copy
from fontTools.ttLib import TTFont

# Đường dẫn file font nguồn và font đích
source_font_path = "tools/font_mix_2.otf"  # Thay bằng file font nguồn của bạn
dest_font_path   = source_font_path                # Thay bằng file font đích của bạn
output_font_path = "font_mix_2.otf"  # File font đích sau khi chỉnh sửa

# --- MỞ FONT ---
source_font = TTFont(source_font_path)
dest_font   = TTFont(dest_font_path)

# --- DANH SÁCH KÝ TỰ TIẾNG VIỆT (precomposed) ---
vietnamese_chars = [
    'A', 'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ', 'Â', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ',
    'B', 'C', 'D', 'Đ', 'E', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ê', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ',
    'G', 'H', 'I', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị', 'K', 'L', 'M', 'N', 'O', 'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ',
    'Ô', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ', 'Ơ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ',
    'P', 'Q', 'R', 'S', 'T', 'U', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ư', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự',
    'V', 'X', 'Y', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
    # 'a', 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ',
    # 'b', 'c', 'd', 'đ', 'e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ',
    # 'g', 'h', 'i', 'ì', 'í', 'ỉ', 'ĩ', 'ị', 'k', 'l', 'm', 'n', 'o', 'ò', 'ó', 'ỏ', 'õ', 'ọ',
    # 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ',
    # 'p', 'q', 'r', 's', 't', 'u', 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự',
    # 'v', 'x', 'y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'
]

# --- LẤY bảng cmap của font nguồn ---
# Đây là mapping từ codepoint -> glyph name
source_cmap = source_font.getBestCmap()

# --- XÁC ĐỊNH BẢNG OUTLINE (glyph outlines) ---
# Với TTF, sử dụng bảng "glyf"; với OTF, sử dụng bảng "CFF ".
if "glyf" in source_font:
    source_outlines = source_font["glyf"].glyphs
else:
    source_outlines = source_font["CFF "].cff.topDictIndex[0].CharStrings

if "glyf" in dest_font:
    dest_outlines = dest_font["glyf"].glyphs
else:
    dest_outlines = dest_font["CFF "].cff.topDictIndex[0].CharStrings

# --- LẤY bảng hmtx nếu có ---
source_hmtx = source_font["hmtx"] if "hmtx" in source_font else None
dest_hmtx   = dest_font["hmtx"] if "hmtx" in dest_font else None

# --- LẤY cmap SUBTABLE cho Windows BMP (platformID=3, platEncID=1) ở font đích ---
dest_cmap_table = None
for table in dest_font["cmap"].tables:
    if table.platformID == 3 and table.platEncID == 1:
        dest_cmap_table = table
        break
if dest_cmap_table is None:
    raise ValueError("Font đích không có bảng cmap cho Windows Unicode BMP.")

# --- BƯỚC 1: THỰC HIỆN MAPPING ---
# Giả sử vùng PUA đã được dọn sạch, ta sẽ mapping các glyph tiếng Việt từ font nguồn vào font đích
mapping_code = 0xE059
for char in vietnamese_chars:
    cp = ord(char)
    if cp not in source_cmap:
        print(f"Glyph cho ký tự {char} không có trong font nguồn.")
        continue
    glyph_name = source_cmap[cp]
    # Nếu glyph chưa có trong font đích, copy từ font nguồn (bao gồm outline và hmtx nếu có)
    if glyph_name not in dest_outlines:
        dest_outlines[glyph_name] = copy.deepcopy(source_outlines[glyph_name])
        if source_hmtx is not None and dest_hmtx is not None and glyph_name in source_hmtx.metrics:
            dest_hmtx.metrics[glyph_name] = source_hmtx.metrics[glyph_name]
    # Tìm mã PUA trống (vì vùng đã dọn sạch, nên mapping_code không bị trùng)
    while mapping_code in dest_cmap_table.cmap:
        mapping_code += 1
    dest_cmap_table.cmap[mapping_code] = glyph_name
    print(f"Mapping ký tự {char} (glyph: {glyph_name}) vào U+{mapping_code:04X}")
    mapping_code += 1

# --- LƯU FONT MỚI ---
dest_font.save(output_font_path)
print(f"Đã lưu font mới vào {output_font_path}")