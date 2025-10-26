// ==UserScript==
// @name         TETR.IO Việt hóa
// @namespace
// @version      1.0
// @description  TETR.IO Việt Hóa
// @author       SweetSea
// @match        https://tetr.io/*
// @downloadURL  https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/tetrioviethoa.user.js
// @updateURL    https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/tetrioviethoa.user.js

// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest

// @connect      https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/*
// @require      https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main/lib/json5.js
// ==/UserScript==


(function () {
    'use strict';

    // Xả phần tên miền với đường dẫn ra
    function extractDomainAndPath(url) {
        const regex = /https?:\/\/([^\/]+)\/([^?]+)/;
        const match = url.match(regex);

        if (match) {
            return [match[1], match[2]];
        } else {
            return null;
        }
    }

    // (function interceptRequests() {
    //     const originalFetch = window.fetch;
    //     window.fetch = async (...args) => {
    //         if (safeToLocalizeString && FILES_TO_MODIFY.some(file => args[0].includes(file))) {
    //             let response = await originalFetch(...args);
    //             let fileName = FILES_TO_MODIFY.find(file => args[0].includes(file));
    //             let clone = response.clone();
    //             let text = translateFile(fileName, await clone.text());
    //
    //             const headers = new Headers(response.headers);
    //             headers.delete("content-encoding");
    //             headers.delete("content-length");
    //             return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
    //         }
    //         return originalFetch(...args);
    //     };
    // })();

    const BASE_URL = "https://raw.githubusercontent.com/SweetSea-ButImNotSweet/TETR.IO-Vietnamese-localization/refs/heads/main";
    const LOCALIZE_URL = `${BASE_URL}/data/localization.json5`;
    const FONT_URL = `${BASE_URL}/font/fontFile.otf`;

    const FILES_NEED_TO_MODIFY_FROM_LOCALIZATION_DATABASE = ["js/tetrio.js"]; // Những file cần dịch, lưu ý theo mặc định: `index.html` sẽ luôn được dịch

    const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // Nên cập nhật lại file sau mỗi 24h
    const FORCE_UPDATE_IMMEDIATELY = true; // Cập nhật ngay tức thì, dùng để kiểm tra bản dịch
    const SHOW_LOCALIZATION_STORAGE = true;

    let STORAGE_replacements = GM_getValue("localization", {});
    let STORAGE_lastUpdate = GM_getValue("lastUpdate", 0);

    const XHR = unsafeWindow.XMLHttpRequest;
    const XHRrealSend = XHR.prototype.send;
    const XHRrealOpen = XHR.prototype.open;




    // Ghi đè XHRHttpRequest để thêm cơ chế khóa, để có thời gian kiểm tra, và cập nhật bản dịch mới
    (function modifyXHRHttpRequest() { // CHẠY LUÔN
        /*
        Nhiều bạn sẽ hỏi là: tại sao tui vừa ghi đè cả `send` và `onLoad`, nhưng lại không đụng chạm gì tới `open`?
        Có 3 lí do chính:
            - `open` thật ra chỉ là tạo object XHL, và truyền trước các tham số URL, và các option khác
            - Nếu ghi đè ngay từ `open`, thì callback `onLoad` của tui sẽ không bao giờ được gọi, bởi vì...
                callback đó có thể bị ghi đè (meow >_<)
            - Cuối cùng, `send` mới là hàm quyết định tải dữ liệu về, và hàm này luôn gọi cuối cùng sau khi configure xong,
                nên tui mới quyết định override `send` để override luôn `onLoad`
        */

        unsafeWindow.XMLHttpRequest.prototype.send = function (...args) {
            const realOnLoadFunction = this.onload;
            this.onload = function () {
                if (this.responseURL) {
                    const [hostDomain, fileParameter] = extractDomainAndPath(this.responseURL);
                    console.log("TETR.IO Việt hóa - TETR.IO đang tải từ:", this.responseURL);
                    if (hostDomain == "tetr.io" && this.status === 200) {
                        if (FILES_NEED_TO_MODIFY_FROM_LOCALIZATION_DATABASE.includes(fileParameter)) {
                            if (!checkedLocalizationUpdate) checkLocalizationUpdate();

                            let temp = translateFile(fileParameter, this.responseText);
                            // Little hack: phải bật lại quyền writable thì mới có thể thay content :')
                            Object.defineProperty(this, "responseText", { writable: true });
                            this.responseText = temp;
                        }
                    }
                }
                // Vẫn gọi lại hàm gốc, hàm mình chỉ sửa bản dịch khi response báo OK (200)
                realOnLoadFunction.call(this);
            }

            return XHRrealSend.apply(this, args);
        }

        unsafeWindow.XMLHttpRequest.prototype.open = function (...args) {
            console.log("TETR.IO Việt hóa - TETR.IO [open] đang tải từ:", args[1]);
            XHRrealOpen.apply(this, args);
        }
    })();


    let safeToLocalizeString = false; // Nếu biến này là `false`, thì khả năng cao là Clouldflare đang hiện trang "Checking your browser before accessing tetr.io."
    // Hai hàm dưới đây tự động chạy luôn, một cái là sửa `index.html`, còn lại là sửa các file khác theo FILE_TO_MODIFY
    function modifyHTML() {
        let observer = new MutationObserver(() => {
            if (document.documentElement.innerHTML.includes("welcome back to TETR.IO")) {
                let modifiedHTML = translateFile("index.html", document.documentElement.innerHTML);
                document.documentElement.innerHTML = modifiedHTML;
                safeToLocalizeString = true;
            }
            observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };

    let checkedLocalizationUpdate = false
    function checkLocalizationUpdate() {
        if (
            FORCE_UPDATE_IMMEDIATELY
            || Date.now() - STORAGE_lastUpdate > UPDATE_INTERVAL
        ) {
            return new Promise(
                (resolve, reject) => {
                    // Lấy bản dịch + xử lí data trước
                    GM_xmlhttpRequest({
                            method: "GET",
                            url: LOCALIZE_URL,
                            onload: (response) => {
                                try {
                                    let sortedData = JSON5.parse(response.responseText);
                                    sortTranslationData(sortedData);
                                    console.log("TETR.IO Việt hóa - Đã lấy từ điển mới và sắp xếp lại:", sortedData);

                                    STORAGE_replacements = sortedData
                                    GM_setValue("localization", sortedData)
                                    GM_setValue("lastUpdate", Date.now())
                                    // Nếu data xong rồi, thì cho dịch HTML trước
                                    modifyHTML();
                                } catch (e) {
                                    console.error("TETR.IO Việt hóa - Có gì đó sai sai với cái file JSON rồi", e, response.responseText);
                                    reject()
                                }

                                if (SHOW_LOCALIZATION_STORAGE) {
                                    console.log("TETR.IO Việt hóa - Bộ nhớ:", GM_getValue("localization", "[TRỐNG]"))
                                };
                            }
                        })
                    checkedLocalizationUpdate = true
                    resolve()
                }
            )
        }
    };

    // Dùng để sắp xếp lại dữ liệu từ điển trước khi đem ra dùng
    function sortTranslationData(data) {
        for (let [file, translation] of Object.entries(data)) {
            data[file] = Object.fromEntries(
                Object.entries(translation).sort(([eng1,], [eng2,]) => {
                    // Sắp xếp cái từ điển theo độ dài của câu gốc trong tiếng Anh
                    // Để tránh trường hợp từ dài bị ghi đè bởi từ ngắn
                    return eng2.length - eng1.length;
                })
            )
        };
    }

    function translateFile(filename, theirdata) {
        // let previousFileData = GM_getValue(`previousOriginalData_${ filename } `, ""); // Cache trước đó
        // if (FORCE_UPDATE_IMMEDIATELY || (filename && STORAGE_replacements[filename] && previousFileData !== theirdata)) {
        // }

        if (!theirdata || typeof theirdata !== "string") return theirdata;

        if (STORAGE_replacements[filename]) {
            for (const [from, to] of Object.entries(STORAGE_replacements[filename])) {
                theirdata = theirdata.replaceAll(from, encodeText(to));
            }
            // } else if (FILES_NEED_TO_MODIFY_FROM_LOCALIZATION_FILES[filename]) {
            //     GM_xmlhttpRequest({
            //         method: "GET",
            //         url: FILES_NEED_TO_MODIFY_FROM_LOCALIZATION_FILES[filename],
            //         onload: function (response) {
            //             theirdata = response.responseText;
            //         }
            //     });
        }
        return theirdata;
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
                if (index % 2 === 1 && typeof item === 'string') {
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
    // Unused in main script, only used for testing
    function decodeText(text) {
        return text.split('').map(char => {
            let index = char.charCodeAt(0) - 0xE000;
            return index >= 0 && index < CUSTOM_ENCODING.length ? CUSTOM_ENCODING[index] : char;
        }).join('');
    }


    (function loadFont() {
        let font = new FontFace('LocalizedFont', `url(${FONT_URL})`);
        // Rồi mới load cả hai font và ép CSS
        font.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            GM_addStyle(`* { font-family: 'HUN', 'LocalizedFont', sans-serif !important; } `);
            GM_setValue("fontLoaded", true);
        }).catch((err) => {
            console.error("TETR.IO Việt hóa - LỖI tải font Việt hóa:", err);
        });
    })();

    const TETRIOVIETHOA = {
        clearAllData: function () {
            // Dùng GM_listValue kiểm tra toàn bộ dữ liệu đã lưu, sau đó loop qua từng phần tử để xóa
            let allKeys = GM_listValues();
            for (let key of allKeys) {
                GM_deleteValue(key);
            }
        },
        forceUpdate: function () {
            checkLocalizationUpdate();
        },
        getConvertedText: function (text) {
            return encodeText(text);
        },
        getOriginalText: function (text) {
            return decodeText(text);
        },
        XMLHttpRequest: unsafeWindow.XMLHttpRequest,
    };
    unsafeWindow.TVH = unsafeWindow.TETRIOVIETHOA = TETRIOVIETHOA;
})();