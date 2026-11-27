"""R2.1: add further official NBS indicators to config/indicators.json.
Each entry pairs a provincial table (分省年度数据) with the matching national table (年度数据).
IDs were located by walking the public catalog tree (queryIndexTreeAsync) and matching indicator names.
Idempotent: existing ids are replaced, nothing else is touched."""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P_POP = "755d5f6efbcf41a6a411ad819aa93c17:4810ad6e9ddc41fc804a66134afe587f"
N_POP = "6331ad868e8b4f55b8e9b6e765609ce1:806083491dbe46a08995783945a30b9d"
# id, category, name_zh, name_en, unit, agg, definition, official name,
# (prov cid, {k: iid}, formula, orig_unit, table, round), (nat ... ) or None
R = None
SPEC = [
 ("real_gdp_growth","economy","地区生产总值实际增长率","Real GDP growth","%","none","按可比价格计算的地区生产总值比上年增长（官方指数“上年=100”减100）。","地区生产总值指数(上年=100)",
  ("05cf8a895d3e41658f4dbc56fdfabf9b",{"v":"8fc8b9f0d07944688b199884db43cb68"},"v-100","上年=100","分省年度数据 > 国民经济核算 > 地区生产总值指数",1),
  ("489888799f8d470786bc01a4057efc38",{"v":"NAT"},"v-100","上年=100","年度数据 > 国民经济核算 > 国内生产总值指数 (上年=100)",1)),
 ("cpi_inflation","labor","居民消费价格涨幅","CPI inflation","%","none","居民消费价格指数（上年=100）减100。","居民消费价格指数(上年=100)",
  ("d1345232d611428bb56474a4f9ce848d",{"v":"dc68d688633d4806b3034821f0a3482d"},"v-100","上年=100","分省年度数据 > 价格指数 > 居民消费价格指数和商品零售价格指数",1),
  ("e5f37eced5de4d4c815f7ac5f59fc6c2",{"v":"5e3053f110074dcdbcfa3c8428dd1367"},"v-100","上年=100","年度数据 > 价格指数 > 各种价格指数",1)),
 ("average_wage","labor","城镇非私营单位就业人员平均工资","Average wage, urban non-private units","元","none","城镇非私营单位（分省表称“城镇单位”）就业人员平均货币工资，不含私营单位。","城镇单位就业人员平均工资",
  ("1e46e1057756495e856bd8fcd64598e2",{"v":"2892a327f289418ca0719fec09c712ea"},"v","元","分省年度数据 > 就业人员和工资 > 城镇单位就业人员平均工资和指数",None),
  ("0aed53df47b14e7393a98718a320e238",{"v":"NAT"},"v","元","年度数据 > 就业人员和工资 > 城镇非私营单位就业人员平均工资和指数",None)),
 ("real_wage_growth","labor","平均实际工资增长率","Real average wage growth","%","none","城镇非私营单位就业人员平均实际工资指数（上年=100）减100。","城镇单位就业人员平均实际工资指数(上年=100)",
  ("1e46e1057756495e856bd8fcd64598e2",{"v":"d55482a099904c2fac7391e84039ab49"},"v-100","上年=100","分省年度数据 > 就业人员和工资 > 城镇单位就业人员平均工资和指数",1),
  ("0aed53df47b14e7393a98718a320e238",{"v":"NAT2"},"v-100","上年=100","年度数据 > 就业人员和工资 > 城镇非私营单位就业人员平均工资和指数",1)),
 ("registered_unemployment_rate","labor","城镇登记失业率","Registered urban unemployment rate","%","none","城镇登记失业人数占城镇从业人员与登记失业人数之和的比重（登记口径，不同于调查失业率）。","城镇登记失业率",
  ("83d8ba3dc53c4543a1716803e3170fb6",{"v":"11fcb0050abd4937b970e9fed5113a30"},"v","%","分省年度数据 > 就业人员和工资 > 城镇登记失业人员及失业率",None),
  ("19839dbd8e82481b9524f031c6d816c5",{"v":"NAT"},"v","%","年度数据 > 就业人员和工资 > 城镇登记失业人员及失业率",None)),
 ("fai_growth","economy","固定资产投资（不含农户）增速","Fixed-asset investment growth (excl. rural households)","%","none","固定资产投资（不含农户）比上年增长，按可比口径计算（官方增速，不能由相邻年份绝对额直接相除得到）。","固定资产投资(不含农户)比上年增长",
  ("fa42ee3b82724a1c972490d7b628811e",{"v":"a8b24c8058d14e069b7ef22600d7a9b5"},"v","%","分省年度数据 > 固定资产投资和房地产 > 固定资产投资 (不含农户) 增速",None),
  ("607a7cd4b50e4553894472475d1f4273",{"v":"d4936bf5c0bd4ff396cf813fc429dfe8"},"v","%","年度数据 > 固定资产投资和房地产 > 全社会固定资产投资",None)),
 ("housing_price","economy","新建商品房平均销售价格","Average price of new commercial housing","元/平方米","none","新建商品房销售额 ÷ 销售面积（官方计算），含住宅、办公楼、商业营业用房等。","新建商品房平均销售价格",
  ("d4241972005a48a48ac225746d615845",{"v":"83bc0fc6c86743ba8bc07834eedaeaac"},"v","元/平方米","分省年度数据 > 固定资产投资和房地产 > 按用途分新建商品房平均销售价格",None),
  ("NATHP",{"v":"NAT"},"v","元/平方米","年度数据 > 固定资产投资和房地产 > 按用途分新建商品房平均销售价格",None)),
 ("housing_sales_area","economy","新建商品房销售面积","New commercial housing floor space sold","万平方米","sum","报告期内出售新建商品房屋的合同面积。","新建商品房销售面积",
  ("23f9580d1fd34edc809b0d1c16349ac7",{"v":"243271fcbca94e24b9fcae138bdf316c"},"v","万平方米","分省年度数据 > 固定资产投资和房地产 > 按用途分新建商品房销售面积",None),
  ("NATHS",{"v":"NAT"},"v","万平方米","年度数据 > 固定资产投资和房地产 > 按用途分新建商品房销售面积",None)),
 ("trade_total","economy","货物进出口总额（美元）","Goods trade (imports + exports), USD","亿美元","sum","分省为按经营单位所在地统计的货物进出口总额（海关数据），全国为海关货物进出口总额。","经营单位所在地进出口总额",
  ("9c61eb74ddd346d88749f9881837dbc7",{"v":"6219327f109140a691f71ea9d58c4ae5"},"v/100000","千美元","分省年度数据 > 对外经济贸易 > 按经营单位所在地分货物进出口总额",2),
  ("333332810f574043bc40553902c2f385",{"v":"76b093af4247461e93bac4612ae7c969"},"v/100","百万美元","年度数据 > 对外经济贸易 > 货物进出口总额",2)),
 ("exports","economy","货物出口总额（美元）","Goods exports, USD","亿美元","sum","分省按经营单位所在地统计；全国为海关出口总额。","经营单位所在地出口总额",
  ("9c61eb74ddd346d88749f9881837dbc7",{"v":"6a455b4128994239ab90e5cac2e7aa25"},"v/100000","千美元","分省年度数据 > 对外经济贸易 > 按经营单位所在地分货物进出口总额",2),
  ("333332810f574043bc40553902c2f385",{"v":"60a655d174bb4868bdcc12e8789e7307"},"v/100","百万美元","年度数据 > 对外经济贸易 > 货物进出口总额",2)),
 ("agri_output_value","economy","农林牧渔业总产值","Gross output of agriculture, forestry, animal husbandry and fishery","亿元","sum","现价农林牧渔业总产值（含农林牧渔专业及辅助性活动）。","农林牧渔业总产值",
  ("61daa3937e1546bf911c3a9dff70cb3f",{"v":"40cb96b1d2484bd4bba693c41c5c34b5"},"v","亿元","分省年度数据 > 农业 > 农、林、牧、渔业总产值及指数",None),
  ("1944c65638974024b30b6b8060ebc83d",{"v":"666ce3d2d24b4e4a8bdf02d1ebca0d55"},"v","亿元","年度数据 > 农业 > 农、林、牧、渔业总产值及指数",None)),
 ("grain_output","economy","粮食产量","Grain output","万吨","sum","谷物、豆类和薯类产量合计（薯类按5:1折粮）。","粮食产量",
  ("2ecdbcf038f349f1bd6840e731efbfa2",{"v":"d7d8730d61ff44998281d585e79b94af"},"v","万吨","分省年度数据 > 农业 > 主要农作物产品产量",None),
  ("NATGR",{"v":"NAT"},"v","万吨","年度数据 > 农业 > 主要农作物产品产量",None)),
 ("intl_tourism_revenue","economy","国际旅游外汇收入","International tourism receipts","百万美元","sum","入境游客在境内的旅游消费（外汇）。","国际旅游外汇收入",
  ("ba54f4c606314c24a05ed4ff68d7d097",{"v":"1a86e9a3ef7b4730a6ec8bf217e50d6d"},"v","百万美元","分省年度数据 > 旅游业 > 国际旅游 (外汇) 收入",None),
  ("NATTR",{"v":"NAT"},"v","百万美元","年度数据 > 旅游业 > 旅游业发展情况",None)),
 ("insurance_premiums","economy","原保险保费收入","Primary insurance premium income","亿元","sum","保险公司原保险业务保费收入。","原保险保费收入",
  ("f574f833db894db1815a0317c21d495a",{"v":"98a71d4127744fd3a89080c097db0783"},"v","亿元","分省年度数据 > 金融业 > 原保险保费收入和赔付支出情况",None),
  ("NATIN",{"v":"NAT"},"v","亿元","年度数据 > 金融业 > 原保险保费收入和赔付支出情况",None)),
 ("life_expectancy","population","平均预期寿命","Life expectancy at birth","岁","none","普查年份的出生时平均预期寿命（仅普查年份有分省数据）。","平均预期寿命",
  ("96c74b9bdfcf480192ff566bffc50bb0",{"v":"292f0860a4c944bfab80e61eae661059"},"v","岁","分省年度数据 > 人口 > 人口平均预期寿命",None),
  ("0f6150cfa670407ab4a81669b9ed9dbc",{"v":"NAT"},"v","岁","年度数据 > 人口 > 人口平均预期寿命",None)),
 ("patents_granted","tech","国内专利授权量","Domestic patents granted","项","sum","国内发明、实用新型、外观设计三种专利申请授权量合计。","国内专利申请授权量",
  ("3ac6344551e04aefbcb26f7966d280a0",{"v":"053bd4bf7d4b46e6bc769e4b8525823c"},"v","项","分省年度数据 > 科技 > 国内三种专利申请受理数和授权数",None),
  ("60db3c31480d47e1b885f7c424b3913b",{"v":"e9657218d8ba4770b0460d66a7b402b4"},"v","项","年度数据 > 科技 > 国内三种专利申请受理数和授权数",None)),
 ("invention_patents_granted","tech","国内发明专利授权量","Domestic invention patents granted","项","sum","国内发明专利申请授权量。","国内发明专利申请授权量",
  ("3ac6344551e04aefbcb26f7966d280a0",{"v":"cddc825b23034395826461f34e3cc63e"},"v","项","分省年度数据 > 科技 > 国内三种专利申请受理数和授权数",None),
  ("60db3c31480d47e1b885f7c424b3913b",{"v":"89abddc57d824662934bda8689a7bef5"},"v","项","年度数据 > 科技 > 国内三种专利申请受理数和授权数",None)),
 ("invention_patents_per_10k","tech","每万人口发明专利授权量","Invention patents granted per 10,000 residents","件/万人","weighted:population","国内发明专利授权量 ÷ 年末常住人口（万人）。衍生指标。","国内发明专利申请授权量 ÷ 年末常住人口",
  ("3ac6344551e04aefbcb26f7966d280a0",{"v":"cddc825b23034395826461f34e3cc63e","t":P_POP},"v/t","项 / 万人","分省年度数据 > 科技 > 国内三种专利申请受理数和授权数 ÷ 人口 > 总人口 > 年末常住人口",2),
  ("60db3c31480d47e1b885f7c424b3913b",{"v":"89abddc57d824662934bda8689a7bef5","t":N_POP},"v/t","项 / 万人","年度数据 > 科技 > 国内三种专利申请受理数和授权数 ÷ 人口 > 年末总人口",2)),
 ("tech_market_turnover","tech","技术市场成交额","Technology market turnover","亿元","sum","技术合同成交金额（按卖方所在地）。","技术市场成交额",
  ("f8aaf64b70254b34bdb6f1b397aedb02",{"v":"320ea8f5aa904d5285c64054b25615c9"},"v","亿元","分省年度数据 > 科技 > 技术市场成交额",None),
  ("NATTM",{"v":"NAT"},"v","亿元","年度数据 > 科技 > 技术市场成交额",None)),
 ("broadband_users","tech","互联网宽带接入用户","Fixed broadband subscribers","万户","sum","年末互联网宽带接入用户数。","互联网宽带接入用户",
  ("53f522fb4b1a40ce90977a0b1cd94da1",{"v":"261d36f83f7d4cbb88cdc57270f2a9ae"},"v","万户","分省年度数据 > 运输和邮电 > 互联网主要指标发展情况",None),
  ("NATBB",{"v":"NAT"},"v","万户","年度数据 > 运输和邮电 > 互联网主要指标发展情况",None)),
 ("express_volume","tech","快递业务量","Express delivery parcels","亿件","sum","快递服务企业业务量（万件折算为亿件）。","快递量",
  ("dd7b4eb603d74f7e8a030fb1f0701829",{"v":"aa8cfbd7e171469b91ba219803dde1e0"},"v/10000","万件","分省年度数据 > 运输和邮电 > 快递业务量",2),
  ("NATEX",{"v":"NAT"},"v/10000","万件","年度数据 > 运输和邮电 > 快递业务量",2)),
 ("health_technicians_per_10k","health","每万人口卫生技术人员数","Health technicians per 10,000 population","人/万人","weighted:population","官方发布的每万人拥有卫生技术人员数。","每万人拥有卫生技术人员数",
  ("e469513e184d43109318f06a51cb436e",{"v":"2316b80b3b3746ce821e49b2c50d9521"},"v","人","分省年度数据 > 卫生 > 每万人口卫生技术人员数",None),
  ("NATHT",{"v":"NAT"},"v","人","年度数据 > 卫生 > 每万人口卫生技术人员数",None)),
 ("primary_pupil_teacher_ratio","education","小学生师比","Primary school pupil–teacher ratio","人/教师","none","小学在校生数 ÷ 专任教师数（教师=1）。","小学阶段生师比",
  ("1709f28f235340e19bc1c067443ec6ba",{"v":"f73b76e4b12149afb7d8473e873a77db"},"v","教师人数=1","分省年度数据 > 教育 > 各级普通学校生师比",None),
  ("NATPT",{"v":"NAT"},"v","教师人数=1","年度数据 > 教育 > 各级普通学校生师比",None)),
 ("higher_ed_per_100k","education","每十万人口高等教育在校生数","Higher-education enrolment per 100,000 population","人/十万人","weighted:population","每十万人口高等教育平均在校生数（官方计算）。","每十万人口高等教育平均在校生数",
  ("5e773f40c4f24c40bf28ba7a256c8e08",{"v":"1ea5ea122bf4497284856490f8fa43f2"},"v","人","分省年度数据 > 教育 > 每十万人口各级教育平均在校生数",None),
  ("NATHE",{"v":"NAT"},"v","人","年度数据 > 教育 > 每十万人口各级教育平均在校生数",None)),
 ("fiscal_education_funding","education","国家财政性教育经费","Government education expenditure","亿元","sum","国家财政性教育经费（万元折算为亿元）。","国家财政性教育经费",
  ("5cbbd13d0c6a4eeeb7879115ebddbd82",{"v":"bc6aab12fe1743ddb59ea10cf61ca905"},"v/10000","万元","分省年度数据 > 教育 > 教育经费情况",2),
  ("NATEF",{"v":"NAT"},"v/10000","万元","年度数据 > 教育 > 国家财政性教育经费",2)),
 ("medical_insurance_participants","society","基本医疗保险参保人数","Basic medical insurance enrolment","万人","sum","年末职工基本医疗保险与城乡居民基本医疗保险参保人数合计。","基本医疗保险年末参保人数",
  ("b3a0bfe711694f9483c50480bd1628ef",{"v":"29dfee714e2c4f97be652440aec199a2"},"v","万人","分省年度数据 > 公共管理、社会保障及其他 > 基本医疗保险",None),
  ("NATMI",{"v":"NAT"},"v","万人","年度数据 > 公共管理、社会保障及其他 > 基本医疗保险",None)),
 ("pension_participants","society","城镇职工基本养老保险参保人数","Urban employee pension enrolment","万人","sum","年末参加城镇职工基本养老保险人数（含在职与离退休）。","参加城镇职工基本养老保险人数",
  ("87884cea9d4d40b6925a976e47674a36",{"v":"c3fffd74e6164251b379b8d6c199eb24"},"v","万人","分省年度数据 > 公共管理、社会保障及其他 > 城镇职工基本养老保险",None),
  ("NATPE",{"v":"NAT"},"v","万人","年度数据 > 公共管理、社会保障及其他 > 参加城镇职工基本养老保险人数",None)),
 ("museums","society","博物馆数","Museums","个","sum","文物系统及其他行业博物馆机构数（以官方统计范围为准）。","博物馆机构数",
  ("49ac8683b36d4d31b0bbafa6e370da9f",{"v":"00af549872a34515af8658496c4bdccf"},"v","个","分省年度数据 > 文化 > 博物馆",None),
  ("NATMU",{"v":"NAT"},"v","个","年度数据 > 文化 > 博物馆",None)),
 ("museum_visits","society","博物馆参观人次","Museum visits","万人次","sum","博物馆全年参观人次。","博物馆参观人次",
  ("49ac8683b36d4d31b0bbafa6e370da9f",{"v":"f66678428db34adc97920492c667dbe2"},"v","万人次","分省年度数据 > 文化 > 博物馆",None),
  ("NATMV",{"v":"NAT"},"v","万人次","年度数据 > 文化 > 博物馆",None)),
 ("library_books_per_capita","society","人均公共图书馆藏量","Public library holdings per capita","册/人","weighted:population","公共图书馆总藏量 ÷ 常住人口（官方计算）。","人均拥有公共图书馆藏量",
  ("0b397cc7a52748ffbb30bbf2450a5964",{"v":"d8a86413d4d04a158d2192b3af64b520"},"v","册/人","分省年度数据 > 文化 > 公共图书馆",None),
  ("NATLB",{"v":"NAT"},"v","册/人","年度数据 > 文化 > 公共图书馆",None)),
 ("electricity_consumption","environment","全社会用电量","Electricity consumption","亿千瓦时","sum","电力消费总量（地区能源平衡口径）。","电力消费量",
  ("ccc1ef64e4a0485f840cd5f6fa192097",{"v":"808cac47e5824d1f91af38c0962a336b"},"v","亿千瓦时","分省年度数据 > 能源 > 主要能源产品消费量",None),
  ("b349329a0b7d454aada5fb3ecc33e4b2",{"v":"80b072c16b8446edbc98a4abac28b5fb"},"v","亿千瓦时","年度数据 > 能源 > 电力平衡表",None)),
 ("water_resources_per_capita","environment","人均水资源量","Water resources per capita","立方米/人","none","水资源总量 ÷ 常住人口（官方计算，受当年降水影响大）。","人均水资源量",
  ("23a72a19bd3a4206a2cdd63aeefd77b4",{"v":"56462963ef944c6297f411257dae8b8e"},"v","立方米/人","分省年度数据 > 资源和环境 > 水资源",None),
  ("NATWR",{"v":"NAT"},"v","立方米/人","年度数据 > 资源和环境 > 水资源",None)),
 ("so2_emissions","environment","二氧化硫排放量","Sulphur dioxide emissions","万吨","sum","废气中二氧化硫排放量。统计调查范围在2011、2016年前后有调整，跨期比较需谨慎。","二氧化硫排放量",
  ("d3fbabfb5307455b9e807e33da7b9496",{"v":"c51e0e7561a14e34ab1f233301a1cd4f"},"v","万吨","分省年度数据 > 资源和环境 > 废气中主要污染物排放",None),
  ("NATSO",{"v":"NAT"},"v","万吨","年度数据 > 资源和环境 > 废气中主要污染物排放",None)),
 ("garbage_treatment_rate","environment","生活垃圾无害化处理率","Municipal solid waste safe-treatment rate","%","none","城市生活垃圾无害化处理量 ÷ 清运量 × 100（官方计算）。","生活垃圾无害化处理率",
  ("ae800bf8ba184308a05274d32af1953d",{"v":"180e13b13bad4119aa714f373bcc40bf"},"v","%","分省年度数据 > 资源和环境 > 城市生活垃圾清运和处理情况",None),
  ("NATGT",{"v":"NAT"},"v","%","年度数据 > 资源和环境 > 城市生活垃圾清运和处理情况",None)),
 ("green_coverage_built_area","environment","城市建成区绿化覆盖率","Green coverage of urban built-up area","%","none","城市建成区绿化覆盖面积 ÷ 建成区面积 × 100。","建成区绿化覆盖率",
  ("425718c96f084a4ab57e95936eeaad68",{"v":"5681ae21bd504d37b502a096775431c3"},"v","%","分省年度数据 > 城市概况 > 城市绿地和园林",None),
  ("NATGC",{"v":"NAT"},"v","%","年度数据 > 城市概况 > 城市绿地和园林",None)),
 ("daily_water_use_per_capita","environment","城市人均日生活用水量","Urban domestic water use per capita per day","升","none","城市用水人口人均每日生活用水量。","人均日生活用水量",
  ("3688b8562ead415c9e645b5898fa46cf",{"v":"54393a46ec354b99a5d1e10a7daec852"},"v","升","分省年度数据 > 城市概况 > 城市供水",None),
  ("NATDW",{"v":"NAT"},"v","升","年度数据 > 城市概况 > 城市供水",None)),
 ("civil_vehicles","environment","民用汽车拥有量","Civilian motor vehicles","万辆","sum","年末在公安交通管理部门登记的民用汽车数量。","民用汽车拥有量",
  ("669ec642539943eca3a8d26f351e247d",{"v":"8ddbd400f07247ceba54c6458a349f94"},"v","万辆","分省年度数据 > 运输和邮电 > 民用汽车拥有量",None),
  ("NATCV",{"v":"NAT"},"v","万辆","年度数据 > 运输和邮电 > 民用汽车拥有量",None)),
 ("private_cars","environment","私人汽车拥有量","Private cars","万辆","sum","年末登记的私人汽车数量。","私人汽车拥有量",
  ("eea9014e5ac3458a9b98a9d11a74bb41",{"v":"5a3ca38329444466b94d708d5048105d"},"v","万辆","分省年度数据 > 运输和邮电 > 私人汽车拥有量",None),
  ("NATPC",{"v":"NAT"},"v","万辆","年度数据 > 运输和邮电 > 私人汽车拥有量",None)),
 ("private_cars_per_1000","environment","每千人私人汽车拥有量","Private cars per 1,000 residents","辆/千人","weighted:population","私人汽车拥有量（万辆）÷ 年末常住人口（万人）× 1000。衍生指标。","私人汽车拥有量 ÷ 年末常住人口",
  ("eea9014e5ac3458a9b98a9d11a74bb41",{"v":"5a3ca38329444466b94d708d5048105d","t":P_POP},"v/t*1000","万辆 / 万人","分省年度数据 > 运输和邮电 > 私人汽车拥有量 ÷ 人口 > 总人口 > 年末常住人口",1),
  ("NATPC",{"v":"NAT","t":N_POP},"v/t*1000","万辆 / 万人","年度数据 > 运输和邮电 > 私人汽车拥有量 ÷ 人口 > 年末总人口",1)),
 ("freight_volume","environment","货物运输量","Freight volume","万吨","sum","铁路、公路、水运、民航（全国另含管道）货运量合计。","货运量",
  ("c8a2f82b254f41adaa0d2fb48c8d2c4b",{"v":"1c01d75b65524d0d9f43ba35bf5744d0"},"v","万吨","分省年度数据 > 运输和邮电 > 货运量",None),
  ("1afa59232de34e008c2a6e769cd253ed",{"v":"a4c3461ed6094d91819b35a297f60405"},"v","万吨","年度数据 > 运输和邮电 > 货运量",None)),
]

