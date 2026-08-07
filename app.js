let currentChartData = null;

document.addEventListener("DOMContentLoaded", () => {
    initPersonDropdown();
    bindEvents();
    calculateAndRender();
});

function initPersonDropdown() {
    const personSelect = document.getElementById("personSelect");
    if (!personSelect) return;

    personSelect.innerHTML = '<option value="">-- 选择预设人员 --</option>';
    personalList.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.birthDate})`;
        personSelect.appendChild(opt);
    });

    personSelect.addEventListener("change", (e) => {
        const pId = e.target.value;
        const target = personalList.find(p => p.id === pId);
        if (target) {
            document.getElementById("gender").value = target.gender;
            document.getElementById("birthDate").value = target.birthDate;
            document.getElementById("birthTime").value = target.birthTime;
            calculateAndRender();
        }
    });
}

function bindEvents() {
    const btn = document.getElementById("btnCalculate");
    if (btn) {
        btn.addEventListener("click", calculateAndRender);
    }
}

function calculateAndRender() {
    const gender = document.getElementById("gender").value;
    const birthDate = document.getElementById("birthDate").value;
    const birthTime = document.getElementById("birthTime").value;

    if (!birthDate || !birthTime) {
        alert("请选择正确的日期与时间！");
        return;
    }

    currentChartData = getZiweiChartData(gender, birthDate, birthTime);
    renderLeftTable();
    renderRightSummary();
}

// 渲染左侧 30% 12 宫位基础 Table
function renderLeftTable() {
    const tbody = document.getElementById("palaceTableBody");
    if (!tbody || !currentChartData) return;

    tbody.innerHTML = "";
    currentChartData.orderedPalaceList.forEach((item) => {
        const tr = document.createElement("tr");
        tr.onclick = () => selectPalaceTab(item.name);

        const starHtmls = item.palaceRef.stars.map(s => {
            let sihuaBadge = "";
            if (s.sihua) {
                sihuaBadge = `<span class="sihua-tag sihua-${s.sihua}">化${s.sihua}</span>`;
            }
            return `${s.name}${s.brightness ? `[${s.brightness}]` : ''}${sihuaBadge}`;
        }).join(" ");

        tr.innerHTML = `
            <td><strong>${item.name}</strong> ${item.isShenGong ? '<span class="shen-mark">(身宫)</span>' : ''}</td>
            <td>${item.branch}</td>
            <td>${starHtmls || '无明显星曜'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 渲染右侧 Tab 1：命盘总结
function renderRightSummary() {
    switchRightTab('summary');
    const container = document.getElementById("tabSummaryContent");
    if (!container || !currentChartData) return;

    const u = currentChartData.userInfo;
    container.innerHTML = `
        <table class="summary-table">
            <tr><th>性别/阴阳</th><td>${u.genderStr}</td></tr>
            <tr><th>地势类别</th><td>${u.palaceCategory}</td></tr>
            <tr><th>命主</th><td>${u.mingZhu}</td></tr>
            <tr><th>身主</th><td>${u.shenZhu}</td></tr>
            <tr><th>阳历生辰</th><td>${u.solarStr}</td></tr>
            <tr><th>农历生辰</th><td>${u.lunarStr}</td></tr>
            <tr><th>干支八字</th><td>${u.ganzhiStr}</td></tr>
            <tr><th>五行局</th><td>${u.bureauStr}</td></tr>
        </table>
    `;
}

// 切换右侧 Tab (命盘总结 / 各宫位)
function switchRightTab(tabType) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

    if (tabType === 'summary') {
        document.getElementById("btnTabSummary")?.classList.add("active");
        document.getElementById("tabSummaryContent")?.classList.add("active");
    } else {
        document.getElementById("btnTabPalace")?.classList.add("active");
        document.getElementById("tabPalaceContent")?.classList.add("active");
    }
}

// 点击左侧宫位时右侧联动展开该宫位星曜
function selectPalaceTab(palaceName) {
    switchRightTab('palace');
    const container = document.getElementById("tabPalaceContent");
    if (!container || !currentChartData) return;

    const item = currentChartData.orderedPalaceList.find(p => p.name === palaceName);
    if (!item) return;

    const starsList = item.palaceRef.stars.map(s => {
        let sihuaBadge = "";
        if (s.sihua) {
            sihuaBadge = `<span class="sihua-tag sihua-${s.sihua}">化${s.sihua}</span>`;
        }
        return `<li><strong>${s.name}</strong> (${s.brightness || '平'}) ${sihuaBadge}</li>`;
    }).join("");

    container.innerHTML = `
        <h3>【${item.name}】 详细星曜解说 (宫位: ${item.branch})</h3>
        <table class="detail-table">
            <tr><th>宫位类型</th><td>${item.name} ${item.isShenGong ? '(身宫所在)' : ''}</td></tr>
            <tr><th>星曜列表</th><td><ul>${starsList || '<li>无主星/无重要星曜</li>'}</ul></td></tr>
        </table>
    `;
}