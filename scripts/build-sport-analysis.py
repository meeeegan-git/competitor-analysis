#!/usr/bin/env python3
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

TIMES = [1, 3, 5, 7, 9, 11, 13, 15]
REQUIRED = [
    "KPI三级行业",
    "商品统一类目V2(一级～四级)",
    "DPA商品名称",
    "素材MD5示意(预览)",
    "素材MD5示意(预览)(翻译后)",
    "消耗(元)",
]

STOP_WORDS = [
    "明星", "推荐", "同款", "夏季", "春夏", "女士", "女", "男士", "男", "专业", "新款",
    "升级", "高腰", "凉感", "防晒", "运动", "户外", "家用", "懒人", "轻便", "透气",
    "到手", "买", "送", "三件套", "二件套", "旗舰", "正品", "官方",
]

PRODUCT_WORDS = [
    "裤", "衣", "鞋", "包", "文胸", "内裤", "护膝", "健腹", "跑步机", "筋膜", "帐篷", "瑜伽", "甩脂",
]


def clean_name(name):
    return str(name).strip()


def infer_customer(name):
    n = clean_name(name)
    original = n
    n = re.sub(r"^[【\[][^[\]】]+[】\]]", "", n).strip()
    n = re.sub(r"^[（(][^)）]+[)）]", "", n).strip()

    if "/" in n:
        left = n.split("/", 1)[0].strip()
        if 1 < len(left) <= 12:
            return left

    m = re.match(r"^([A-Za-z][A-Za-z0-9]{1,18})", n)
    if m:
        return m.group(1).upper()

    for w in STOP_WORDS:
        n = n.replace(w, "")
    for w in PRODUCT_WORDS:
        idx = n.find(w)
        if 0 < idx <= 8:
            n = n[:idx]
            break

    n = re.sub(r"[\s\-_/·,，。:：]+", "", n)
    n = re.sub(r"\d+.*$", "", n)
    n = n.strip("【】[]（）()")
    if len(n) >= 2:
        return n[:8]
    return original[:8]


def clean_df(path):
    df = pd.read_excel(path)
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    raw_rows = len(df)
    df = df.dropna(how="all").copy()
    df = df[df["KPI三级行业"].notna()]
    df = df[df["KPI三级行业"].astype(str) != "整体"]
    df = df[df["DPA商品名称"].notna()]
    df = df[df["素材MD5示意(预览)"].notna()]
    df = df[df["素材MD5示意(预览)(翻译后)"].notna()]
    df["消耗(元)"] = pd.to_numeric(df["消耗(元)"], errors="coerce")
    df = df[df["消耗(元)"].notna() & (df["消耗(元)"] > 0)]
    df["_customer"] = df["DPA商品名称"].map(infer_customer)
    df["_md5"] = df["素材MD5示意(预览)"].astype(str)
    df = df.sort_values("消耗(元)", ascending=False).drop_duplicates("_md5", keep="first")
    return df, {"rawRows": raw_rows, "validRowsAfterBlankRemoval": len(df)}


