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

PRODUCT_WORDS = ["裤", "衣", "鞋", "包", "文胸", "内裤", "护膝", "健腹", "跑步机", "筋膜", "帐篷", "瑜伽", "甩脂"]

STAGE_LABELS = {
    "first3": [
        "明星达人/同款背书",
        "微剧情/场景冲突",
        "口播推荐/产品直给",
        "痛点直击",
        "效果演示开场",
        "价格福利开场",
        "真人上身/产品视觉",
    ],
    "mid": [
        "功能型卖点",
        "版型材质",
        "舒适体验",
        "情绪价值",
        "场景功能",
        "专业防护",
    ],
    "end": [
        "机制/权益收口",
        "信任收尾",
        "行动收口",
        "营销收口",
    ],
}

# 每个三段式标签的固定含义说明（与代表素材无关，按标签本身定义）
STAGE_LABEL_DESC = {
    # 前三秒
    "明星达人/同款背书": "开场用明星/达人或明星同款背书，借名人身份和信任感快速抓停。",
    "微剧情/场景冲突": "用生活化剧情、反转或人物冲突制造代入感，让用户想看下去。",
    "口播推荐/产品直给": "真人出镜口播或直接把产品甩到画面里，开门见山讲卖点。",
    "痛点直击": "开场直击用户痛点（疼、下垂、不合身等），用问题引发共鸣。",
    "效果演示开场": "上来就演示使用效果或前后对比，用可视化结果吸引注意。",
    "价格福利开场": "开场强调价格、到手价、买赠等福利，用利益点抓停价格敏感人群。",
    "真人上身/产品视觉": "真人上身试穿或高质感产品特写，用视觉美感建立第一印象。",
    # 视频中段
    "功能型卖点": "重点展示使用动作、训练部位、便捷使用和效果想象。",
    "版型材质": "重点展示版型、面料、显瘦/防晒/凉感、穿搭场景。",
    "舒适体验": "重点展示亲肤、无痕、承托、塑形和日常舒适。",
    "情绪价值": "用同款、审美、身份想象和场景氛围建立购买理由。",
    "场景功能": "重点展示搭建、收纳、防晒防雨、露营氛围等场景功能。",
    "专业防护": "重点展示支撑、保护、透气、不移位等专业防护证据。",
    # 视频结尾
    "机制/权益收口": "用套装、买赠、限时、到手价等机制收口，临门一脚促下单。",
    "信任收尾": "用明星/同款、口碑或品牌背书收尾，强化信任后引导购买。",
    "行动收口": "明确引导动作（点击、领取、下单、进店），给出清晰行动指令。",
    "营销收口": "用卖点复述或价值总结收尾，加深记忆后引导转化。",
}


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
    return n[:8] if len(n) >= 2 else original[:8]


def metric(row, col):
    val = row.get(col)
    if pd.isna(val):
        return 0
    try:
        return round(float(val), 2)
    except Exception:
        return 0


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


def text_of(row):
    return f"{row['KPI三级行业']} {row['商品统一类目V2(一级～四级)']} {clean_name(row['DPA商品名称'])}"


def product_type(text):
    if re.search(r"护膝|髌骨|护具|关节|保护", text):
        return "运动防护/护具"
    if re.search(r"健腹|甩脂|筋膜|跑步机|健身|训练|瑜伽", text):
        return "健身训练/塑形"
    if re.search(r"帐篷|露营|野炊|钓|骑行|户外", text):
        return "户外露营/装备"
    if re.search(r"文胸|内衣|内裤|塑身|贴身", text):
        return "贴身衣物/塑形"
    if re.search(r"裤|上衣|衬衫|女装|男装|防晒|鞋", text):
        return "服饰穿搭/鞋服"
    return "通用商品"


