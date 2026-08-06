// 全局状态管理
let state = {
    currentMainTab: 'mingpan', // 'mingpan' | 'yuncheng'
    currentSubTab: 'summary',  // 'summary' | 宫位名称
    selectedBranch: '申',       // 当前选中的宫位地支
    selectedDaxian: '35-44',
    selectedLiunian: '2026',
    selectedLiuyue: '8'
};

// 页面加载自动初始化
document.addEventListener("DOMContentLoaded", () => {
    initSubTabs();
    initYunchengOptions();
    calculateAndRender();
});

// 1. 初始化 13 个子 TAB
function initSubTabs() {
    const container = document.getElementById("sub-tabs-container");
    if (!container) return;

    let html = `<button id="sub-tab-summary" class="sub-tab-btn active" onclick="switchSubTab('summary')">总结解盘</button>`;
    ZIWEI_DICT.palaceNames.forEach(palace => {
        html += `<button id="sub-tab-${palace}" class="sub-tab-btn" onclick="switchSubTab('${palace}')">${palace}</button>`;
    });

    container.innerHTML = html;
}

// 2. 初始化运程三级下拉菜单
function initYunchengOptions() {
    const daxianSelect = document.getElementById("select-daxian");
    const liunianSelect = document.getElementById("select-liunian");
    const liuyueSelect = document.getElementById("select-liuyue");

    if (!daxianSelect || !liunianSelect || !liuyueSelect) return;

    daxianSelect.innerHTML = ["15-24", "25-34", "35-44 (当前)", "45-54", "55-64"].map(r => `<option value="${r}">${r}岁大限</option>`).join("");
    daxianSelect.value = "35-44 (当前)";

    liunianSelect.innerHTML = [2024, 2025, 2026, 2027, 2028].map(y => `<option value="${y}" ${y === 2026 ? 'selected' : ''}>${y}流年</option>`).join("");

    let mHtml = "";
    for (let m = 1; m <= 12; m++) {
        mHtml += `<option value="${m}" ${m === 8 ? 'selected' : ''}>农历${m}月</option>`;
    }
    liuyueSelect.innerHTML = mHtml;
}

// 3. 一级 Main Tab 切换
function switchMainTab(tab) {
    state.currentMainTab = tab;
    document.getElementById("tab-btn-mingpan").classList.toggle("active", tab === 'mingpan');
    document.getElementById("tab-btn-yuncheng").classList.toggle("active", tab === 'yuncheng');

    const controls = document.getElementById("yuncheng-controls");
    if (tab === 'yuncheng') {
        controls.classList.remove("hidden");
    } else {
        controls.classList.add("hidden");
    }

    calculateAndRender();
}

// 4. 运程改变
function onYunchengChange() {
    state.selectedDaxian = document.getElementById("select-daxian").value;
    state.selectedLiunian = document.getElementById("select-liunian").value;
    state.selectedLiuyue = document.getElementById("select-liuyue").value;
    calculateAndRender();
}

// 5. 点击选中某个宫位
function selectPalace(branch) {
    state.selectedBranch = branch;

    // 高亮宫位
    document.querySelectorAll(".cell").forEach(c => c.classList.remove("selected-cell"));
    const cell = document.getElementById(`cell-${branch}`);
    if (cell) cell.classList.add("selected-cell");

    // 更新备注与解盘
    updateSihuaRemarks(branch);
}

// 6. 切换 13 个子 TAB 解盘
function switchSubTab(tabKey) {
    state.currentSubTab = tabKey;

    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById(`sub-tab-${tabKey}`);
    if (activeBtn) activeBtn.classList.add("active");

    const box = document.getElementById("tab-content-box");
    const text = ZIWEI_DICT.palaceExplanations[tabKey] || "暂无断语。";
    const prefix = state.currentMainTab === 'yuncheng' ? `【${state.selectedLiunian}运程解盘】` : '【本命局解盘】';

    box.innerHTML = `<h3>${prefix} ${tabKey === 'summary' ? '全局总结' : tabKey + '分析'}</h3><p>${text}</p>`;
}

// 7. 核心排盘与渲染引擎
function calculateAndRender() {
    const viewTag = document.getElementById("info-current-view");
    if (viewTag) {
        viewTag.textContent = state.currentMainTab === 'mingpan' ? "本命盘模式" : `${state.selectedLiunian} 流年运程`;
    }

    const branches = ZIWEI_DICT.earthlyBranches;
    const palaces = ZIWEI_DICT.palaceNames;
    let mingIndex = branches.indexOf("申"); // 默认命宫在申

    branches.forEach((branch, index) => {
        const cell = document.getElementById(`cell-${branch}`);
        if (!cell) return;

        let palaceOffset = (mingIndex - index + 12) % 12;
        let palaceName = palaces[palaceOffset];

        let starsHTML = getDemoStarsHTML(branch);

        cell.innerHTML = `
            <div class="cell-header">
                <span class="cell-palace-name">${palaceName}</span>
                <span class="cell-branch">${branch}</span>
            </div>
            <div class="stars-container">
                ${starsHTML}
            </div>
            <div class="cell-footer">
                <span>${(index + 1) * 10 - 5}-${(index + 1) * 10 + 4}</span>
                <span>大限</span>
            </div>
        `;
    });

    selectPalace(state.selectedBranch);
    switchSubTab(state.currentSubTab);
}

// 生成星曜与四化
function getDemoStarsHTML(branch) {
    if (branch === "辰") {
        return `<span class="star-item star-main">太阳</span><span class="star-item star-main">天梁</span>
                <span class="sihua sihua-ji">忌</span>`; // 化忌
    } else if (branch === "巳") {
        return `<span class="star-item star-main">天机</span><span class="star-item star-main">太阴</span>
                <span class="sihua sihua-lu">禄</span><span class="sihua sihua-zi">自化忌</span>`; // 自化
    } else if (branch === "申") {
        return `<span class="star-item star-main">破军</span><span class="star-item star-minor">禄存</span>
                <span class="sihua sihua-lu">禄</span><span class="sihua sihua-ke">科</span>`; // 2化
    } else if (branch === "午") {
        return `<span class="star-item star-main">紫微</span><span class="star-item star-minor">左辅</span>
                <span class="sihua sihua-quan">权</span>`;
    }
    return `<span class="star-item star-main">天同</span><span class="star-item star-main">巨门</span>`;
}

// 8. 实时更新四化、化忌、自化与飞星化备注栏
function updateSihuaRemarks(branch) {
    const container = document.getElementById("sihua-notes-content");
    if (!container) return;

    let html = "";

    if (branch === "辰") {
        html = `<div><span class="badge-tag sihua-ji">生年化忌</span> <b>辰宫（迁移）</b> 坐太阳化忌：外出注意人际口舌，防范情绪压力。</div>`;
    } else if (branch === "巳") {
        html = `<div><span class="badge-tag sihua-lu">生年化禄</span> <span class="badge-tag sihua-zi">自化忌</span> <b>巳宫（疾厄）</b> 出现<b>禄忌抵消/自化</b>：注意身体代谢与情绪波动。</div>`;
    } else if (branch === "申") {
        html = `<div><span class="badge-tag sihua-lu">双化碰撞</span> <b>申宫（命宫）</b> 见化禄+化科：贵人运极强，才华易被认可。</div>`;
    } else {
        html = `<div><b>${branch}宫</b>：本宫无生年化忌与离心自化，飞星平稳。全盘重点请关注 <b>辰宫(化忌)</b> 与 <b>巳宫(自化忌)</b> 的引动。</div>`;
    }

    container.innerHTML = html;
}