def classify_item(row):
    ind = str(row["KPI三级行业"])
    ca = str(row["商品统一类目V2(一级～四级)"])
    pn = clean_name(row["DPA商品名称"])
    text = f"{ind} {ca} {pn}"

    has_star = bool(re.search(r"明星|同款|杨幂|樊少皇|推荐|代言", text))
    is_underwear = bool(re.search(r"内衣|文胸|内裤|塑身|贴身", text))
    is_apparel = bool(re.search(r"女装|男装|裤|上衣|衬衫|服饰|鞋|防晒", text))
    is_fitness = bool(re.search(r"健身|瑜伽|健腹|跑步机|甩脂|筋膜|训练", text))
    is_protective = bool(re.search(r"护膝|髌骨|护具|关节|保护", text))
    is_outdoor = bool(re.search(r"帐篷|露营|野炊|钓|骑行|户外", text))

    if has_star:
        hook = "名人/同款背书"
        script = "明星同款种草型"
        proof = "名人信任锚"
    elif is_protective:
        hook = "痛点场景直击"
        script = "痛点解决验证型"
        proof = "专业防护证明"
    elif is_fitness:
        hook = "效果/身材焦虑"
        script = "效果演示种草型"
        proof = "真人使用验证"
    elif is_underwear:
        hook = "舒适痛点共鸣"
        script = "痛点细节证明型"
        proof = "材质细节证明"
    elif is_outdoor:
        hook = "场景向往种草"
        script = "场景体验展示型"
        proof = "真实场景证明"
    else:
        hook = "产品颜值开场"
        script = "快速展示种草型"
        proof = "细节/口碑证明"

    if is_fitness:
        scene = "居家健身/训练"
        role = "运动达人/教练"
        focus = "功能效果"
    elif is_protective:
        scene = "跑步/球类防护"
        role = "运动人群/中老年"
        focus = "防护舒适"
    elif is_outdoor:
        scene = "户外露营/运动"
        role = "户外玩家"
        focus = "场景功能"
    elif is_underwear:
        scene = "日常穿着/舒适体验"
        role = "女性模特/素人"
        focus = "舒适塑形"
    elif is_apparel:
        scene = "通勤/穿搭/运动"
        role = "模特/KOL"
        focus = "版型材质"
    else:
        scene = "商品展示场景"
        role = "素人/推荐官"
        focus = "核心功能"

    visual = "真人上身/使用" if (is_apparel or is_fitness or is_protective) else "产品特写展示"
    if has_star:
        visual = "名人标签+真人展示"

    return {
        "hook": hook,
        "scene": scene,
        "role": role,
        "proof": proof,
        "script": script,
        "visual": visual,
        "focus": focus,
    }


def frame_analysis(row, tags, time):
    pn = clean_name(row["DPA商品名称"])
    phase_map = {
        1: ("黄金1秒", "抓停滑动：用最强标签/最大痛点/最强画面让用户停留"),
        3: ("钩子确认", "在3秒内明确这条素材与用户有什么关系"),
        5: ("卖点展开", "把核心卖点变成可看见的证据"),
        7: ("场景代入", "让用户想象自己使用/穿着后的状态"),
        9: ("信任构建", "用背书、数据、细节或口碑降低顾虑"),
        11: ("差异化对比", "说明为什么不是普通同类商品"),
        13: ("利益加码", "价格、赠品、限时、保障进入画面"),
        15: ("行动收口", "明确下一步购买动作"),
    }
    phase, objective = phase_map[time]

    visual_tags = []
    copy_tags = []
    if time == 1:
        visual_tags = [tags["visual"], "大字标题/强标签"]
        copy_tags = [tags["hook"], "第一眼利益点"]
    elif time == 3:
        visual_tags = ["产品主体清晰", tags["role"]]
        copy_tags = ["痛点/利益点强化", tags["focus"]]
    elif time == 5:
        visual_tags = ["细节特写/功能演示", tags["focus"]]
        copy_tags = ["卖点字幕", "可感知证据"]
    elif time == 7:
        visual_tags = [tags["scene"], "真人/真实环境"]
        copy_tags = ["场景化文案", "使用后状态"]
    elif time == 9:
        visual_tags = [tags["proof"], "口碑/数据/认证"]
        copy_tags = ["信任背书", "消除顾虑"]
    elif time == 11:
        visual_tags = ["对比画面", "前后/同类差异"]
        copy_tags = ["差异化表达", "为什么买它"]
    elif time == 13:
        visual_tags = ["价格/赠品/活动信息", "商品全集合"]
        copy_tags = ["限时权益", "价值锚点"]
    else:
        visual_tags = ["购买指引", "最终商品展示"]
        copy_tags = ["点击/领券/下单", "单一行动指令"]

    return {
        "time": time,
        "phase": phase,
        "objective": objective,
        "visualTags": visual_tags,
        "copyTags": copy_tags,
        "shot": shot_tip(tags, time),
        "replicate": replicate_tip(tags, time, pn),
    }


