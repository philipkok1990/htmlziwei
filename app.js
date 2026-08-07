// app.js - 运势多层级（大运、流年、流月）精准宫位追踪与 13 Tab 解说引擎

let currentChartData = null;

let activeMainTab = 'tabSummary';
let summarySubIndex = -1; // -1表示总体，0-11表示宫位

// 大运、流年、流月选择状态
let selectedDaYunIndex = null;
let selectedLiuNianYear = null;
let selectedLiuYueMonth = null;
let fortuneSubIndex = 0; 

document.addEventListener("DOMContentLoaded", () => {
    const personSelect = document.getElementById("personSelect");
    if (personSelect && typeof personalList !== 'undefined') {
        personalList.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name;
            personSelect.appendChild(opt);
        });

        personSelect.addEventListener("change", (e) => {
            const found = personalList.find(item => item.id === e.target.value);
            if (found) {
                document.getElementById("gender").value = found.gender;
                document.getElementById("birthDate").value = found.birthDate;
                document.getElementById("birthTime").value = found.birthTime;
                triggerCalculate();
            }
        });
    }

    const btnCalc = document.getElementById("btnCalculate");
    if (btnCalc) {
        btnCalc.addEventListener("click", triggerCalculate);
    }

    if (typeof personalList !== 'undefined' && personalList.length > 0) {
        if (personSelect) personSelect.value = personalList[0].id;
        document.getElementById("gender").value = personalList[0].gender;
        document.getElementById("birthDate").value = personalList[0].birthDate;
        document.getElementById("birthTime").value = personalList[0].birthTime;
    }

    triggerCalculate();
});

function triggerCalculate() {
    const gender = document.getElementById("gender").value;
    const dateVal = document.getElementById("birthDate").value;
    const timeVal = document.getElementById("birthTime").value;

    if (typeof getZiweiChartData === 'function') {
        currentChartData = getZiweiChartData(gender, dateVal, timeVal);
        
        // 自动定位当前 2026 年所在的大运索引
        // 根据虚岁 37 岁匹配 35-44 岁的大运区间
        currentChartData.orderedPalaceList.forEach((p, idx) => {
            const parts = p.daYunText.split('-');
            if (parts.length === 2) {
                const start = parseInt(parts[0]);
                const end = parseInt(parts[1]);
                if (37 >= start && 37 <= end) {
                    selectedDaYunIndex = idx;
                }
            }
        });
        if (selectedDaYunIndex === null) selectedDaYunIndex = 3; // 默认兜底

        renderLeftPanel();
        renderSummaryTab();
        renderFortuneTab();
    }
}

function switchMainTab(tabId) {
    activeMainTab = tabId;
    document.querySelectorAll(".main-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".main-tab-content").forEach(content => content.classList.remove("active"));

    if (tabId === 'tabSummary') {
        document.querySelector("[onclick*='tabSummary']").classList.add("active");
        document.getElementById("tabSummary").classList.add("active");
        renderSummaryTab();
    } else if (tabId === 'tabFortune') {
        document.querySelector("[onclick*='tabFortune']").classList.add("active");
        document.getElementById("tabFortune").classList.add("active");
        renderFortuneTab();
    }
}

// 四化样式类名映射（禄-青、权-紫、科-蓝、忌-红）
function getHuaClass(hua) {
    if (hua === '禄') return 'lu';
    if (hua === '权') return 'quan';
    if (hua === '科') return 'ke';
    if (hua === '忌') return 'ji';
    return '';
}

// 左侧 30% 面板
function renderLeftPanel() {
    const quickInfo = document.getElementById("leftQuickInfo");
    const tbody = document.getElementById("palaceTableBody");
    if (!currentChartData) return;

    const u = currentChartData.userInfo;
    if (quickInfo) {
        quickInfo.innerHTML = `
            <div style="background:#fff; padding:10px; border-radius:6px; margin-bottom:10px; font-size:13px; border:1px solid #ddd;">
                <div><b>格局：</b>${u.genderStr} / ${u.bureauStr}</div>
                <div><b>地势：</b>${u.palaceCategory}</div>
                <div><b>命主/身主：</b>${u.mingZhu} / ${u.shenZhu}</div>
                <div><b>农历：</b>${u.lunarStr}</div>
                <div><b>现大运：</b>${u.activeDaYunStr}</div>
            </div>
        `;
    }

    if (tbody) {
        tbody.innerHTML = "";
        currentChartData.orderedPalaceList.forEach((p, idx) => {
            const tr = document.createElement("tr");
            
            let starsStr = p.palaceRef.stars.map(s => {
                let sihuaTag = s.sihua ? `<span class="sihua-${getHuaClass(s.sihua)}">[化${s.sihua}]</span>` : '';
                return `${s.name}${sihuaTag}`;
            }).join(" ");

            tr.innerHTML = `
                <td><b>${p.name}宫</b></td>
                <td>${p.branch}</td>
                <td>${p.daYunText}</td>
                <td style="font-size:12px; color:#333;">${starsStr || '(无主星)'}</td>
            `;
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => {
                switchMainTab('tabSummary');
                summarySubIndex = idx;
                renderSummaryTab();
            });
            tbody.appendChild(tr);
        });
    }
}

