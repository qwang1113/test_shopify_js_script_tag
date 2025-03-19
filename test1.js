class Uppromote {
    constructor(a="production", b=!0) {
        this.env = a,
        this.host = {
            dev: "https://secomapp-affiliate.test",
            test: "https://af-test.uppromote.com",
            production: "https://track.uppromote.com"
        }[a] || "https://track.uppromote.com",
        this.cdnHost = {
            dev: "https://secomapp-affiliate.test",
            test: "https://af-test.uppromote.com",
            production: "https://d1639lhkj5l89m.cloudfront.net"
        }[a] || "https://d1639lhkj5l89m.cloudfront.net",
        this.cdnS3Host = {
            dev: "https://secomapp-affiliate.test",
            test: "https://af-test.uppromote.com",
            production: "https://cdn.uppromote.com"
        }[a] || "https://cdn.uppromote.com",
        this.cache = b,
        this.postPurchasePopup = {
            ui: {
                sca_title: null
            }
        }
    }
    init() {
        this.dispatchLoadedEvent(),
        this.processOnLoadPage(),
        this.uppromoteLog("Running...")
    }
    renderElm(a="div", b, c={}, d) {
        const e = document.createElement(a);
        return b && (Array.isArray(b) ? b.map(a => e.classList.add(a)) : b && 0 !== b.length && e.classList.add(b)),
        Object.keys(c).forEach(a => e.setAttribute(a, c[a])),
        d && (e.innerHTML = d),
        e
    }
    async fetchAndGetContent(a="", b="GET", c={}) {
        if (c.shopify_domain = this.getShopDomain(),
        ["GET", "HEAD"].includes(b)) {
            a = new URL(a);
            const b = new URLSearchParams(c)
              , d = a.searchParams
              , e = new URLSearchParams({
                ...Object.fromEntries(b),
                ...Object.fromEntries(d)
            });
            a = `${a.origin}${a.pathname}?${e.toString()}`;
            const f = await fetch(a);
            return (await f.json()) || null
        } else {
            const d = new FormData;
            Object.keys(c).forEach(a => d.append(a, c[a]));
            const e = await fetch(a, {
                method: b,
                headers: {},
                body: d
            });
            return (await e.json()) || null
        }
    }
    setCookie(a, b, c) {
        const e = new Date;
        e.setTime(e.getTime() + 1e3 * (60 * (60 * (24 * c))));
        let d = "expires=" + e.toUTCString();
        document.cookie = a + "=" + b + ";" + d + ";path=/"
    }
    getCookie(a) {
        let b = a + "="
          , c = decodeURIComponent(document.cookie)
          , d = c.split(";");
        for (let e, c = 0; c < d.length; c++) {
            for (e = d[c]; " " === e.charAt(0); )
                e = e.substring(1);
            if (0 === e.indexOf(b))
                return e.substring(b.length, e.length)
        }
        return ""
    }
    mustPostClickTracking(a) {
        if (!a)
            return !0;
        const b = new Date().getTime();
        return b - a > 60000
    }
    checkResponseFromServer() {
        if ("false" === localStorage.getItem("scaaf_received")) {
            const a = this.getCookie("scaaf_aid") || localStorage.getItem("scaaf_aid");
            if (!a)
                return;
            this.postClickTracking({
                aid: a,
                tid: localStorage.getItem("scaaf_tid"),
                hc: localStorage.getItem("scaaf_hc"),
                s: this.getShopName(),
                ug: navigator.userAgent
            }, null, () => {
                uppromote.uppromoteLog("ReTracking success!")
            }
            )
        }
    }
    parseQueryStringToObject(a="") {
        try {
            const b = new URLSearchParams(a)
              , c = b.entries()
              , d = {};
            for (const [a,b] of c)
                d[a] = b;
            return d
        } catch (a) {
            return {}
        }
    }
    getShopDomain() {
        try {
            return Shopify ? Shopify.shop : ""
        } catch (a) {
            return console.error("Uppromote: getShopName() - Error when get shopify domain"),
            ""
        }
    }
    getShopName() {
        return this.getShopDomain().replace(".myshopify.com", "")
    }
    getShopifyCheckoutObject() {
        return Shopify && Shopify.checkout ? Shopify.checkout : null
    }
    getShopifyCheckoutInformationObject() {
        return Shopify && Shopify.Checkout ? Shopify.Checkout : null
    }
    applyDiscountCode(a) {
        const b = this.renderElm("iframe", "sca_d-none", {
            src: `/discount/${encodeURIComponent(a)}`
        });
        b.style.display = "none",
        document.body.append(b)
    }
    initFbPixel() {
        if ("undefined" == typeof disableUppromoteFacebookPixel) {
            const a = this.renderElm("script", "sca_aff_fb_pixel_init");
            a.textContent = `!function(a,c,b,d,e,f,g){a.fbq||(e=a.fbq=function(){e.callMethod?e.callMethod.apply(e,arguments):e.queue.push(arguments)},!a._fbq&&(a._fbq=e),e.push=e,e.loaded=!0,e.version="2.0",e.queue=[],f=c.createElement(b),f.async=!0,f.src=d,g=c.getElementsByTagName(b)[0],g.parentNode.insertBefore(f,g))}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");`,
            document.head.append(a)
        }
    }
    getCouponCode(a, b) {
        const c = `${this.host}/api/get_coupon`
          , d = a || this.getCookie("scaaf_aid");
        d && this.fetchAndGetContent(c, "GET", {
            aid: d
        }).then(a => {
            "ok" === a.status ? (uppromote.applyDiscountCode(a.coupon),
            setTimeout( () => {
                b && (window.location.href = `${b}&discount=${a.coupon}`)
            }
            , window.wattingForApplyDiscountCode || 200)) : b && (window.location.href = b)
        }
        ).catch( () => {
            b && (window.location.href = b)
        }
        )
    }
    trackFbPixel(a) {
        if ("undefined" != typeof disableUppromoteFacebookPixel)
            return;
        const b = `${this.host}/api/get_fb_pixel`
          , c = {
            aff_id: a || this.getCookie("scaaf_aid") || localStorage.getItem("scaaf_aid"),
            shop: `${this.getShopDomain()}`
        }
          , d = function(a) {
            const b = uppromote.getShopifyCheckoutObject()
              , c = uppromote.getShopifyCheckoutInformationObject();
            fbq("init", a),
            fbq("trackSingle", a, "PageView"),
            b && fbq("trackSingle", a, "Purchase", {
                value: b.total_price,
                currency: b.currency
            }),
            c && "contact_information" === c.step && fbq("trackSingle", a, "InitiateCheckout", {
                currency: b.currency,
                value: b.estimatedPrice
            }),
            document.location.pathname.startsWith("/cart") && fbq("trackSingle", a, "AddToCart")
        };
        c.aff_id && this.fetchAndGetContent(b, "GET", c).then(a => {
            "ok" === a.status && d(a.pixel)
        }
        ).catch(a => {
            console.error("Uppromote: trackFbPixel() - Error when fetch Fb pixel"),
            console.error(a)
        }
        )
    }
    appendAffiliateIdToRegisterForm(a=null) {
        if (this.getCookie("scaaf_ass_dl")) {
            const b = window.location.pathname.split("/")[2] || "";
            if ("register" === b && (a = a || this.getCookie("scaaf_aid") || localStorage.getItem("scaaf_aid"),
            !!a)) {
                const b = document.querySelector(`form[method="post"][action*="account"]`);
                if (b) {
                    const c = this.renderElm("input", null, {
                        type: "hidden",
                        name: "customer[note][affiliate_id]",
                        value: a
                    });
                    b.append(c)
                }
            }
        }
    }
    postClickTracking(a, b, c) {
        localStorage.getItem("scaaf_sca_source_secomus") && (a.sca_source = localStorage.getItem("scaaf_sca_source_secomus")),
        this.fetchAndGetContent(`${this.host}/api/click_tracking`, "POST", a).then(d => "ok" === d.status ? (this.uppromoteLog(`Tracking affiliate id ${a.aid}`),
        this.setLocalTrackingReceivedVariables(d),
        this.getCouponCode(),
        this.dispatchTrackingAffiliateEvent(!0, d),
        c && c(d),
        void this.runCustomizePostClickTrackingCallback(d)) : void (b && clearInterval(b),
        this.dispatchTrackingAffiliateEvent(!1, d),
        c && c(d))).catch(a => {
            b && clearInterval(b),
            this.dispatchTrackingAffiliateEvent(!1, response),
            c && c(a),
            console.warn(a)
        }
        )
    }
    dispatchLoadedEvent() {
        const a = new CustomEvent("uppromote:loaded")
          , b = () => window.dispatchEvent(a);
        this.waitCustomerReferralExtension(b),
        this.waitMessageBarExtension(b)
    }
    dispatchTrackingAffiliateEvent(a=!1, b={}) {
        const c = new CustomEvent("uppromote:tracked-affiliate",{
            detail: {
                available: a,
                info: b
            }
        })
          , d = () => window.dispatchEvent(c);
        this.waitCustomerReferralExtension(d),
        this.waitMessageBarExtension(d)
    }
    waitCustomerReferralExtension(a, b) {
        const c = setInterval( () => {
            "undefined" != typeof UppromoteCustomerReferral && (clearInterval(c),
            a())
        }
        , 500);
        setTimeout( () => {
            clearInterval(c),
            b && b()
        }
        , 1e4)
    }
    waitMessageBarExtension(a, b) {
        const c = setInterval( () => {
            "undefined" != typeof UppromoteMessageBar && (clearInterval(c),
            a())
        }
        , 500);
        setTimeout( () => {
            clearInterval(c),
            b && b()
        }
        , 1e4)
    }
    postCheckoutToken() {
        const a = this.getShopifyCheckoutObject()
          , b = this.getShopifyCheckoutInformationObject();
        if (b && b.token && a && null != localStorage.getItem("scaaf_aid") && localStorage.getItem("scaaf_ep") > new Date().getTime()) {
            const c = {
                aid: localStorage.getItem("scaaf_aid"),
                ct_tk: b.token,
                s: this.getShopName(),
                hc: localStorage.getItem("scaaf_hc"),
                order_id: a.order_id
            };
            localStorage.getItem("scaaf_sca_source_secomus") && (c.sca_source = localStorage.getItem("scaaf_sca_source_secomus")),
            this.fetchAndGetContent(`${this.host}/api/ct_tk`, "POST", c).then( () => {}
            ).catch(a => {
                console.error(a)
            }
            )
        }
    }
    postCartToken(a, b) {
        a.ug = navigator.userAgent,
        localStorage.getItem("scaaf_sca_source_secomus") && (a.sca_source = localStorage.getItem("scaaf_sca_source_secomus")),
        this.fetchAndGetContent(`${this.host}/api/ctk`, "POST", a).then(c => {
            "ok" === c.status && (this.setCookie("scaaf_tid", c.tid, 360),
            localStorage.setItem("scaaf_tid", c.tid),
            localStorage.setItem("scaaf_ctk", a.ctk),
            this.setCookie("scaaf_ctk", a.ctk, 360),
            localStorage.setItem("scaaf_received", "true")),
            clearInterval(b)
        }
        ).catch(a => {
            clearInterval(b),
            console.error(a)
        }
        )
    }
    processOnLoadPage() {
        const a = this.parseQueryStringToObject(window.location.search.substring(1));
        if (a.sca_ref) {
            const b = a.sca_ref.split(".")
              , c = {
                aid: b[0],
                hc: b[1],
                s: this.getShopName(),
                tid: localStorage.getItem("scaaf_tid"),
                ug: navigator.userAgent
            }
              , d = localStorage.getItem("scaaf_c_c")
              , e = new Date().getTime()
              , f = this.mustPostClickTracking(d);
            f && (this.setLocalTrackingVariables(c.aid, !1, c.hc, e, a.sca_source),
            this.postClickTracking(c, null)),
            a.sca_rib && (this.getCookie("scaaf_aid") ? this.getCouponCode(c.aid, a.sca_rib) : window.location.href = a.sca_rib)
        } else
            this.checkResponseFromServer(),
            this.getCouponCode();
        this.intervalCheckCartToken(),
        this.postCheckoutToken(),
        this.appendAffiliateIdToRegisterForm(),
        this.initFbPixel(),
        setTimeout( () => uppromote.trackFbPixel(), 200)
    }
    setLocalTrackingVariables(a, b=!1, c, d, e) {
        localStorage.setItem("scaaf_aid", a),
        localStorage.setItem("scaaf_received", b ? "true" : "false"),
        localStorage.setItem("scaaf_hc", c),
        localStorage.setItem("scaaf_c_c", d),
        this.setCookie("scaaf_aid", a, 360),
        this.setCookie("scaaf_c_c", d, 360),
        e && (localStorage.setItem("scaaf_sca_source_secomus", e || ""),
        this.setCookie("scaaf_sca_source_secomus", e || "", 360))
    }
    setLocalTrackingReceivedVariables(a={}) {
        localStorage.setItem("scaaf_received", "true"),
        localStorage.setItem("scaaf_tid", a.tid),
        localStorage.setItem("scaaf_ep", (1e3 * a.ep).toString()),
        this.setCookie("scaaf_tid", a.tid, 360),
        this.setCookie("scaaf_ep", 1e3 * a.ep, 360),
        this.setCookie("scaaf_afn", encodeURIComponent(a.afd.affiliate_name) || "", a.afcookie),
        this.setCookie("scaaf_afc", encodeURIComponent(a.afd.company) || "", a.afcookie),
        this.setCookie("scaaf_affn", encodeURIComponent(a.afd.affiliate_firstname) || "", a.afcookie),
        this.setCookie("scaaf_pd", encodeURIComponent(a.afd.personal_detail) || "", a.afcookie),
        a.enable_assign_down_line && this.setCookie("scaaf_ass_dl", 1, a.afcookie)
    }
    intervalCheckCartToken() {
        const a = setInterval( () => {
            const b = localStorage.getItem("scaaf_ctk")
              , c = this.getCookie("cart");
            if (c) {
                const d = localStorage.getItem("scaaf_tid")
                  , e = localStorage.getItem("scaaf_aid");
                if (d && e) {
                    const d = localStorage.getItem("scaaf_ep");
                    if (d && d < new Date().getTime())
                        return void clearInterval(a);
                    if (b !== c) {
                        const b = this.getShopifyCheckoutObject();
                        if (b)
                            return void clearInterval(a);
                        this.postCartToken({
                            aid: localStorage.getItem("scaaf_aid"),
                            tid: localStorage.getItem("scaaf_tid"),
                            ctk: c,
                            s: this.getShopName()
                        }, a)
                    }
                }
                "false" === localStorage.getItem("scaaf_received") && this.postClickTracking({
                    aid: localStorage.getItem("scaaf_aid"),
                    tid: localStorage.getItem("scaaf_tid"),
                    hc: localStorage.getItem("scaaf_hc"),
                    s: this.getShopName(),
                    ug: navigator.userAgent
                }, a)
            }
        }
        , 1e3)
    }
    runCustomizePostClickTrackingCallback(a) {
        if ("function" == typeof scaAffClickTrackingCallback)
            try {
                scaAffClickTrackingCallback(a)
            } catch (a) {
                console.log(a)
            }
    }
    uppromoteLog(a) {
        "undefined" != typeof scaDisableUppromoteLog && scaDisableUppromoteLog || console.log(`%c ► UpPromote Affiliate Marketing [Application] - ${a}`, "background-color: #092C4C; color: #fff; padding: 5px;")
    }
}
const uppromote = new Uppromote("production");
uppromote.init();