def classify_stage(row):
    t = text_of(row)
    pt = product_type(t)
    has_star = bool(re.search(r"明星|同款|杨幂|樊少皇|代言|达人", t))
    has_bundle = bool(re.search(r"套装|组合|买|送|到手|福利|限时|升级", t))

    if has_star:
        first3 = "明星达人/同款背书"
    elif re.search(r"剧情|反转|冲突|尴尬|朋友|闺蜜|妈妈|老公|孩子|同事", t):
        first3 = "微剧情/场景冲突"
    elif re.search(r"护膝|关节|疼|防护|保护", t):
        first3 = "痛点直击"
    elif re.search(r"健腹|甩脂|筋膜|塑形|训练", t):
        first3 = "效果演示开场"
    elif has_bundle:
        first3 = "价格福利开场"
    elif re.search(r"裤|衣|文胸|内裤|鞋|穿搭", t):
        first3 = "真人上身/产品视觉"
    else:
        first3 = "口播推荐/产品直给"

    if pt == "运动防护/护具":
        mid = "专业防护"
        mid_desc = "重点展示支撑、保护、透气、不移位等专业防护证据。"
    elif pt == "健身训练/塑形":
        mid = "功能型卖点"
        mid_desc = "重点展示使用动作、训练部位、便捷使用和效果想象。"
    elif pt == "户外露营/装备":
        mid = "场景功能"
        mid_desc = "重点展示搭建、收纳、防晒防雨、露营氛围等场景功能。"
    elif pt == "贴身衣物/塑形":
        mid = "舒适体验"
        mid_desc = "重点展示亲肤、无痕、承托、塑形和日常舒适。"
    elif pt == "服饰穿搭/鞋服":
        mid = "版型材质"
        mid_desc = "重点展示版型、面料、显瘦/防晒/凉感、穿搭场景。"
    else:
        mid = "功能型卖点"
        mid_desc = "重点展示产品功能、材质、细节和使用效果。"
    if has_star and pt in ["服饰穿搭/鞋服", "通用商品"]:
        mid = "情绪价值"
        mid_desc = "用同款、审美、身份想象和场景氛围建立购买理由。"

    if has_bundle:
        end = "机制/权益收口"
    elif has_star:
        end = "信任收尾"
    elif re.search(r"护膝|护具|健身|训练|筋膜", t):
        end = "行动收口"
    else:
        end = "营销收口"

    return {
        "first3": first3,
        "mid": mid,
        "midDesc": mid_desc,
        "end": end,
        "productType": pt,
    }


def frame_analysis(row, tags, time):
    phase_map = {
        1: ("黄金1秒", f"用{tags['first3']}抓停用户"),
        3: ("钩子确认", "把开场信息和目标用户需求接上"),
        5: ("卖点出现", tags["midDesc"]),
        7: ("卖点展开", tags["midDesc"]),
        9: ("证据补强", "用细节、效果、同款、口碑或场景增强可信度"),
        11: ("购买理由", "给出差异化理由：材质、功能、舒适、颜值、便捷或价格"),
        13: ("收尾机制", f"进入{tags['end']}"),
        15: ("行动引导", "明确点击、领取、下单、进店或看详情"),
    }
    phase, objective = phase_map[time]
    return {"time": time, "phase": phase, "objective": objective}


def build_item(row, rank):
    tags = classify_stage(row)
    return {
        "rank": rank,
        "id": str(row["_md5"]),
        "customerKey": str(row["_customer"]),
        "ind": str(row["KPI三级行业"]),
        "ca": str(row["商品统一类目V2(一级～四级)"]),
        "pn": clean_name(row["DPA商品名称"]),
        "ml": str(row["素材MD5示意(预览)(翻译后)"]),
        "ctr": metric(row, "ctr(%)"),
        "cvr": metric(row, "综合目标转化率(%)"),
        "vtr": metric(row, "视频3秒完播率(%)"),
        "dur": metric(row, "平均播放时长(毫秒精度)(s)"),
        "roi": metric(row, "下单ROI"),
        "cs": round(float(row["消耗(元)"]), 2),
        "tags": tags,
        "keyframes": [frame_analysis(row, tags, t) for t in TIMES],
    }


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


