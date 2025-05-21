const starttable = 1; // 開始テーブル
const endtable = 1; // 終了テーブル
let wintable = []; // 当選テーブル
let paytable = []; // 出玉テーブル
let nowtable = starttable; // 現在のテーブル
let try_cnt = 0; // 試行回数
let consecutive_cnt = 0; // 連続当選回数
let result_pay = 0; // 出玉
let hit = false; // 当選フラグ
let end_flg = false; // 終了フラグ
let firsthit_cnt = 0; // 初当たり回数
let firsthit_sum = 0;

// titles.jsonのデータを取得してドロップダウンリストに追加
fetch('titles.json')
    .then(response => {
        if (!response.ok) throw new Error('titles.jsonの読み込みに失敗しました');
        return response.json();
    })
    .then(data => {
        const titleSelect = document.getElementById('titleSelect');
        data.forEach(title => {
            const option = document.createElement('option');
            option.value = title.title; // タイトルを値として設定
            option.textContent = title.title;
            titleSelect.appendChild(option);
        });

        // ドロップダウンリストの変更イベントを監視
        titleSelect.addEventListener('change', (event) => {
            const selectedTitle = event.target.value;
            if (selectedTitle) {
                loadJSON(selectedTitle);
                resetDisplay();
            }
        });
    })
    .catch(error => {
        console.error('titles.jsonの読み込みエラー:', error);
    });

// 動的にJSONファイルを読み込む関数
function loadJSON(title) {
    // [title]win.jsonを読み込む
    fetch(`${title}win.json`)
        .then(response => {
            if (!response.ok) throw new Error(`${title}win.jsonの読み込みに失敗しました`);
            return response.json();
        })
        .then(data => {
            wintable = data;
            console.log(`${title}win.jsonが読み込まれました`, wintable);
        })
        .catch(error => {
            document.getElementById('results').textContent = `${title}win.jsonの読み込みに失敗しました`;
            console.error(error);
        });

    // [title]pay.jsonを読み込む
    fetch(`${title}pay.json`)
        .then(response => {
            if (!response.ok) throw new Error(`${title}pay.jsonの読み込みに失敗しました`);
            return response.json();
        })
        .then(data => {
            paytable = data;
            console.log(`${title}pay.jsonが読み込まれました`, paytable);
        })
        .catch(error => {
            document.getElementById('results').textContent = `${title}pay.jsonの読み込みに失敗しました`;
            console.error(error);
        });
}
// 表示のリセット
function resetDisplay() {
    document.getElementById('now_01').innerHTML = 'ここに乱数が表示されます';
    document.getElementById('now_02').innerHTML = '<br>';
    document.getElementById('results').innerHTML = '';
    nowtable = starttable;
    try_cnt = 0;
    consecutive_cnt = 0;
    result_pay = 0;
    hit = false;
    end_flg = false;
    firsthit_cnt = 0;
    firsthit_sum = 0;
}

// キー押下
document.addEventListener('keydown', function (event) {
    if (event.key === '1') {
        lotate_once(1);
    } else if (event.key === '2') {
        lotate_once(5);
    } else if (event.key === '3') {
        lotate_once(10000);
    } else if (event.key === '4') {
        while (1) {
            lotate_once(10000);
            if (end_flg) {
                break;
            }
        }
    }
});

// ボタン押下
document.getElementById("once").addEventListener("click", () => {
    lotate_once(1);
});
document.getElementById("fifth").addEventListener("click", () => {
    lotate_once(5);
});
document.getElementById("tohit").addEventListener("click", () => {
    lotate_once(10000);
});
document.getElementById("toend").addEventListener("click", () => {
    while (1) {
        lotate_once(10000);
        if (end_flg) {
            break;
        }
    }
});

// 回転
function lotate_once(cnt) {
    end_flg = false;
    for (let i = 0; i < cnt; i++) {
        lottery();
        if (end_flg || hit) {
            break;
        }
    }
}

// 抽選処理
function lottery() {
    let cumulative1 = 0;
    let cumulative2 = 0;
    let rand1 = Math.random();
    let rand2 = Math.random();
    let pay = 0;

    if (hit) {
        try_cnt = 0;
    }
    try_cnt++;
    hit = false;

    for (let thishit of wintable) {
        if (thishit.table === nowtable) {
            limit = thishit.limit;
            limitud = thishit.ud;
            tablename = thishit.name;
            cumulative1 += thishit.nume / thishit.deno;
            if (rand1 < cumulative1) {
                hit = true;
                consecutive_cnt++;
                break;
            }
        }
    }
    if (hit) {
        firsthit_cnt++;
        firsthit_sum += try_cnt;
        for (let thispay of paytable) {
            if (thispay.table === nowtable) {
                pay = thispay.pay;
                cumulative2 += thispay.nume / thispay.deno;
                if (rand2 < cumulative2) {
                    result_pay += thispay.pay;
                    nowtable += thispay.ud;
                    break;
                }
            }
        }
    }
    document.getElementById('now_01').innerHTML =
        `回転数: ${try_cnt} 状態: ${tablename} 出玉: ${pay} 出玉合計: ${result_pay}`;
    document.getElementById('now_02').innerHTML =
        `連チャン数: ${consecutive_cnt} 乱数: ${(rand1 * 100).toFixed(2)} 確率${(cumulative1 * 100).toFixed(2)}`;

    if (hit) {
        document.getElementById('now_02').innerHTML +=
            `<font color="red"> 当たり </font>`;
    }
    if (try_cnt >= limit && !hit) {
        nowtable += limitud;
    }
    if (nowtable < endtable) {
        try_cnt = 0;
        nowtable = starttable;

        document.getElementById('results').innerHTML =
            `連チャン数: ${consecutive_cnt}  合計出玉: ${result_pay} <br>` + document.getElementById('results').innerHTML;

        consecutive_cnt = 0;
        result_pay = 0;
        end_flg = true;
    }
}