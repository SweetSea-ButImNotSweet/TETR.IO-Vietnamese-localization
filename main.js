// ==UserScript==
// @name         TETR.IO Việt hóa
// @namespace
// @version      1.0
// @description  TETR.IO Việt Hóa
// @author       SweetSea
// @match        https://tetr.io
// @downloadURL  https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/main.js
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
    const FORCE_UPDATE_IMMEDIATELY = false; // Cập nhật ngay tức thì, dùng để kiểm tra bản dịch

    const BASE_URL = "https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main";
    const LOCALIZE_URL = `${BASE_URL}/data/localization.json`; // URL file JSON

    let STORAGE_replacements = GM_getValue("localization", {});
    let STORAGE_lastUpdate   = GM_getValue("lastUpdate", 0);

    function shouldUpdate() {
        return FORCE_UPDATE_IMMEDIATELY || Date.now() - STORAGE_lastUpdate > UPDATE_INTERVAL;
    }

    function fetchLocalization() {
        GM_xmlhttpRequest({
            method: "GET",
            url: LOCALIZE_URL,
            onload: function (response) {
                try {
                    STORAGE_replacements = JSON.parse(response.responseText);
                    GM_setValue("localization", STORAGE_replacements);
                    GM_setValue("lastUpdate", Date.now());
                } catch (e) {
                    console.error("Failed to parse localization JSON", e);
                }
            }
        });
    }
    if (shouldUpdate()) fetchLocalization();

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
        return text.split('').map(char => {
            let index = CUSTOM_ENCODING.indexOf(char);
            return index !== -1 ? String.fromCharCode(0xE000 + index) : char;
        }).join('');
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

    // Hai hàm dưới đây tự động chạy luôn, một cái là sửa `index.html`, còn lại là sửa các file khác theo FILE_TO_MODIFY
    (function modifyHTML() {
        let observer = new MutationObserver(() => {
            if (document.documentElement.innerHTML.includes("welcome back to TETR.IO")) {
                let modifiedHTML = document.documentElement.innerHTML;
                for (const [from, to] of Object.entries(STORAGE_replacements["index.html"] || {})) {
                    modifiedHTML = modifiedHTML.replaceAll(from, encodeText(to));
                }
                document.documentElement.innerHTML = modifiedHTML;
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    })();

    (function interceptRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (FILES_TO_MODIFY.some(file => args[0].includes(file))) {
                let response = await originalFetch(...args);
                let text = await response.text();
                let fileName = FILES_TO_MODIFY.find(file => args[0].includes(file));
                if (fileName && STORAGE_replacements[fileName]) {
                    for (const [from, to] of Object.entries(STORAGE_replacements[fileName])) {
                        text = text.replaceAll(from, encodeText(to));
                    }
                }
                return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
            }
            return originalFetch(...args);
        };
    })();
})();