def stage_stats(items, stage_key):
    total_cost = sum(i["cs"] for i in items) or 1
    counts = Counter(i["tags"][stage_key] for i in items)
    costs = defaultdict(float)
    examples = defaultdict(list)
    for i in items:
        label = i["tags"][stage_key]
        costs[label] += i["cs"]
        examples[label].append(i)
    stage_time = {"first3": 1, "mid": 5, "end": 13}[stage_key]
    labels = STAGE_LABELS[stage_key]
    out = []
    used = set()
    for label in labels:
        count = counts.get(label, 0)
        cand = sorted(examples.get(label, []), key=lambda x: x["cs"], reverse=True)
        ex = next((x for x in cand if x["id"] not in used), cand[0] if cand else None)
        if ex:
            used.add(ex["id"])
        example_items = cand[:3]
        out.append({
            "label": label,
            "count": count,
            "costShare": round(costs[label] / total_cost * 100, 1) if count else 0,
            "exampleRank": ex["rank"] if ex else 0,
            "exampleName": ex["pn"] if ex else "暂无代表素材",
            "exampleVideo": ex["ml"] if ex else "",
            "exampleTime": stage_time,
            "exampleProductType": ex["tags"]["productType"] if ex else "暂无样本",
            "examples": [{
                "rank": e["rank"],
                "name": e["pn"],
                "video": e["ml"],
                "time": stage_time,
                "productType": e["tags"]["productType"],
            } for e in example_items],
            "desc": STAGE_LABEL_DESC.get(label, ""),
            "hasSample": bool(ex),
        })
    return sorted(out, key=lambda x: (not x["hasSample"], -x["costShare"]))


def top_nonzero(items, n=3):
    nonzero = sorted([i for i in items if i.get("costShare", 0) > 0], key=lambda x: x["costShare"], reverse=True)
    return nonzero[:n] if nonzero else items[:n]


def stage_formula(items):
    first = top_nonzero(stage_stats(items, "first3"), 3)
    mid = top_nonzero(stage_stats(items, "mid"), 3)
    end = top_nonzero(stage_stats(items, "end"), 3)
    return {
        "title": "前三秒钩子 → 中段卖点展示 → 结尾转化收口",
        "first3": first,
        "mid": mid,
        "end": end,
        "suggestion": "先用前三秒建立注意力，再用中段解释产品为什么值得买，最后用权益、机制或行动入口完成转化。",
    }


def build_dataset(name, pool_df, benchmark_df, meta):
    pool50 = cap_by_customer(pool_df, 3, 50)
    benchmark50 = cap_by_customer(benchmark_df, 3, 50)
    own_items = [build_item(row, idx + 1) for idx, (_, row) in enumerate(pool50.iterrows())]
    bench_items = [build_item(row, idx + 1) for idx, (_, row) in enumerate(benchmark50.iterrows())]
    return {
        "name": name,
        "week": "06.22-06.28",
        "dataRules": {
            **meta,
            "dedupeRule": "素材MD5去重，保留消耗最高的一条",
            "customerCapRule": "同一客户最多保留3条（原表无客户字段，按DPA商品名称识别品牌/主体）",
            "benchmarkRule": "服饰大盘=排除运动户外、运动鞋服、运动用品后的服饰运动大盘素材；统计TOP50，逐帧拆解TOP10",
            "keyframeTimes": TIMES,
        },
        "totalCountAfterRules": len(pool_df),
        "analysisCount": len(own_items),
        "breakdownCount": 10,
        "topItems": own_items[:10],
        "stageAnalysis": {
            "first3": stage_stats(own_items, "first3"),
            "mid": stage_stats(own_items, "mid"),
            "end": stage_stats(own_items, "end"),
        },
        "stageFormula": stage_formula(own_items),
        "apparelBenchmark": {
            "name": "服饰运动大盘参考",
            "analysisCount": len(bench_items),
            "breakdownCount": 10,
            "topItems": bench_items[:10],
            "stageAnalysis": {
                "first3": stage_stats(bench_items, "first3"),
                "mid": stage_stats(bench_items, "mid"),
                "end": stage_stats(bench_items, "end"),
            },
            "stageFormula": stage_formula(bench_items),
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
    ind = df["KPI三级行业"].astype(str)
    ca = df["商品统一类目V2(一级～四级)"].astype(str)
    shoes = df[ind.str.contains("运动鞋服", na=False)].copy()
    goods = df[ind.str.contains("运动用品", na=False)].copy()
    benchmark = df[
        ~ind.str.contains("运动鞋服|运动用品|运动户外", na=False)
        & ~ca.str.contains("运动户外", na=False)
    ].copy()
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
