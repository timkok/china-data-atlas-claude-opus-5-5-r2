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

// R2.1 additions
CALIBER_BREAKS.life_expectancy = [{ year: 2010, short: "普查年", note: "分省平均预期寿命只在人口普查年份（2000、2010、2020）发布，不是逐年数据。" }];
CALIBER_BREAKS.so2_emissions = [{ year: 2011, short: "调查范围", note: "2011年起污染物排放统计范围调整（纳入机动车等），2016年起再次调整；跨期比较需谨慎。" }, { year: 2016, short: "调查范围", note: "2016年起依据第二次全国污染源普查成果更新统计调查口径。" }];
CALIBER_BREAKS.average_wage = [{ year: 2009, short: "口径名称", note: "分省表称“城镇单位”，全国表称“城镇非私营单位”，两者口径相同（不含私营单位）。" }];
CALIBER_BREAKS.fai_growth = [{ year: 2018, short: "增速口径", note: "官方增速按可比口径计算，与用相邻年份公布绝对额直接相除的结果不同；2018年起不再公布分省绝对额。" }];
CALIBER_BREAKS.medical_insurance_participants = [{ year: 2017, short: "城乡整合", note: "2016—2019年城镇居民医保与新农合逐步整合为城乡居民医保，参保人数口径随之扩大。" }];
CALIBER_BREAKS.trade_total = [{ year: 2000, short: "分省口径", note: "分省为按经营单位所在地统计，与按境内目的地和货源地统计的数值不同；各省合计与全国海关总额不一定相等。" }];
CALIBER_BREAKS.exports = CALIBER_BREAKS.trade_total;
CALIBER_BREAKS.water_resources_per_capita = [{ year: 2000, short: "降水影响", note: "水资源量随当年降水大幅波动，年际变化不代表趋势。" }];