def shot_tip(tags, time):
    if time <= 3:
        return f"竖屏近景或半身构图，{tags['hook']}必须与商品同屏出现，避免先铺垫品牌。"
    if time <= 7:
        return f"用真实{tags['scene']}承接卖点，镜头从产品细节切到真人使用，形成证据链。"
    if time <= 11:
        return f"插入{tags['proof']}，字幕只保留一个核心证明点，降低信息噪音。"
    return "价格/赠品/行动按钮保持同屏，最后2秒只给一个行动指令。"


def replicate_tip(tags, time, pn):
    if time == 1:
        return f"保留'{tags['hook']}'的开场结构，把商品替换成你的主推SKU：{pn[:18]}..."
    if time == 3:
        return "3秒内必须回答'这和我有什么关系'，不要把卖点藏到第5秒之后。"
    if time == 5:
        return f"把'{tags['focus']}'拆成可视化动作：拉伸、对比、上身、佩戴、使用前后。"
    if time == 7:
        return f"场景不要泛化，直接替换成目标用户最高频的{tags['scene']}。"
    if time == 9:
        return f"至少放一个{tags['proof']}，但不要堆砌多个弱证明。"
    if time == 11:
        return "对比只选一个维度：价格、材质、效果、使用门槛或售后保障。"
    if time == 13:
        return "促销画面要可见：券、赠品、到手价或限时信息至少出现一种。"
    return "结尾不要新增卖点，直接给点击/领券/下单动作。"


def build_item(row, rank):
    tags = classify_item(row)
    frames = [frame_analysis(row, tags, t) for t in TIMES]
    return {
        "rank": rank,
        "id": str(row["_md5"]),
        "customerKey": str(row["_customer"]),
        "ind": str(row["KPI三级行业"]),
        "ca": str(row["商品统一类目V2(一级～四级)"]),
        "pn": clean_name(row["DPA商品名称"]),
        "ml": str(row["素材MD5示意(预览)(翻译后)"]),
        "cs": round(float(row["消耗(元)"]), 2),
        "ctr": metric(row, "ctr(%)"),
        "cvr": metric(row, "综合目标转化率(%)"),
        "vtr": metric(row, "视频3秒完播率(%)"),
        "dur": metric(row, "平均播放时长(毫秒精度)(s)"),
        "roi": metric(row, "下单ROI"),
        "tags": tags,
        "keyframes": frames,
    }


def metric(row, col):
    val = row.get(col)
    if pd.isna(val):
        return 0
    try:
        return round(float(val), 2)
    except Exception:
        return 0


def cap_by_customer(df, limit=3, topn=50):
    kept = []
    counts = defaultdict(int)
    for _, row in df.sort_values("消耗(元)", ascending=False).iterrows():
        ck = row["_customer"]
        if counts[ck] >= limit:
            continue
        kept.append(row)
        counts[ck] += 1
        if len(kept) >= topn:
            break
    return pd.DataFrame(kept)


def stats(items, dim):
    total_cost = sum(i["cs"] for i in items) or 1
    c = Counter(i["tags"][dim] for i in items)
    cost = defaultdict(float)
    examples = {}
    for i in items:
        label = i["tags"][dim]
        cost[label] += i["cs"]
        if label not in examples or i["cs"] > examples[label]["cs"]:
            examples[label] = i
    out = []
    for label, count in c.most_common():
        ex = examples[label]
        out.append({
            "label": label,
            "count": count,
            "pct": round(count / len(items) * 100, 1),
            "costShare": round(cost[label] / total_cost * 100, 1),
            "exampleRank": ex["rank"],
            "exampleName": ex["pn"],
            "exampleVideo": ex["ml"],
            "exampleTime": 1,
        })
    return out


def frame_stats(items):
    total = len(items) or 1
    by_time = []
    for t in TIMES:
        labels = Counter()
        cost = defaultdict(float)
        for i in items:
            frame = next(f for f in i["keyframes"] if f["time"] == t)
            for tag in frame["visualTags"] + frame["copyTags"]:
                labels[tag] += 1
                cost[tag] += i["cs"]
        top = []
        total_cost = sum(i["cs"] for i in items) or 1
        for label, count in labels.most_common(6):
            top.append({
                "label": label,
                "count": count,
                "pct": round(count / total * 100, 1),
                "costShare": round(cost[label] / total_cost * 100, 1),
            })
        by_time.append({"time": t, "topElements": top})
    return by_time