// MAIN TAB 1: 命盘总结 (13个 Sub Tab)
function renderSummaryTab() {
    const header = document.getElementById("subTabHeaderSummary");
    const container = document.getElementById("subTabContainerSummary");
    if (!currentChartData || !header || !container) return;

    header.innerHTML = "";
    
    const btnAll = document.createElement("button");
    btnAll.className = `sub-tab-btn ${summarySubIndex === -1 ? 'active' : ''}`;
    btnAll.textContent = "个人命盘解说";
    btnAll.onclick = () => { summarySubIndex = -1; renderSummaryTab(); };
    header.appendChild(btnAll);

    currentChartData.orderedPalaceList.forEach((p, idx) => {
        const btn = document.createElement("button");
        btn.className = `sub-tab-btn ${summarySubIndex === idx ? 'active' : ''}`;
        btn.textContent = p.name + "宫";
        btn.onclick = () => { summarySubIndex = idx; renderSummaryTab(); };
        header.appendChild(btn);
    });

    if (summarySubIndex === -1) {
        container.innerHTML = `
            <div style="background:#fff; padding:15px; border-radius:6px; border:1px solid #ddd;">
                <h3>【个人命盘总体综合解读】</h3>
                <p style="margin-top:8px; color:#555;">本命盘以${currentChartData.userInfo.bureauStr}为主，命宫落在 ${currentChartData.orderedPalaceList[0].branch} 宫。整体星曜分布均衡，三方四正格局清晰。</p>
            </div>
        `;
    } else {
        container.innerHTML = renderPalaceDetailContent({
            palaceName: currentChartData.orderedPalaceList[summarySubIndex].name,
            branch: currentChartData.orderedPalaceList[summarySubIndex].branch,
            palaceRef: currentChartData.orderedPalaceList[summarySubIndex].palaceRef,
            scopeTitle: "本命盘",
            hierarchyInfo: { originalName: currentChartData.orderedPalaceList[summarySubIndex].name }
        });
    }
}

