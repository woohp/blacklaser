!function(e,r,n,t,o){var u="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},c="function"==typeof u.parcelRequire0c5f&&u.parcelRequire0c5f,f=c.cache||{},i="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function l(r,n){if(!f[r]){if(!e[r]){var t="function"==typeof u.parcelRequire0c5f&&u.parcelRequire0c5f;if(!n&&t)return t(r,!0);if(c)return c(r,!0);if(i&&"string"==typeof r)return i(r);var o=new Error("Cannot find module '"+r+"'");throw o.code="MODULE_NOT_FOUND",o}s.resolve=function(n){var t=e[r][1][n];return null!=t?t:n},s.cache={};var a=f[r]=new l.Module(r);e[r][0].call(a.exports,s,a,a.exports,this)}return f[r].exports;function s(e){var r=s.resolve(e);return!1===r?{}:l(r)}}l.isParcelRequire=!0,l.Module=function(e){this.id=e,this.bundle=l,this.exports={}},l.modules=e,l.cache=f,l.parent=c,l.register=function(r,n){e[r]=[function(e,r){r.exports=n},{}]},Object.defineProperty(l,"root",{get:function(){return u.parcelRequire0c5f}}),u.parcelRequire0c5f=l;for(var a=0;a<r.length;a++)l(r[a]);var s=l(n);"object"==typeof exports&&"undefined"!=typeof module?module.exports=s:"function"==typeof define&&define.amd&&define((function(){return s}))}({"2VJtn":[function(e,r,n){e("./helpers/bundle-manifest").register(JSON.parse('{"cg3uR":"index.27b787c2.js","fj0it":"App.0d4fda5c.js","bUM8C":"webtorrent.bf190c51.js"}'))},{"./helpers/bundle-manifest":"5nGvN"}],"5nGvN":[function(e,r,n){"use strict";var t={};r.exports.register=function(e){for(var r=Object.keys(e),n=0;n<r.length;n++)t[r[n]]=e[r[n]]},r.exports.resolve=function(e){var r=t[e];if(null==r)throw new Error("Could not resolve bundle with id "+e);return r}},{}],b61V7:[function(e,r,n){e("@parcel/transformer-js/src/esmodule-helpers.js").defineInteropFlag(n),async function(){const r=await e("4869aff20c3610");console.debug("App",r);const n=document.querySelector("#app");n.classList.remove("hidden"),new r.default({target:n})}()},{"4869aff20c3610":"hpfK9","@parcel/transformer-js/src/esmodule-helpers.js":"fR3uA"}],hpfK9:[function(e,r,n){r.exports=e("./helpers/browser/js-loader")(e("./helpers/bundle-url").getBundleURL("cg3uR")+e("./helpers/bundle-manifest").resolve("fj0it")).then((()=>r.bundle.root("fC9xc")))},{"./helpers/browser/js-loader":"8VV9Q","./helpers/bundle-url":"pXPlI","./helpers/bundle-manifest":"5nGvN"}],"8VV9Q":[function(e,r,n){"use strict";var t=e("../cacheLoader");r.exports=t((function(e){return new Promise((function(r,n){var t=document.getElementsByTagName("script");if([].concat(t).some((function(r){return r.src===e})))r();else{var o=document.createElement("link");o.href=e,o.rel="preload",o.as="script",document.head.appendChild(o);var u=document.createElement("script");u.async=!0,u.type="text/javascript",u.charset="utf-8",u.src=e,u.onerror=function(r){var t=new TypeError("Failed to fetch dynamically imported module: ".concat(e,". Error: ").concat(r.message));u.onerror=u.onload=null,u.remove(),n(t)},u.onload=function(){u.onerror=u.onload=null,r()},document.getElementsByTagName("head")[0].appendChild(u)}}))}))},{"../cacheLoader":"fafQw"}],fafQw:[function(e,r,n){"use strict";var t={},o={},u={};function c(e){switch(e){case"preload":return o;case"prefetch":return u;default:return t}}r.exports=function(e,r){return function(n){var t=c(r);return t[n]?t[n]:t[n]=e.apply(null,arguments).catch((function(e){throw delete t[n],e}))}}},{}],pXPlI:[function(e,r,n){"use strict";var t={};function o(e){return(""+e).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/,"$1")+"/"}n.getBundleURL=function(e){var r=t[e];return r||(r=function(){try{throw new Error}catch(r){var e=(""+r.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);if(e)return o(e[2])}return"/"}(),t[e]=r),r},n.getBaseURL=o,n.getOrigin=function(e){var r=(""+e).match(/(https?|file|ftp):\/\/[^/]+/);if(!r)throw new Error("Origin not found");return r[0]}},{}],fR3uA:[function(e,r,n){n.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},n.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.exportAll=function(e,r){return Object.keys(e).forEach((function(n){"default"===n||"__esModule"===n||r.hasOwnProperty(n)||Object.defineProperty(r,n,{enumerable:!0,get:function(){return e[n]}})})),r},n.export=function(e,r,n){Object.defineProperty(e,r,{enumerable:!0,get:n})}},{}]},["2VJtn","b61V7"],"b61V7");