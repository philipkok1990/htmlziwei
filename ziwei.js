// 页面加载完成后自动排盘
document.addEventListener("DOMContentLoaded", () => {
    calculateAndRender();
});

function calculateAndRender() {
    // 默认数据：1990-04-24 12:15 PM (庚午年 三月 三十日 午时)
    const rawDate = document.getElementById("birthDate").value;
    
    // 模拟算法核心数据 (注：实际完整开发需引入农历转换库)
    const result = {
        yearStem: "庚",
        yearBranch: "午",
        lunarMonth: 3,
        lunarDay: 30,
        timeBranch: "午", // 12:15PM 为午时
        mingBranch: "申", // 简化示例算法所得
        shenBranch: "辰",
        wuxingJu: "路旁土 (五局)"
    };

    // 更新中宫显示
    document.getElementById("wuxing-text").innerText = result.wuxingJu;
    document.getElementById("ming-text").innerText = result.mingBranch;
    document.getElementById("shen-text").innerText = result.shenBranch;

    // 渲染十二宫
    renderPalaces(result);
}

function renderPalaces(data) {
    const branches = ZIWEI_DICT.earthlyBranches;
    const palaces = ZIWEI_DICT.palaceNames;
    
    // 定命宫 index (假设命宫在 申)
    let mingIndex = branches.indexOf(data.mingBranch);

    // 挨个渲染 12 个地支宫位
    branches.forEach((branch, index) => {
        const cell = document.getElementById(`cell-${branch}`);
        if (!cell) return;

        // 计算该地支对应的十二宫名称 (逆时针/顺时针分配)
        let palaceOffset = (mingIndex - index + 12) % 12;
        let palaceName = palaces[palaceOffset];

        // 简易测试星曜 (庚干四化: 太阳禄, 武曲权, 太阴科, 天同忌)
        let starsHTML = "";
        if (branch === "午") {
            starsHTML = `太阳 <span class="sihua sihua-lu">禄</span>`;
        } else if (branch === "申") {
            starsHTML = `武曲 <span class="sihua sihua-quan">权</span>`;
        } else if (branch === "子") {
            starsHTML = `太阴 <span class="sihua sihua-ke">科</span>`;
        } else if (branch === "辰") {
            starsHTML = `天同 <span class="sihua sihua-ji">忌</span>`;
        }

        // 写入 HTML 内容
        cell.innerHTML = `
            <div class="cell-header">
                <span class="cell-title">${palaceName}</span>
                <span class="cell-branch">${branch}</span>
            </div>
            <div class="stars-main">
                ${starsHTML}
            </div>
            <div class="cell-footer">
                <span>15-24</span>
                <span>大限/流年</span>
            </div>
        `;
    });
}