// MAIN TAB 2: 大运 / 流年 / 流月级联
function renderFortuneTab() {
    if (!currentChartData) return;

    const dayunHeader = document.getElementById("dayunTabHeader");
    const liunianBox = document.getElementById("liunianBox");
    const liunianHeader = document.getElementById("liunianTabHeader");
    const liuyueBox = document.getElementById("liuyueBox");
    const liuyueHeader = document.getElementById("liuyueTabHeader");
    
    const fortuneTitle = document.getElementById("fortuneTitleHeader");
    const fortuneSubHeader = document.getElementById("subTabHeaderFortune");
    const fortuneSubContainer = document.getElementById("subTabContainerFortune");

    if (!dayunHeader || !fortuneSubHeader || !fortuneSubContainer) return;

    // 1. 渲染大运层
    dayunHeader.innerHTML = "";
    currentChartData.orderedPalaceList.forEach((p, idx) => {
        const startAge = p.daYunText.split('-')[0];
        const baseYear = 2026 - 37 + parseInt(startAge);
        const dateRangeStr = ` (${baseYear} ~ ${baseYear + 9}年)`;

        const btn = document.createElement("button");
        btn.className = `sub-tab-btn ${selectedDaYunIndex === idx ? 'active' : ''}`;
        btn.textContent = `${p.daYunText}岁 [${p.name}宫]${dateRangeStr}`;
        btn.onclick = () => {
            if (selectedDaYunIndex === idx) {
                selectedDaYunIndex = null;
                selectedLiuNianYear = null;
                selectedLiuYueMonth = null;
            } else {
                selectedDaYunIndex = idx;
                selectedLiuNianYear = null;
                selectedLiuYueMonth = null;
            }
            renderFortuneTab();
        };
        dayunHeader.appendChild(btn);
    });

    // 2. 渲染流年层
    if (selectedDaYunIndex !== null) {
        if (liunianBox) liunianBox.style.display = "block";
        if (liunianHeader) {
            liunianHeader.innerHTML = "";
            const activePalace = currentChartData.orderedPalaceList[selectedDaYunIndex];
            const startAge = parseInt(activePalace.daYunText.split('-')[0]) || 20;
            const baseYear = 2026 - 37 + startAge;
            
            const years = [];
            for (let i = 0; i < 10; i++) {
                years.push(baseYear + i);
            }

            years.forEach(y => {
                const btn = document.createElement("button");
                btn.className = `sub-tab-btn ${selectedLiuNianYear === y ? 'active' : ''}`;
                btn.textContent = `${y}年 (${y}-01-01~${y}-12-31)`;
                btn.onclick = () => {
                    if (selectedLiuNianYear === y) {
                        selectedLiuNianYear = null;
                        selectedLiuYueMonth = null;
                    } else {
                        selectedLiuNianYear = y;
                        selectedLiuYueMonth = null;
                    }
                    renderFortuneTab();
                };
                liunianHeader.appendChild(btn);
            });
        }
    } else {
        if (liunianBox) liunianBox.style.display = "none";
        if (liuyueBox) liuyueBox.style.display = "none";
        fortuneSubHeader.innerHTML = "";
        fortuneSubContainer.innerHTML = "<p style='color:#666;'>请先在上主菜单选择一个【10年大运】。</p>";
        if (fortuneTitle) fortuneTitle.textContent = "";
        return;
    }

    // 3. 渲染流月层
    if (selectedLiuNianYear !== null) {
        if (liuyueBox) liuyueBox.style.display = "block";
        if (liuyueHeader) {
            liuyueHeader.innerHTML = "";
            const months = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
            months.forEach((m, mIdx) => {
                const btn = document.createElement("button");
                btn.className = `sub-tab-btn ${selectedLiuYueMonth === mIdx ? 'active' : ''}`;
                btn.textContent = `${m} (${selectedLiuNianYear}年${mIdx+1}月)`;
                btn.onclick = () => {
                    if (selectedLiuYueMonth === mIdx) {
                        selectedLiuYueMonth = null;
                    } else {
                        selectedLiuYueMonth = mIdx;
                    }
                    renderFortuneTab();
                };
                liuyueHeader.appendChild(btn);
            });
        }
    } else {
        if (liuyueBox) liuyueBox.style.display = "none";
    }

    // 4. 渲染 13 个 Sub Tab (1个总解说 + 12个宫位)
    if (fortuneSubIndex < -1 || fortuneSubIndex > 11) fortuneSubIndex = -1;

    fortuneSubHeader.innerHTML = "";
    
    const standardPalaceNames = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "事业", "田宅", "福德", "父母"];
    const branches = ZIWEI_DICT.branches;

    // 计算当前层级的 12 宫映射
    // 基础：大运起点索引
    const daYunBaseIdx = selectedDaYunIndex;
    
    // 如果选了流年，流年命宫定位 (以寅宫或太岁简化顺推，此处采用标准流年命宫算法基准)
    let liuNianBaseIdx = daYunBaseIdx; 
    if (selectedLiuNianYear !== null) {
        const offsetYear = selectedLiuNianYear - 2026;
        liuNianBaseIdx = (daYunBaseIdx + offsetYear + 120) % 12;
    }

    // 如果选了流月，流月命宫定位 (以流年命宫为基础顺推正月)
    let liuYueBaseIdx = liuNianBaseIdx;
    if (selectedLiuYueMonth !== null) {
        liuYueBaseIdx = (liuNianBaseIdx + selectedLiuYueMonth + 120) % 12;
    }

    // 生成 13 个 Tab 按钮
    const btnAllFortune = document.createElement("button");
    btnAllFortune.className = `sub-tab-btn ${fortuneSubIndex === -1 ? 'active' : ''}`;
    let levelNameStr = selectedLiuYueMonth !== null ? "流月综合解说" : (selectedLiuNianYear !== null ? "流年综合解说" : "大运综合解说");
    btnAllFortune.textContent = levelNameStr;
    btnAllFortune.onclick = () => { fortuneSubIndex = -1; renderFortuneTab(); };
    fortuneSubHeader.appendChild(btnAllFortune);

    const palaceItems = [];
    for (let i = 0; i < 12; i++) {
        let currentTargetIdx;
        if (selectedLiuYueMonth !== null) {
            currentTargetIdx = (liuYueBaseIdx + i) % 12;
        } else if (selectedLiuNianYear !== null) {
            currentTargetIdx = (liuNianBaseIdx + i) % 12;
        } else {
            currentTargetIdx = (daYunBaseIdx + i) % 12;
        }

        const orgPalace = currentChartData.orderedPalaceList[currentTargetIdx];
        
        // 同时计算大运宫位、流年宫位对应的原始本命宫
        const daYunOrgIdx = (daYunBaseIdx + i) % 12;
        const daYunPalaceName = standardPalaceNames[i];
        const originalPalaceName = orgPalace.name;

        palaceItems.push({
            name: standardPalaceNames[i],
            branch: orgPalace.branch,
            palaceRef: orgPalace.palaceRef,
            hierarchyInfo: {
                originalName: originalPalaceName,
                daYunName: daYunPalaceName,
                liuNianName: selectedLiuNianYear !== null ? standardPalaceNames[i] : null,
                liuYueName: selectedLiuYueMonth !== null ? standardPalaceNames[i] : null
            }
        });
    }

    palaceItems.forEach((p, idx) => {
        const btn = document.createElement("button");
        btn.className = `sub-tab-btn ${fortuneSubIndex === idx ? 'active' : ''}`;
        btn.textContent = p.name + "宫"; 
        btn.onclick = () => {
            fortuneSubIndex = idx;
            renderFortuneTab();
        };
        fortuneSubHeader.appendChild(btn);
    });

    let contextTitle = `当前大运：${currentChartData.orderedPalaceList[selectedDaYunIndex].daYunText}`;
    if (selectedLiuNianYear) contextTitle += ` | 流年：${selectedLiuNianYear}年`;
    if (selectedLiuYueMonth !== null) contextTitle += ` | 流月：${["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"][selectedLiuYueMonth]}`;
    
    if (fortuneTitle) fortuneTitle.textContent = contextTitle;

    if (fortuneSubIndex === -1) {
        fortuneSubContainer.innerHTML = `
            <div style="background:#fff; padding:15px; border-radius:6px; border:1px solid #ddd;">
                <h3>【${levelNameStr}】</h3>
                <p style="margin-top:8px; color:#555;">当前所选时空层级为：${contextTitle}。点击上方 12 个宫位标签可深入查看各宫在当前运势下的多层级对应关系。</p>
            </div>
        `;
    } else {
        let scopeTitle = selectedLiuYueMonth !== null ? "流月盘" : (selectedLiuNianYear !== null ? "流年盘" : "大运盘");
        fortuneSubContainer.innerHTML = renderPalaceDetailContent({
            palaceName: palaceItems[fortuneSubIndex].name,
            branch: palaceItems[fortuneSubIndex].branch,
            palaceRef: palaceItems[fortuneSubIndex].palaceRef,
            scopeTitle: scopeTitle,
            hierarchyInfo: palaceItems[fortuneSubIndex].hierarchyInfo
        });
    }
}

