# MAP_COMPLIANCE_RESEARCH

Date: 2026-11-24. Status: **geographic map NOT implemented**; non-geographic region matrix shipped; replaceable adapter interface provided (`app/src/components/mapAdapter.ts`).

## Sources consulted
| Source | Access | Finding |
|---|---|---|
| Web search on 天地图 / 标准地图 usage (result pages from tianditu.gov.cn regional portals, Beijing standard-map page, Tianjin user manual, MNR standard map site) | search results only | Standard maps may be browsed and downloaded free; when used directly the 审图号 must be shown; if the map is edited (scaled, cropped, or otherwise modified) it must be submitted for review before public use (Beijing page). Tianjin manual: show 审图号, do not modify map content without authorisation. Tianditu API requires a developer key; services follow OGC WMTS. |
| http://lbs.tianditu.gov.cn/server/MapService.html, http://lbs.tianditu.gov.cn/home.html, http://bzdt.ch.mnr.gov.cn/, http://lbs.tianditu.gov.cn/server/administrative2.html | **unreachable from this execution environment (connection failure, HTTP 000)** | Terms of service text could not be read directly → not verified |

## Candidate approaches
| | A. Tianditu (天地图) WMTS base map + Tianditu administrative-division service | B. MNR standard map image (标准地图) + thematic overlay | C. Non-geographic region matrix (shipped) |
|---|---|---|---|
| Licence | developer key (account → needs user authorisation); terms not verified here | free browse/download; must show 审图号 | none needed |
| Dynamic province colouring | requires using boundary geometry; whether colouring Tianditu boundaries counts as “editing” needing review: **unresolved** | colouring = editing → **review required** before public use | allowed |
| Review (审图) | likely required for a published thematic map | required after modification | not a map |
| Cost | free tier (quota not verified) | free | free |
| Mainland access | domestic service | domestic | static site; mainland access not verified |
| Overseas hosting | Tianditu use from overseas hosting: not verified | n/a | fine |
| HK/MO/TW | base map must show complete national territory as on the standard map; statistics coverage note required | same | coverage note shown on every page |

## Recommendation
1. Keep C now. 2. To ship a real map: (a) the user registers a Tianditu developer key; (b) use the unmodified Tianditu base map + official boundary service, display Tianditu logo and the base map’s 审图号; (c) obtain written confirmation from the provincial surveying & mapping authority whether a statistical choropleth over that base requires separate review — if yes, submit the thematic map for 审图; (d) host where mainland access requirements (ICP) are met if mainland users are targeted. 3. Plug the result into `ProvinceMapAdapter` (`isGeographic: true`, `licenceConfirmed: true`, `reviewNumber: 'GS(…)'`); the UI already supports colour classes, year switch, hover, click, legend, missing values.

## Open legal / licence questions
Tianditu ToS text (could not be fetched); whether choropleth colouring = map editing; quota/cost; mainland deployment ICP; display rules for coverage notes.
No unverified GeoJSON was used; no 审图号 was invented.
