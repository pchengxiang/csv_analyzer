const element = document.querySelector("#example-table");

// 1. 定義表格數據
// var tabledata = [
//     {id:1, name: "張小明", age: "25", gender: "男", rating: 3, col: "green"},
//     {id:2, name: "李小華", age: "30", gender: "女", rating: 4, col: "blue"},
//     {id:3, name: "王大明", age: "28", gender: "男", rating: 5, col: "red"},
// ];

// var table = new Tabulator(document.querySelector("#example-table"), {
//     data: tabledata,          // 載入資料
//     layout: "fitColumns",     // 欄位寬度自動調整以填滿容器
//     pagination: "local",      // 啟用本地分頁
//     paginationSize: 5,        // 每頁顯示 5 筆
//     movableColumns: true,     // 允許拖曳交換欄位順序
//     columns: [   {formatter: "rowSelection", titleFormatter: "rowSelection", hozAlign: "center", headerSort: false, width: 40},
//         {title: "編號", field: "id", width: 70, hozAlign: "center"},
//         {title: "姓名", field: "name", editor: "input"}, // editor="input" 支援直接點擊修改
//         {title: "年齡", field: "age", hozAlign: "center", sorter: "number"},
//         {title: "性別", field: "gender", hozAlign: "center"},
//         {title: "評分", field: "rating", formatter: "star", hozAlign: "center", editor: true},
//     ],
// });             // 定義表格欄位

chartButton = document.querySelector("#to_chart")

tableButton = document.querySelector("#to_table")

chartContainer = document.querySelector("#chart-container")

tableContainer= document.querySelector("#table-container")

const averageButton = document.querySelector("#average");
const sidebar = document.querySelector("#analysis-sidebar");
const closeButton = document.querySelector("#close_sidebar");
const fieldOptions = document.querySelector("#field-options");
let csvData = [];

// 切換到圖表模式
chartButton.addEventListener("click", () => {
    chartContainer.style.display = "block";
    tableContainer.style.display = "none";

    if (chart) {
        chart.resize();
    }
});

// 切換到資料表模式
tableButton.addEventListener("click", () => {
    chartContainer.style.display = "none";
    tableContainer.style.display = "block";

    if (table) {
        table.redraw(true);
    }
});

averageButton.addEventListener("click",function(){
    sidebar.classList.add("active")
    if (csvData.length) showFields(csvData);
})

closeButton.addEventListener("click", function(){
    sidebar.classList.remove("active")
})

function showFields(data) {
    fieldOptions.replaceChildren();
    const fields = Object.keys(data[0] || {}).filter(field =>
        data.some(row => row[field] !== "" && row[field] != null && Number.isFinite(Number(row[field])))
    );
    if (!fields.length) {
        fieldOptions.textContent = "找不到可計算平均值的數值欄位。";
        return;
    }
    const prompt = document.createElement("p");
    prompt.textContent = "請選擇要計算平均值的欄位：";
    fieldOptions.appendChild(prompt);
    fields.forEach(field => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = field;
        button.addEventListener("click", () => showFieldAverage(data, field));
        fieldOptions.appendChild(button);
    });
}

function showFieldAverage(data, field) {
    const average = calculateAverage(data, field);
    fieldOptions.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = `${field} 平均值`;
    fieldOptions.appendChild(heading);
    if (average === null) {
        const message = document.createElement("p");
        message.textContent = "此欄位沒有可計算的數值。";
        fieldOptions.appendChild(message);
    } else {
        const result = document.createElement("p");
        result.textContent = average.toLocaleString(undefined, { maximumFractionDigits: 4 });
        fieldOptions.appendChild(result);
    }
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.textContent = "返回欄位列表";
    backButton.addEventListener("click", () => showFields(data));
    fieldOptions.appendChild(backButton);
}

function calculateAverage(data, field) {

    const values = data
        .map(row => row[field] === "" || row[field] == null ? NaN : Number(row[field]))
        .filter(value => Number.isFinite(value));

    if (values.length === 0) return null;

    const total = values.reduce(
        (sum, value) => sum + value, 0
    );

    return total / values.length;
}



input = document.querySelector("#csv-export")

input.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,

        complete: function(results) {

        chartContainer.style.display = "block";
        tableContainer.style.display = "none";
        
        const data = results.data;
        csvData = data;
        fieldOptions.replaceChildren();

        // 自動取得 CSV 欄位名稱
        const columns = results.meta.fields.map(field => ({
            title: field,
            field: field,
            headerFilter: true
        }));

        // 建立表格
        const table = new Tabulator("#example-table", {
            data: data,
            columns: columns,
            layout: "fitDataStretch",
            pagination: true,
            paginationSize: 15
        });

         // 2. Chart.js
        const taiwanData = data.filter(
            row => row.Entity === "Taiwan"
        );

        const canvas = document.querySelector("#myChart");
        const ctx = canvas.getContext("2d");
        //TODO:label和row[]沒有抽象化
        chart = new Chart(
            ctx,
            {
                type: "line",

                data: {
                    labels: taiwanData.map(row => row.Year),

                    datasets: [{
                        label: "Taiwan Life Expectancy",
                        data: taiwanData.map(
                            row => row["Life expectancy"]
                        )
                    }]
                },
                 options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            }
        );

        //3.tabulator和chart
        table.on("cellEdited", function() {

            const updatedData = table.getData();

            const taiwanData = updatedData.filter(
                row => row.Entity === "Taiwan"
            );

            chart.data.labels = taiwanData.map(
                row => row.Year
            );

            chart.data.datasets[0].data = taiwanData.map(
                row => row.Population
            );

            chart.update();
        });

        }
    });

});