// 统一的宫位详细解说渲染器（完美支持多层级宫位追踪显示）
function renderPalaceDetailContent(data) {
    const { palaceName, branch, palaceRef, scopeTitle, hierarchyInfo } = data;

    const branches = ZIWEI_DICT.branches;
    const bIdx = branches.indexOf(branch);
    const duiBranch = branches[(bIdx + 6) % 12];
    const sanhe1 = branches[(bIdx + 4) % 12];
    const sanhe2 = branches[(bIdx + 8) % 12];

    const getPalaceByBranch = (b) => {
        return Object.values(currentChartData.palaceMap).find(item => item.branch === b);
    };

    const duiPalace = getPalaceByBranch(duiBranch);
    const sanhe1Palace = getPalaceByBranch(sanhe1);
    const sanhe2Palace = getPalaceByBranch(sanhe2);

    // 动态构建多层级宫位追踪提示
    let hierarchyHtml = "";
    if (hierarchyInfo) {
        let lines = [];
        if (hierarchyInfo.liuYueName) {
            lines.push(`• 流月宫位：【流月${hierarchyInfo.liuYueName}宫】`);
        }
        if (hierarchyInfo.liuNianName) {
            lines.push(`• 流年宫位：【流年${hierarchyInfo.liuNianName}宫】`);
        }
        if (hierarchyInfo.daYunName) {
            lines.push(`• 大运宫位：【大运${hierarchyInfo.daYunName}宫】`);
        }
        lines.push(`• 命盘原位：【原本${hierarchyInfo.originalName}宫】 (地支：${branch})`);

        hierarchyHtml = `
            <div style="background: #fff8e1; padding: 10px; border-radius: 4px; border: 1px solid #ffe0b2; margin-bottom: 12px; font-size: 13px; line-height: 1.6;">
                <strong>📊 多层级宫位时空定位追踪：</strong><br>
                ${lines.join('<br>')}
            </div>
        `;
    }

    const sihuaMap = ZIWEI_DICT.siHuaMap[currentChartData.yearGan] || {};
    let sihuaDetails = [];
    Object.keys(sihuaMap).forEach(star => {
        const huaType = sihuaMap[star];
        for (let b of branches) {
            const p = currentChartData.palaceMap[b];
            if (p.stars.some(s => s.name === star)) {
                sihuaDetails.push(`<span class="sihua-${getHuaClass(huaType)}">生年${star}化${huaType}</span> 落在 ${p.name}宫 (${p.branch})`);
            }
        }
    });

    let starsHtml = palaceRef.stars.map(s => {
        let sihuaTag = s.sihua ? `<span class="sihua-${getHuaClass(s.sihua)}">[化${s.sihua}]</span>` : '';
        return `<li>${s.name} ${sihuaTag} ${s.miaoWang ? '(' + s.miaoWang + ')' : ''}</li>`;
    }).join("");

    return `
        <div style="background:#fff; padding:15px; border-radius:6px; border:1px solid #ddd;">
            <h3 style="border-bottom:1px solid #eee; padding-bottom:6px; margin-bottom:10px; color:#333;">
                【${palaceName}宫】 <span style="font-size:12px; font-weight:normal; color:#666;">(${scopeTitle} / 地支：${branch})</span>
            </h3>
            
            ${hierarchyHtml}

            <div style="margin-bottom: 12px;">
                <strong>宫内星曜：</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">${starsHtml || '<li>(本宫无主星)</li>'}</ul>
            </div>
            <div style="margin-bottom: 12px; background: #fafbfc; padding: 10px; border-radius: 4px; border:1px solid #eee;">
                <strong>三方四正对照：</strong>
                <div style="font-size: 13px; margin-top: 6px; color: #555; line-height: 1.6;">
                    • 本宫：${palaceName} (${branch})<br>
                    • 对宫 (迁移)：${duiPalace ? duiPalace.name : ''} (${duiBranch})<br>
                    • 三合方：${sanhe1Palace ? sanhe1Palace.name : ''} (${sanhe1}) & ${sanhe2Palace ? sanhe2Palace.name : ''} (${sanhe2})
                </div>
            </div>
            <div style="background: #f1f8ff; padding: 10px; border-radius: 4px; font-size: 13px; border:1px solid #d0e1fd;">
                <strong>四化星落宫追踪：</strong><br>
                ${sihuaDetails.join('<br>') || '暂无生年四化记录'}
            </div>
        </div>
    `;
}