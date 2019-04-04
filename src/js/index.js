template.defaults.imports.childPhoto = function(str){
    var values=str.split('~~');
    var value=values[0];
    var sex=values[1];
    if(!value||value=="0"&&sex=='0'){
        return '../images/boy.png';
    }else if(!value||value=="0"&&sex=='1'){
        return '../images/gril.png';
    }else{
        return pageObj.global.imgUrl+value;
    }
};
var pageObj=$.extend({},pageObj,{
    /*
    * 全局变量
    */
    global:{
        id:'',
        acid:'', //活动ID
        baseUrl:'%baseUrl%',
        serveUrl:'%serveUrl%',
        imgUrl:'%imgUrl%',
        token:'',
    },
    runTime:0,
    shareParams:{
        title:'我是{{nursery_name}}的{{child_name}},我完成了兜兜哩21天阅读计划！',
        url:'https://w001.ddlyd.com/active/award_detail.html?id=',
        des:'兜兜哩，陪伴你！',
        pic:''
    },
    GetQueryString:function(name){
         var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
         var r = window.location.search.substr(1).match(reg);
         if(r!=null)return  unescape(r[2]); return null;
    },
    /*
    *公共ajax方法
    */
    commonAjax:function(url,params,successFun,method){
        var method=method||'get';
        var _this=this;
        $.ajax({
                headers: {
                    token:_this.global.token,
                },
                type: method,
                timeout:20000,
                url: _this.global.baseUrl+url,
                data: params,
                beforeSend:function(){
                    _this.showLoading();
                },
                complete:function(){
                    _this.hideLoading();
                },
                error:function(XMLHttpRequest, textStatus, errorThrown){
                    if(textStatus=='timeout'){
                        layer.open({
                            content: "请求超时！"
                            ,skin: 'msg'
                            ,time: 2 //2秒后自动关闭
                        });
                    }
                },
                success: successFun
        });
    },
    userAgentType:function(){
        var u = navigator.userAgent;
        var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
        var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
        if(isAndroid){
            return "a";
        }else if(isiOS){
            return "i";
        }
    },
    /*
    * 页面初始化后执行数据渲染
    */
    pageOnload:function(){
        var _this=this;
        _this.getData();
    },
    /*获取数据*/
    getData:function(){
        var _this=this;
        _this.commonAjax('me/getMyChild',{},function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                pageObj.childLen=data.length;
                if(data.length==1){
                    _this.global.childId=data[0].qh_child_id;
                    _this.confirmBaby();
                }else{
                    _this.global.childId=_this.global.childId||data[0].qh_child_id;
                    res.currChild=_this.global.childId;
                    layer.open({
                        className:'layer-my',
                        shadeClose:false,
                        content: template("select_baby_temp",res||[])
                    })
                }
            }else{
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        });
    },
    selectBaby:function(obj,childid){
        var _this=this;
        $(obj).addClass("active").siblings().removeClass("active");
        _this.global.childId=childid;
    },
    confirmBaby:function(){
        var _this=this;
        var params={
            childid:_this.global.childId
        };
        _this.dialogClose();
        _this.commonAjax('me/getTurnChance',params,function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                _this.renderNext(data);
                _this.getDataOver=true;
            }else if(res.code=='102'){
                layer.open({
                    shadeClose:false,
                    content: res.tip,
                    btn: ['兜兜哩能带来什么', '好吧'],
                    yes: function(index){
                        if(_this.userAgentType()=='a'){
                            location.href='iframeLoad.html';
                        }else if(_this.userAgentType()=='i'){
                            loadHtml('https://www.rrxiu.net/view-3nlc2u');
                        }

                    },
                    no:function(){
                        if(_this.childLen==1){
                            _this.finish();
                        }else{
                            _this.getData();
                        }
                    },
                });
            }else{
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        },'post');
    },
    finish:function(){
        //调用此代码
        var _this=this;
        if(_this.userAgentType()=='a'){
            window.AndroidWebView.finish();
        }else if(_this.userAgentType()=='i'){
            finish();
        }

    },
    shareFun:function(){
        var _this=this;
        if(_this.userAgentType()=='a'){
            window.AndroidWebView.onShare(JSON.stringify(_this.shareParams));
        }else if(_this.userAgentType()=='i'){
            shareFun(JSON.stringify(_this.shareParams));
        }
    },
    /*
    *数据渲染后执行
    */
    renderNext:function(data){
        var _this=this;
        $("#tips").text(data.msg);
        $(".header-title").text(data.title);
        $("#count").text(data.num);
        _this.global.acid=data.acid;
        $("#goods_list").html(template("goods_list_temp",data));
        var goodsArra=[];
        for(var i=0;i<data.goods.length;i++) {
            var award = new Object();
            award.id = data.goods[i].qh_actprize_id;
            award.isthanks=data.goods[i].isthanks;
            award.pic=data.goods[i].pic;
            award.rotate =5*360+i*60;
            goodsArra.push(award);
        }
        _this.goodsObj=goodsArra;

        _this.getRollList();
    },
    /**
     * 开始抽奖
     */
    startRun:function(){
        var _this=this;
        if($("#count").text()=="0"){
            layer.open({
                content: '没有抽奖机会'
                ,skin: 'msg'
                ,time: 2 //2秒后自动关闭
            });
            return;
        }
        if(_this.runing){
            return;
        }
        _this.runing=true;
        var params={
            acid:_this.global.acid,
            childid:_this.global.childId
        };
        $(".turntable-pointer").addClass("transition");
        _this.commonAjax('me/rollTurn',params,function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                _this.rotateFun(data.qh_actprize_id);
            }else{
                _this.runing=false;
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        },'post');
    },
    rotateFun:function(id){
        var _this=this;
        var dataObj={
            img:'',
            isthanks:false
        };
        for(var i=0;i<_this.goodsObj.length;i++){
            if(_this.goodsObj[i].id==id){
                dataObj.img=_this.goodsObj[i].pic;
                dataObj.isthanks=_this.goodsObj[i].isthanks;
                $(".turntable-pointer").css({
                    "-webkit-transform":'rotate('+_this.goodsObj[i].rotate+'deg)',
                    "-ms-transform":'rotate('+_this.goodsObj[i].rotate+'deg)',
                    "-moz-transform":'rotate('+_this.goodsObj[i].rotate+'deg)',
                    "-0-transform":'rotate('+_this.goodsObj[i].rotate+'deg)',
                    "transform":'rotate('+_this.goodsObj[i].rotate+'deg)',
                });
            }
        }
        clearInterval(_this.timer);
        _this.timer=setInterval(function(){
            _this.runTime++;
            if(_this.runTime==3){
                layer.open({
                    className:'layer-my layer-run-result',
                    shadeClose:true,
                    content: template("run_result_temp",dataObj),
                    end:function(){
                        /*重置*/
                        _this.confirmBaby();
                        $(".turntable-pointer").removeClass("transition");
                        $(".turntable-pointer").css({
                            "-webkit-transform":'rotate(0)',
                            "-ms-transform":'rotate(0)',
                            "-moz-transform":'rotate(0)',
                            "-0-transform":'rotate(0)',
                            "transform":'rotate(0)',
                        });
                        _this.runTime=0;
                        _this.restart=true;
                        _this.runing=false;
                    },
                });
                clearInterval(_this.timer);
            }
        },1000);
    },
    getRollList:function(){
        var _this=this;
        var params={
            acid:_this.global.acid
        };
        _this.commonAjax('me/getRollList',params,function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                if(data.length==0){
                    $(".award-log").css({
                        "opacity":"0",
                        "-webkit-transform":'scale(0,0)',
                        "-ms-transform":'scale(0,0)',
                        "-moz-transform":'scale(0,0)',
                        "-0-transform":'scale(0,0)',
                        "transform":'scale(0,0)',
                    });
                    setTimeout(function(){
                        $(".award-log").hide();
                    },300);
                }else{
                    $("#scrollList").html(template("scroll_list_temp",res));
                    if(!_this.scrollHide){
                        $(".award-log").show();
                        $(".award-log").css({
                            "opacity":"1",
                            "-webkit-transform":'scale(1,1)',
                            "-ms-transform":'scale(1,1)',
                            "-moz-transform":'scale(1,1)',
                            "-0-transform":'scale(1,1)',
                            "transform":'scale(1,1)',
                        });
                        _this.textScroll(data.length);
                    }
                }
            }else{
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        });
    },
    textScroll:function(len){
        var _this=this;
        _this.cur_index=0;
        clearInterval(_this.scrollTimer);
        _this.scrollTimer=setInterval(function(){
            _this.cur_index++;
            if(_this.cur_index>=len){
                $("#scrollList").removeClass("transition");
                $("#scrollList").css({
                    "-webkit-transform":'translateY(0)',
                    "-ms-transform":'translateY(0)',
                    "-moz-transform":'translateY(0)',
                    "-0-transform":'translateY(0)',
                    "transform":'translateY(0)',
                });
                _this.cur_index=0;
                setTimeout(function(){
                    $("#scrollList").addClass("transition");
                },1000);
            }
            var translateY=-_this.cur_index*0.46;
            $("#scrollList").css({
                "-webkit-transform":'translateY('+translateY+'rem)',
                "-ms-transform":'translateY('+translateY+'rem)',
                "-moz-transform":'translateY('+translateY+'rem)',
                "-0-transform":'translateY('+translateY+'rem)',
                "transform":'translateY('+translateY+'rem)',
            });
        },2000);
    },
    showLoading:function(){
        pageObj.loading=layer.open({type: 2,shadeClose:false});
    },
    hideLoading:function(){
        layer.close(pageObj.loading);
    },
    dialogClose:function(){
        layer.closeAll();
    },
    hideScroll:function(){
        $(".award-log").css({
            'opacity':'0',
            "-webkit-transform":'scale(0,0)',
            "-ms-transform":'scale(0,0)',
            "-moz-transform":'scale(0,0)',
            "-0-transform":'scale(0,0)',
            "transform":'scale(0,0)',
        });
        setTimeout(function(){
            $(".award-log").hide();
        },300);
        this.scrollHide=true;
        clearInterval(this.scrollTimer);
    },
    showAward:function(){
        var _this=this;
        var params={
            acid:_this.global.acid,
            childid:_this.global.childId
        };
        _this.commonAjax('me/myPrize',params,function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                layer.open({
                    className:'layer-my layer-award-record',
                    shadeClose:true,
                    content: template("award_record_temp",res)
                });
            }else{
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        });
    },
    showRule:function(){
        var _this=this;
        var params={
            acid:_this.global.acid
        };
        _this.commonAjax('me/getRule',params,function(res){
            var res=JSON.parse(res);
            if(res.code=='101'){
                var data=res.data;
                layer.open({
                    className:'layer-rule',
                    shadeClose:true,
                    content: '<i class="dialog-close" onclick="pageObj.dialogClose()"></i><div class="show-rule">'+data.detail+'</div>'
                });
            }else{
                layer.open({
                    content: res.tip
                    ,skin: 'msg'
                    ,time: 2 //2秒后自动关闭
                });
            }
        });
    },
    /**
     * 初始化方法
     */
    init:function() {
        var _this = this;
        _this.pageOnload();
    }
})
$(function(){
    //pageObj.init();
})
