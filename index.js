;(function(){
    var JSON = this.JSON;

    var JSONPOINT_KEYWORD = '[#jsonpoint#]';
    var ROOT_KEY = '';

    var circularJSON={
        /**
         * 解析 string --> json
         * @param str
         * @returns {*}
         */
        parse:function(str){
            var result =  JSON.parse.apply(JSON,[].slice.call(arguments));
            this.recoverCircular(result);
            return result;
        },

        /**
         * 解析 json --> string
         * @param obj
         * @returns {*}
         */
        stringify:function(obj){
            this.breakCircular(obj,true);
            return JSON.stringify(obj);
        },

        /**
         * 恢复循环引用
         * @param jsonObj
         * @param clone 是否深克隆，否的话会对原本的对象产生影响
         * @returns {*}
         */
        recoverCircular:function(jsonObj,clone){
            jsonObj = clone ? deepClone(jsonObj):jsonObj;
            return _recoverCircular(jsonObj,jsonObj,{});
        },

        /**
         * 破坏循环引用
         * @param jsonObj
         * @param clone
         * @returns {*}
         */
        breakCircular:function(jsonObj,clone){
            return _breakCircular([jsonObj],[ROOT_KEY],clone);
        }
    }

    function deepClone(obj){
        var newObj = {};
        for(var key in obj){
            var value = obj[key];
            if(typeof value === 'object'){
                value = deepClone(value);
            }
            newObj[key] = value;
        }
        return newObj;
    }

    function _recoverCircular(root,parent,cache){
        for(var key in parent){
            var child = parent[key];
            if(typeof child === 'string' && child.indexOf(JSONPOINT_KEYWORD) > -1){
                var jsonPointer = child.split(JSONPOINT_KEYWORD)[1];
                var target =cache[jsonPointer];

                if(!target){
                    target = getValueByPointer(root,jsonPointer)
                }

                if(target){
                    cache[jsonPointer] = parent[key] = target;
                }
            }


            if(typeof  child === 'object'){
                _recoverCircular(root,child,cache);
            }

        }
        return root;
    }
    function getValueByPointer(jsonObj,pointer){
        var pointerSplits = pointer.split('.');
        var current = jsonObj;
        for(var i = 0; i < pointerSplits.length; i++){
            var key = pointerSplits[i];
            if(key !== ''){
                current = current[key];
            }

            if(typeof current !== 'object'){
                return false;
            }
        }
        return current;
    }

    function _breakCircular(parents,keys,clone){
        var lastParent = parents[parents.length - 1];

        var newObj = clone?{}:lastParent;
        for(var key in lastParent){
            var child = lastParent[key];
            if(typeof child !== 'object'){
                newObj[key] = child;
                continue;
            }


            var index = parents.indexOf(child);
            if(index > -1) {
                var scope = keys.slice(0,index + 1).join('.');
                newObj[key] = JSONPOINT_KEYWORD + scope;
                continue;
            }
            keys.push(key);
            parents.push(child);
            newObj[key] = _breakCircular(parents,keys,clone);
            parents.pop();
            keys.pop();
        }
        return newObj;
    }

    if ('object' === typeof exports) {
        module.exports = circularJSON;
    } else if ('function' === typeof define && define.amd) {
        define(function() {
            return circularJSON;
        });
    } else {
        this.circularJSON = circularJSON;
    }

}).call((function() {
    'use strict';
    return (typeof window !== 'undefined' ? window : global);
})());