def paradigms(items):
    groups = defaultdict(list)
    for i in items:
        key = (i["tags"]["script"], i["tags"]["hook"], i["tags"]["role"])
        groups[key].append(i)
    total_cost = sum(i["cs"] for i in items) or 1
    out = []
    for (script, hook, role), group in sorted(groups.items(), key=lambda kv: sum(i["cs"] for i in kv[1]), reverse=True)[:8]:
        top = max(group, key=lambda i: i["cs"])
        cost = sum(i["cs"] for i in group)
        out.append({
            "script": script,
            "hook": hook,
            "role": role,
            "count": len(group),
            "pct": round(len(group) / len(items) * 100, 1),
            "costShare": round(cost / total_cost * 100, 1),
            "exampleRank": top["rank"],
            "exampleName": top["pn"],
        })
    return out


def build_dataset(name, pool_df, benchmark_df, meta):
    pool = cap_by_customer(pool_df, 3, 50)
    benchmark = cap_by_customer(benchmark_df, 3, 50)
    own_items = [build_item(row, idx + 1) for idx, (_, row) in enumerate(pool.iterrows())]
    bench_items = [build_item(row, idx + 1) for idx, (_, row) in enumerate(benchmark.iterrows())]
    dims = ["hook", "scene", "role", "focus", "proof", "script", "visual"]
    return {
        "name": name,
        "week": "06.22-06.28",
        "dataRules": {
            **meta,
            "dedupeRule": "素材MD5去重，保留消耗最高的一条",
            "customerCapRule": "同一客户最多保留3条（原表无客户字段，按DPA商品名称识别品牌/主体）",
            "benchmarkRule": "服饰大盘=排除运动鞋服与运动用品后的全量服饰素材TOP50",
            "keyframeTimes": TIMES,
        },
        "totalCountAfterRules": len(pool_df),
        "topItems": own_items,
        "elementStats": {dim: stats(own_items, dim) for dim in dims},
        "frameStats": frame_stats(own_items),
        "paradigms": paradigms(own_items),
        "apparelBenchmark": {
            "name": "服饰大盘爆款素材",
            "topItems": bench_items,
            "elementStats": {dim: stats(bench_items, dim) for dim in dims},
            "frameStats": frame_stats(bench_items),
            "paradigms": paradigms(bench_items),
        },
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: build-sport-analysis.py <xlsx>", file=sys.stderr)
        sys.exit(1)
    xlsx = sys.argv[1]
    root = Path(__file__).resolve().parents[1]
    data_dir = root / "src" / "data"

    df, meta = clean_df(xlsx)
    shoes = df[df["KPI三级行业"].astype(str).str.contains("运动鞋服", na=False)].copy()
    goods = df[df["KPI三级行业"].astype(str).str.contains("运动用品", na=False)].copy()
    benchmark = df[~df["KPI三级行业"].astype(str).str.contains("运动鞋服|运动用品", na=False)].copy()

    shoes_data = build_dataset("运动鞋服", shoes, benchmark, meta)
    goods_data = build_dataset("运动用品", goods, benchmark, meta)

    (data_dir / "sport-shoes-analysis.json").write_text(json.dumps(shoes_data, ensure_ascii=False, indent=2), encoding="utf-8")
    (data_dir / "sport-goods-analysis.json").write_text(json.dumps(goods_data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({
        "validRows": meta["validRowsAfterBlankRemoval"],
        "shoesPool": len(shoes),
        "goodsPool": len(goods),
        "benchmarkPool": len(benchmark),
        "shoesTop": len(shoes_data["topItems"]),
        "goodsTop": len(goods_data["topItems"]),
        "benchmarkTop": len(shoes_data["apparelBenchmark"]["topItems"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
