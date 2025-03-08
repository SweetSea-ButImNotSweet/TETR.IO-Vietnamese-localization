// ==UserScript==
// @name         TETR.IO Việt hóa
// @namespace
// @version      1.0
// @description  TETR.IO Việt Hóa
// @author       SweetSea
// @match        https://tetr.io
// @downloadURL  https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/main.js
// @updateURL    https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/main.js
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    const FILES_TO_MODIFY = ["tetrio.js"]; // Những file cần dịch, lưu ý theo mặc định: `index.html` sẽ luôn được dịch

    const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // Nên cập nhật lại file sau mỗi 24h
    const FORCE_UPDATE_IMMEDIATELY = true; // Cập nhật ngay tức thì, dùng để kiểm tra bản dịch
    const SHOW_LOCALIZATION_STORAGE = true;

    const BASE_URL = "https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main";
    const LOCALIZE_URL = `${BASE_URL}/data/localization.json5`;

    let STORAGE_replacements = GM_getValue("localization", {});
    let STORAGE_lastUpdate = GM_getValue("lastUpdate", 0);

    // Thư viện JSON5
    <script type="module">
        import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs'
    </script>

    function shouldUpdate() {
        return FORCE_UPDATE_IMMEDIATELY || Date.now() - STORAGE_lastUpdate > UPDATE_INTERVAL;
    }

    // Dùng để sắp xếp lại dữ liệu từ điển trước khi đem ra dùng
    function sortTranslationData(data) {
        for (let [file, translation] of Object.entries(data)) {
            data[file] = Object.fromEntries(
                Object.entries(translation).sort(([eng1,], [eng2,]) => {
                    // Sắp xếp cái từ điển theo độ dài của câu gốc trong tiếng Anh
                    // Để tránh trường hợp từ dài bị ghi đè bởi từ ngắn
                    const eng1L = Array.isArray(eng1) ? eng1.join("").length : eng1.length;
                    const eng2L = Array.isArray(eng2) ? eng2.join("").length : eng2.length;
                    return eng2L - eng1L;
                }
                )
            )
        };
    }

    function fetchLocalization() {
        GM_xmlhttpRequest({
            method: "GET",
            url: LOCALIZE_URL,
            onload: function (response) {
                try {
                    STORAGE_replacements = JSON5.parse(response.responseText);
                    sortTranslationData(STORAGE_replacements);
                    console.log("TETR.IO Việt hóa - Đã lấy từ điển mới và sắp xếp lại:", STORAGE_replacements);

                    GM_setValue("localization", STORAGE_replacements);
                    GM_setValue("lastUpdate", Date.now());
                } catch (e) {
                    console.error("TETR.IO Việt hóa - Có gì đó sai sai với cái file JSON rồi", e);
                }

                if (SHOW_LOCALIZATION_STORAGE) {
                    console.log("TETR.IO Việt hóa - Bộ nhớ:", GM_getValue("localization", "[TRỐNG]"))
                };
            }
        });
    }

    function checkForRecentUpdatesFromOriginalHost(filename, theirdata) {
        let previousFileData = GM_getValue(`previousOriginalData_${filename}`, "");
        if (FORCE_UPDATE_IMMEDIATELY || (filename && STORAGE_replacements[filename] && previousFileData !== theirdata)) {
            console.log(`TETR.IO Việt hóa - Đã cập nhật ${filename} từ máy chủ gốc`);
            GM_setValue(`previousOriginalData_${filename}`, theirdata);

            sortTranslationData(STORAGE_replacements);
            for (const [from, to] of Object.entries(STORAGE_replacements[filename])) {
                theirdata = theirdata.replaceAll(from, encodeText(to));
            }
        }
        return theirdata;
    }

    if (shouldUpdate()) {
        fetchLocalization();
    }

    const CUSTOM_ENCODING = [
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
    ];
    function encodeText(text) {
        if (Array.isArray(text)) {
            return text.map((item, index) => {
                if (index % 2 === 0 && typeof item === 'string') {
                    item = encodeText(item);
                }
                return item;
            }).join('');
        } else if (typeof text === 'string') {
            return text.split('').map(char => {
                let index = CUSTOM_ENCODING.indexOf(char);
                return index !== -1 ? String.fromCharCode(0xE000 + index) : char;
            }).join('');
        }
    }


    (function loadFont() {
        // Nạp font chữ dày trước
        let font1 = new FontFace('LocalizedFont', `url(${BASE_URL}/font/fontFile.ttf)`);
        font1.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
        }).catch((err) => {
            console.error("TETR.IO Việt hóa - LỖI tải font chữ đậm:", err);
            return;
        });

        // Rồi nạp font chữ mỏng hơn
        let font2 = new FontFace('LocalizedFontThin', `url(${BASE_URL}/font/fontFile_thin.ttf)`);
        // Rồi mới load cả hai font và ép CSS
        font2.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            GM_addStyle(`* { font-family: 'HUN', 'LocalizedFont', 'LocalizedFontThin', sans-serif !important; }`);
            GM_setValue("fontLoaded", true);
        }).catch((err) => {
            console.error("TETR.IO Việt hóa - LỖI tải font chữ mỏng:", err);
        });
    })();

    let safeToLocalizeString = false;
    // Hai hàm dưới đây tự động chạy luôn, một cái là sửa `index.html`, còn lại là sửa các file khác theo FILE_TO_MODIFY
    (function modifyHTML() {
        let observer = new MutationObserver(() => {
            if (document.documentElement.innerHTML.includes("welcome back to TETR.IO")) {
                let modifiedHTML = checkForRecentUpdatesFromOriginalHost("index.html", document.documentElement.innerHTML);
                document.documentElement.innerHTML = modifiedHTML;
                observer.disconnect();
                safeToLocalizeString = true;
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    })();

    (function interceptRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (safeToLocalizeString && FILES_TO_MODIFY.some(file => args[0].includes(file))) {
                let response = await originalFetch(...args);
                let fileName = FILES_TO_MODIFY.find(file => args[0].includes(file));
                let text = checkForRecentUpdatesFromOriginalHost(fileName, await response.text());
                return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
            }
            return originalFetch(...args);
        };
    })();
})();