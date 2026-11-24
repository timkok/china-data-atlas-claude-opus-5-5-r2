# Raw evidence

| Folder | Content | In git? |
|---|---|---|
| nbs_api_cache/ | One JSON per request to the NBS 国家数据 public endpoints: URL, request body, retrieval time, full response | yes |
| manual/ | Hand transcription of 中国统计年鉴2025 表2-6 (urbanization %) with review rule | yes |
| census2020/census2020_age_by_province.csv | Parsed 第七次全国人口普查公报（第五号）表5-2 | yes |
| nbs_yearbook_2025/*.jpg, left.htm | 中国统计年鉴2025 table images used for verification (© 中国统计出版社) | **no** (local evidence / Drive only) |
| nbs_communique/*.html, census2020/*.html | Copies of official web pages used for verification | **no** (local evidence / Drive only) |

Re-acquire the excluded files: yearbook tables `https://www.stats.gov.cn/sj/ndsj/2025/html/<TABLE>.jpg` for TABLE in
C02-01 C02-04 C02-05 C02-06 C02-07 C02-11 C03-09 C06-18 C15-12 C21-14 C21-15 C22-02 C22-03 C22-06;
communiqué https://www.stats.gov.cn/sj/zxfb/202602/t20260228_1962662.html;
GDP final verification https://www.stats.gov.cn/sj/zxfb/202512/t20251226_1962144.html;
census bulletin 5 https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901085.html (save as census2020/bulletin5.html).
| provincial_communique/*.html | Beijing / Zhejiang / Shandong 2025 statistical communiqués (official bureau sites) used for verification; Henan site returned HTTP 403 → not used | **no** (local evidence / Drive only) |
