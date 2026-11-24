# Manual import (auditable)

`yearbook2025_table2-6_urbanization.csv` — 年末城镇人口比重 (%), 2015–2024, transcribed by hand from
《中国统计年鉴2025》表2-6 “分地区年末城镇人口比重” (image: ../nbs_yearbook_2025/C02-06.jpg,
source URL https://www.stats.gov.cn/sj/ndsj/2025/html/C02-06.jpg, retrieved 2026-11-24).

Why manual: the online database publishes only 万人-rounded urban and total population, so u/t loses
up to ~0.2 pp precision for small provinces; the yearbook publishes the official ratio but only as an image.

Process / review rule (enforced by `pipeline/transformations/build_observations.py` and
`pipeline/validation/quality_checks.py`):
1. One row per region, one column per year, values exactly as printed.
2. Each transcribed value is compared with u/t×100 from the database; the difference must be within the
   theoretical rounding bound 0.5/t×100×(1+u/t) + 0.005. Any violation is a quality ERROR and the value is rejected.
3. Transcribed values override derived values only for those years; automated updates never overwrite them.
