(function(){
    'use strict';
    var h = $("<div>").appendTo($("body")).css({
        "text-align": "center",
        padding: "1em",
    });
    function addBtn(title, func, parentNode){
        return $("<button>").text(title).click(func).appendTo(parentNode||h);
    }
    $("<h1>",{text:"マルコフ連鎖"}).appendTo(h);
    $("<div>",{text:"文を入力するとマルコフ連鎖します。"}).appendTo(h);
    h.append("<br>");
    $("<h2>",{text:"1.改行で区切られた文字列を入力"}).appendTo(h);
    var input_source = yaju1919.addInputText(h,{
        title: "source",
        textarea: true,
        save: "source",
        hankaku: false
    });
    h.append("<br>");
    $("<h2>",{text:"2.生成方法を選択"}).appendTo(h);
    var h_ui = $("<div>").appendTo(h);
    h.append("<br>");
    var h_result = $("<div>").appendTo(h);
    //---------------------------------------------------------
    function makeMarkov(split_func, multiple){ // マルコフ連鎖を作る
        multiple = multiple || 1;
        var data = {};
        function add(text){ // データ登録
            var array = split_func(text);
            [].concat(null, array, null).forEach(function(v,i,a){
                //break
                var next_num = i + multiple;
                if(next_num >= a.length) return;
                //prev
                var prev = '', correct = 0; // 補正値
                if(v === null){ // 始端の場合
                    prev = null;
                    correct = multiple - 1;
                }
                else {
                    for(var o = 0; o < multiple; o++) {
                        var now = a[i + o];
                        prev += now;
                    }
                }
                //next
                var next = '';
                for(var p = 0; p < multiple; p++) {
                    var now2 = a[i + p + multiple - correct];
                    if(!now2){ // 終端のnullに触れた場合
                        if(!data[next]) data[next] = [];
                        data[next].push(null);
                        break;
                    }
                    next += now2;
                }
                // finish
                if(!data[prev]) data[prev] = [];
                data[prev].push(next);
            });
        }
        function make(){ // マルコフ連鎖でつなげた文を返す
            var result = '';
            var word = yaju1919.randArray(data[null]);
            while(word) {
                result += word;
                word = yaju1919.randArray(data[word]);
            }
            return result;
        }
        return {
            add: add,
            make: make
        };
    }
    //---------------------------------------------------------
    var inputNumberMultiple = yaju1919.addInputNumber(h_ui,{
        title: "多重マルコフ連鎖",
        min: 1,
    });
    var select_arg_split = yaju1919.addSelect(h_ui,{
        title: "品詞分解アルゴリズム",
        list: {
            "文字数ごとに分割": '1',
            "文字種ごとに分割": '2',
            "形態素解析": '3',
        },
        change: function(v){
            if(v === '1') $("#split").parent().show();
            else $("#split").parent().hide();
        }
    });
    var inputNumberSplit = yaju1919.addInputNumber(h_ui,{
        id: "split",
        title: "分割する文字数",
        value: 2,
        min: 1,
        max: 99,
    });
    $("#split").parent().hide();
    var activFunc; // 現在稼働している関数
    function make(){
        var ar = input_source().split('\n'),
            count = 0;
        var markov = makeMarkov((function(){
            var arg_split = select_arg_split();
            if(arg_split === '1'){ // 文字数ごと
                return function(str){ return WA_KA_CHI_GA_KI(str, inputNumberSplit()); };
            }
            else if(arg_split === '2'){ // 文字種ごと
                return function(str){ return WA_KA_CHI_GA_KI(str); };
            }
            else if(arg_split === '3'){ // 形態素解析
                var segmenter = new TinySegmenter();
                return function(str){ return segmenter.segment(str); };
            }

        })(), inputNumberMultiple());
        ar.filter(function(v){
            return v;
        }).forEach(function(v){ // クッソ時間かかる処理
            markov.add(v);
        });
        activFunc = function(){
            return markov.make();
        };
        return true; // 作成完了
    }
    $("<h2>",{text:"3.モデルを作成"}).appendTo(h_ui);
    addBtn("この内容で文生成モデルを作成", function(){
        try{
            var result = make();
            if(result) h_result.text("モデルの作成が完了しました。(" + yaju1919.getTime() + ')');
            else h_result.text("原因不明のエラーです。");
        }
        catch(err){
            $("<div>").appendTo(h_result.empty()).text("モデルの作成に失敗しました。").css({
                color: "red",
                backgroundColor: "pink"
            });
            $("<div>").appendTo(h_result).text(err);
        }
    }, h_ui);
    var h_show_length = $("<div>").appendTo(h_ui);
    $("<h2>",{text:"4.文生成"}).appendTo(h_ui);
    addBtn("文生成", function(){
        if(!activFunc) return h_result.text("文生成モデルがありません。");
        yaju1919.addInputText(h_result.empty(),{
            title: "output",
            value: activFunc(),
            readonly: true,
            textarea: true,
            hankaku: false
        });
    }, h_ui);
})();
