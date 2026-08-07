function getZiweiChartData(gender, dateVal, timeVal) {
    const [year, month, day] = dateVal.split("-").map(Number);
    const [hour, minute] = timeVal.split(":").map(Number);

    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();

    const gzYear = lunar.getYearInGanZhi();
    const yearGan = gzYear.charAt(0);
    const yearZhi = gzYear.charAt(1);
    const gzMonth = lunar.getMonthInGanZhi();
    const gzDay = lunar.getDayInGanZhi();
    const gzTime = lunar.getTimeInGanZhi();
    const timeZhi = lunar.getTimeZhi();

    const monthNum = lunar.getMonth();
    const dayNum = lunar.getDay();

    const zhiIndexMap = { "子": 0, "丑": 1, "寅": 2, "卯": 3, "辰": 4, "巳": 5, "午": 6, "未": 7, "申": 8, "酉": 9, "戌": 10, "亥": 11 };
    const ganIndexMap = { "甲": 0, "乙": 1, "丙": 2, "丁": 3, "戊": 4, "己": 5, "庚": 6, "辛": 7, "壬": 8, "癸": 9 };

    const timeZhiIdx = zhiIndexMap[timeZhi];

    let mingGongIdx = (2 + (monthNum - 1) - timeZhiIdx + 120) % 12;
    let shenGongIdx = (2 + (monthNum - 1) + timeZhiIdx) % 12;

    const tigerGans = ["丙", "戊", "庚", "壬", "甲"];
    const tigerGanStart = tigerGans[ganIndexMap[yearGan] % 5];
    const tigerStartIdx = ganIndexMap[tigerGanStart];

    const distFromYin = (mingGongIdx - 2 + 12) % 12;
    const mingGongGan = ZIWEI_DICT.stems[(tigerStartIdx + distFromYin) % 10];
    const mingGongGanzhi = mingGongGan + ZIWEI_DICT.branches[mingGongIdx];

    const bureauNum = ZIWEI_DICT.nayinBureau[mingGongGanzhi] || 2;
    const bureauNames = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };

    const stemYang = ["甲", "丙", "戊", "庚", "壬"];
    const isYangStem = stemYang.includes(yearGan);
    const isMale = (gender === "male" || gender === "男");
    const isShun = (isMale && isYangStem) || (!isMale && !isYangStem);

    let ziweiIdx = 0;
    const remainder = dayNum % bureauNum;
    if (remainder === 0) {
        let quotient = dayNum / bureauNum;
        ziweiIdx = (2 + quotient - 1) % 12;
    } else {
        let add = bureauNum - remainder;
        let quotient = Math.floor((dayNum + add) / bureauNum);
        if (add % 2 === 1) {
            ziweiIdx = (2 + quotient - 1 - add + 120) % 12;
        } else {
            ziweiIdx = (2 + quotient - 1 + add) % 12;
        }
    }
    let tianfuIdx = (4 - ziweiIdx + 12) % 12;

    const palaceMap = {};
    ZIWEI_DICT.branches.forEach((b, idx) => {
        palaceMap[b] = { branch: b, name: "", isShenGong: (idx === shenGongIdx), stars: [] };
    });

    ZIWEI_DICT.palaces.forEach((pName, pIdx) => {
        let bIdx = (mingGongIdx - pIdx + 120) % 12;
        const bName = ZIWEI_DICT.branches[bIdx];
        palaceMap[bName].name = pName;
    });

    const currentCalendarYear = new Date().getFullYear(); 
    const currentAge = currentCalendarYear - year + 1;    

    let activeDaYunStr = "";
    const orderedPalaceList = [];

    // 核心修正：大限必须从“命宫”所在的地支索引开始，顺行或逆行每10年步进一宫
    ZIWEI_DICT.branches.forEach((bName, bIdx) => {
        const pObj = palaceMap[bName];
        
        let step = 0;
        if (isShun) {
            step = (bIdx - mingGongIdx + 12) % 12;
        } else {
            step = (mingGongIdx - bIdx + 12) % 12;
        }

        let startAge = bureauNum + step * 10;
        let endAge = startAge + 9;
        let startYear = year + startAge - 1;
        let endYear = year + endAge - 1;
        let daYunText = `${startAge}-${endAge}岁`;

        if (currentAge >= startAge && currentAge <= endAge) {
            activeDaYunStr = `${startAge} - ${endAge} 岁 (${startYear}年 - ${endYear}年) -> [${pObj.name}]`;
        }

        let pIndex = ZIWEI_DICT.palaces.indexOf(pObj.name);

        orderedPalaceList.push({
            order: pIndex >= 0 ? pIndex + 1 : 1,
            name: pObj.name,
            branch: bName,
            daYunText: daYunText,
            isShenGong: pObj.isShenGong,
            palaceRef: pObj
        });
    });

    orderedPalaceList.sort((a, b) => a.order - b.order);

    const addStar = (branchIdx, starName, starType) => {
        const bName = ZIWEI_DICT.branches[(branchIdx + 120) % 12];
        const sihua = ZIWEI_DICT.siHuaMap?.[yearGan]?.[starName] || "";
        const brightness = ZIWEI_DICT.brightnessMap?.[starName]?.[bName] || "平";

        palaceMap[bName].stars.push({
            name: starName,
            type: starType,
            sihua: sihua,
            brightness: brightness
        });
    };

    ZIWEI_DICT.ziweiGroup.forEach(s => addStar(ziweiIdx + s.offset, s.name, 'main'));
    ZIWEI_DICT.tianfuGroup.forEach(s => addStar(tianfuIdx + s.offset, s.name, 'main'));

    addStar(10 - timeZhiIdx, "文昌", 'good');
    addStar(4 + timeZhiIdx, "文曲", 'good');
    addStar(4 + (monthNum - 1), "左辅", 'good');
    addStar(10 - (monthNum - 1), "右弼", 'good');

    const kuiYueMap = { "甲": [1, 7], "乙": [0, 8], "丙": [11, 9], "丁": [11, 9], "戊": [1, 7], "己": [0, 8], "庚": [1, 7], "辛": [6, 2], "壬": [3, 5], "癸": [3, 5] };
    if (kuiYueMap[yearGan]) {
        addStar(kuiYueMap[yearGan][0], "天魁", 'good');
        addStar(kuiYueMap[yearGan][1], "天钺", 'good');
    }

    const luCunMap = { "甲": 2, "乙": 3, "丙": 5, "丁": 6, "戊": 5, "己": 6, "庚": 8, "辛": 9, "壬": 11, "癸": 0 };
    const luCunIdx = luCunMap[yearGan];
    addStar(luCunIdx, "禄存", 'good');
    addStar(luCunIdx + 1, "擎羊", 'bad');
    addStar(luCunIdx - 1, "陀罗", 'bad');

    addStar(11 - timeZhiIdx, "地空", 'bad');
    addStar(11 + timeZhiIdx, "地劫", 'bad');

    const huoStartMap = { "寅": 1, "午": 1, "戌": 1, "申": 2, "子": 2, "辰": 2, "巳": 3, "酉": 3, "丑": 3, "亥": 9, "卯": 9, "未": 9 };
    const lingStartMap = { "寅": 3, "午": 3, "戌": 3, "申": 10, "子": 10, "辰": 10, "巳": 10, "酉": 10, "丑": 10, "亥": 10, "卯": 10, "未": 10 };
    addStar((huoStartMap[yearZhi] || 1) + timeZhiIdx, "火星", 'bad');
    addStar((lingStartMap[yearZhi] || 3) + timeZhiIdx, "铃星", 'bad');

    addStar((3 + (12 - zhiIndexMap[yearZhi])) % 12, "红鸾", 'sub');
    addStar((3 + (12 - zhiIndexMap[yearZhi]) + 6) % 12, "天喜", 'sub');

    let yinyangGender = isMale ? (isYangStem ? "阳男" : "阴男") : (isYangStem ? "阳女" : "阴女");
    const fourMap = { "寅": "四马地", "申": "四马地", "巳": "四马地", "亥": "四马地", "子": "四花地", "午": "四花地", "卯": "四花地", "酉": "四花地", "辰": "四墓地", "戌": "四墓地", "丑": "四墓地", "未": "四墓地" };
    const mingZhuMap = { "子": "贪狼", "丑": "巨门", "寅": "禄存", "卯": "文曲", "辰": "廉贞", "巳": "武曲", "午": "破军", "未": "武曲", "申": "廉贞", "酉": "文曲", "戌": "禄存", "亥": "巨门" };
    const shenZhuMap = { "子": "铃星", "丑": "天相", "寅": "天梁", "卯": "天同", "辰": "天机", "巳": "天机", "午": "火星", "未": "天相", "申": "天梁", "酉": "天同", "戌": "天机", "亥": "天机" };

    const nowSolar = Solar.fromDate(new Date());
    const nowLunar = nowSolar.getLunar();
    const curLiuNianStr = `${currentCalendarYear} ${nowLunar.getYearInGanZhi()}年 (虚岁 ${currentAge} 岁)`;

    const mingGongBranch = ZIWEI_DICT.branches[mingGongIdx];

    return {
        userInfo: {
            genderStr: yinyangGender,
            palaceCategory: fourMap[mingGongBranch] || "四墓地",
            mingZhu: mingZhuMap[mingGongBranch] || "禄存",
            shenZhu: shenZhuMap[yearZhi] || "火星",
            solarStr: `${year}年${month}月${day}日 ${timeVal}`,
            lunarStr: `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${timeZhi}时`,
            ganzhiStr: `${gzYear}年 ${gzMonth}月 ${gzDay}日 ${gzTime}时`,
            bureauStr: `${bureauNames[bureauNum]} (${mingGongGanzhi})`,
            activeDaYunStr: activeDaYunStr || "暂未入限",
            curLiuNianStr: curLiuNianStr
        },
        palaceMap,
        orderedPalaceList
    };
}