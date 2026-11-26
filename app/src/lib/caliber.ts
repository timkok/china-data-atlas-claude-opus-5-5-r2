// Known caliber (统计口径) changes shown on trend charts. Each entry is documented in LIMITATIONS.md / methodology.
export const CALIBER_BREAKS: Record<string, { year: number; short: string; note: string }[]> = {
  population: [{ year: 2020, short: "七普", note: "第七次全国人口普查年份（普查标准时点为2020年11月1日零时；年末常住人口为推算数）。" }],
  urbanization_rate: [{ year: 2020, short: "七普", note: "第七次全国人口普查年份。" }],
  population_65plus: [{ year: 2020, short: "七普", note: "2020年为第七次人口普查数据，其他年份为人口变动抽样调查样本数据（抽样比约1‰），抽样误差较大，年际波动需谨慎解读。" }],
  gdp: [{ year: 2023, short: "五经普", note: "2023年GDP根据第五次全国经济普查结果修订；本平台使用数据库中的最新版本。最新年份为初步核算数。" }],
  gdp_per_capita: [{ year: 2023, short: "五经普", note: "随GDP修订而修订；最新年份为初步核算数。" }],
  higher_education_students: [{ year: 2021, short: "含职业本科", note: "官方口径调整为“普通、职业本专科”，包含职业本科在校生。" }],
  higher_education_institutions: [{ year: 2021, short: "含职业本科", note: "官方口径调整为“普通、职业高等学校”，包含职业本科学校。" }],
  disposable_income: [{ year: 2013, short: "一体化调查", note: "2013年起实施城乡一体化住户收支与生活状况调查，此前无全体居民口径，本平台不拼接旧口径。" }],
};

// Regional aggregation rules (七大地区). "none" means no aggregate is produced because correct weights are unavailable.
export const AGG_NOTE: Record<string, string> = {
  sum: "地区汇总 = 区内各省数值之和（可加总量指标）。",
  "weighted:population": "地区汇总 = 以年末常住人口为权重的加权平均（Σ值×人口 / Σ人口）。对率类指标为近似值：官方率以年平均人口为分母。",
  none: "不生成地区汇总：正确汇总需要的权重（如年平均人口、住户调查权重）无法从已发布数据取得。下表改为显示区内各省的最小值、中位数和最大值。",
};
CALIBER_BREAKS.disposable_income = [{ year: 2013, short: "调查制度", note: "2013年起为城乡一体化住户收支调查实测数；2000、2005—2012年为国家统计局按统一口径回溯推算数，跨2013年比较需谨慎。" }];
CALIBER_BREAKS.consumption_expenditure_per_capita = [{ year: 2013, short: "调查制度", note: "2013年起城乡一体化住户调查。" }];
CALIBER_BREAKS.population_0_14 = CALIBER_BREAKS.population_65plus;
CALIBER_BREAKS.population_15_64 = CALIBER_BREAKS.population_65plus;
CALIBER_BREAKS.forest_coverage = [{ year: 2014, short: "清查期", note: "森林覆盖率来自全国森林资源清查，按清查期更新；相邻年份相同值并非逐年独立观测。" }];