# Evaluated and dropped: the database has only 2009-2010 values for these (too sparse to publish as a series).
DROPPED = {"urban_dibao_standard", "rural_dibao_standard"}

def main(nat_resolved):
    p = os.path.join(ROOT, "config", "indicators.json")
    cfg = json.load(open(p, encoding="utf-8"))
    new_ids = {s[0] for s in SPEC} | DROPPED
    cfg["indicators"] = [i for i in cfg["indicators"] if i["id"] not in new_ids]
    for (iid, cat, zh, en, unit, agg, dfn, off, prov, nat) in SPEC:
        def blk(b, scope):
            cid, ids, f, ou, table, rnd = b
            ids = dict(ids)
            for k, v in ids.items():
                if v.startswith("NAT"):  # national id located by name match (config/r21_national_resolution.json)
                    r = nat_resolved[iid]
                    if cid.startswith("NAT"):
                        cid = r["cid"]
                    elif cid != r["cid"]:
                        raise SystemExit(f"{iid}: national cid mismatch {cid} vs {r['cid']}")
                    ids[k] = r["iid"] if v != "NAT2" else r["iid"]
            d = {"cid": cid, "ids": ids, "formula": f, "orig_unit": ou, "table": table}
            if rnd is not None:
                d["round"] = rnd
            return d
        cfg["indicators"].append({"id": iid, "core": False, "category": cat, "name_zh": zh, "name_en": en, "unit": unit, "unit_en": unit,
            "agg": agg, "higher_is": "neutral", "definition_zh": dfn, "official_name_zh": off, "added_in": "2.1.0",
            "province": blk(prov, "province"), "national": blk(nat, "national") if nat else None})
    cfg["methodology_version"] = "2.1.0"
    json.dump(cfg, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("indicators:", len(cfg["indicators"]))

if __name__ == "__main__":
    main(json.load(open(os.path.join(ROOT, "config", "r21_national_resolution.json"), encoding="utf-8")))
