/**
 * Created by James Wiley December 5, 2018
 */
define(['jquery'], function ($) {
    "use strict";


    function formatSku(sku) {
        if (sku.startsWith("(#")) {
            return sku.slice(2,-1);
        } else if (sku.startsWith("(")) {
            return sku.slice(1,-1);
        } else {
            return sku;
        }
    }

    function formatPrice(price) {
        price = (price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        return '$'+price;
    }

    function formatDims(length, width) {
        return parseFloat(length).toFixed(2) + "\"x" + parseFloat(width).toFixed(2) + "\"";
    }

    function getMetalLabelFromValue(val, authToken) {
        var defer = $.Deferred();
        $.ajax({
            url: '/rest/V1/products/attributes/metal',
            type: 'GET',
            dataType: 'json',
            contentType: "application/json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
            },
        }).done(function (metalData) {
            metalData = $.parseJSON(JSON.stringify(metalData));
            var metal;
            if (metalData.hasOwnProperty('options')) {
                var i;
                for (i=0; i < metalData.options.length; i++) {
                    if (metalData.options[i].value === val) {
                        metal = metalData.options[i].label;
                        break;
                    }
                }
                defer.resolve(metal);
            } else {
                defer.resolve(metal);
            }

        }).fail(function () {
            defer.fail();
        })

        return defer.promise();
    }

    function getPriceTagInfoFromProduct(productList, priceType, authToken) {
        var defer = $.Deferred();
        var sku, price, metal_code, metal, line2, line3, length, width, lxw, i;
        var productData = productList.items[0];
        if (productData.hasOwnProperty('sku')) {
            // get the sku
            sku = productData.sku;
            // find the retail price - customer_group_id = 3
            if (productData.hasOwnProperty('tier_prices')){
                for (i=0; i < productData.tier_prices.length;i++){
                    var tier_price = productData.tier_prices[i];
                    if (tier_price.hasOwnProperty('customer_group_id')) {
                        if (tier_price.customer_group_id == priceType) {
                            price = tier_price.value;
                        }
                    }
                }
            }
            // iterate over the custom attributes to find:
            // metal_code, line2, line3, length and width
            if (productData.hasOwnProperty('custom_attributes')){
                for (i=0; i < productData.custom_attributes.length; i++) {
                    if (productData.custom_attributes[i].attribute_code === "metal"){
                        metal_code = productData.custom_attributes[i].value;
                        // the attribute value is just a number that must be used to find the label
                    }
                    if (productData.custom_attributes[i].attribute_code === "line_2"){
                        line2 = productData.custom_attributes[i].value;
                    }
                    if (productData.custom_attributes[i].attribute_code === "line_3"){
                        line3 = productData.custom_attributes[i].value;

                    }
                    if (productData.custom_attributes[i].attribute_code === "ts_dimensions_length") {
                        length = productData.custom_attributes[i].value;

                    }
                    if (productData.custom_attributes[i].attribute_code === "ts_dimensions_width") {
                        width = productData.custom_attributes[i].value;
                    }
                }
            }
            sku = formatSku(sku.trim());
            price = formatPrice(price);
            if (typeof line2 !== 'undefined'){
                line2 = line2.trim();
            } else {
                line2 = "";
            }
            if (typeof line3 !== 'undefined'){
                line3 = line3.trim();
            } else {
                line3 = "";
            }
            if (typeof length !== 'undefined'){
                if (typeof width !== 'undefined') {
                    lxw = formatDims(length, width);
                }
            } else {
                lxw = "";
            }
            getMetalLabelFromValue(metal_code, authToken).done(function (metal) {

                var top = sku + "\n" + price;
                var bottom = metal + "\n" + line2 + "\n" + line3 + "\n" + lxw;
                defer.resolve(top, bottom);

            });
        }

        return defer.promise();
    }

    return ({
        getTagInfoByEntityId: getTagInfoByEntityId
    });

    function getTagInfoByEntityId(entityId, priceType, authToken) {
        var defer = $.Deferred();
        $.ajax({
            url: '/rest/V1/products/?searchCriteria[filterGroups][0][filters][0][field]=entity_id&searchCriteria[filterGroups][0][filters][0][condition_type]=eq&searchCriteria[filterGroups][0][filters][0][value]=' + entityId,
            //url: '/rest/V1/products/' + sku,
            type: 'GET',
            dataType: 'json',
            contentType: "application/json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
            },
        }).done(function (productData) {
            productData = $.parseJSON(JSON.stringify(productData));
            getPriceTagInfoFromProduct(productData, priceType, authToken).done(function (top, bottom) {
                defer.resolve(top, bottom);
            }).fail(function () {
                defer.fail();
            })

        }).fail(function () {
            defer.fail();
        })

        return defer.promise();

    }


});
