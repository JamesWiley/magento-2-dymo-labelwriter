//'mage/storage',
define([
    'jquery',
    'mageUtils',
    'wdevsDymo',
    'wdevsPriceTagFormatter'
], function ($, utils, wdevsDymo, wdevsPriceTagFormatter) {
    'use strict';

    //init printer and label
    wdevsDymo.loadSettings();

    function printTag(entityId, priceType, authToken){
        var defer = $.Deferred();
        wdevsPriceTagFormatter.getTagInfoByEntityId(entityId, priceType, authToken).done(function(top, bottom){
            wdevsDymo.printLabel(top, bottom);

            //uncheck the checkboxes
            var checkboxId = 'idscheck'+entityId;
            if($('input:checkbox[id^='+checkboxId+']:checked').length){
                $('input:checkbox[id^='+checkboxId+']:checked').click();
            }
            defer.resolve();
        }).fail(function(){
            defer.fail();
        });

        return defer.promise();
    }

    //Should be a temporarily function
    //But Magento's url.build is not working
    //except if your create another 3+ files only for the url...
    function getAdminPath() {
        var pathName = window.location.pathname;
        var pathArray = pathName.split('/');
        var adminPath = "admin";
        for (var i = 0; i < pathArray.length; i++) {
            if(pathArray[i] != ""){
                adminPath = pathArray[i];
                break;
            }
        }

        return adminPath;
    }

    return function (target) {

        return target.extend({

            /**
             * Default action callback. Sends selections data
             * via POST request or POST form
             *
             * @param {Object} action - Action data.
             * @param {Object} data - Selections data.
             */
            defaultCallback: function (action, data) {

                if ((action.type == 'mass_print_retail_tags') ||
                    (action.type == 'mass_print_web_tags') ||
                    (action.type == 'mass_print_intl_tags')) {
                    //close the dropdown
                    this.opened(false);
                    var priceType;
                    if (action.type == 'mass_print_retail_tags'){
                        priceType = 3;
                    }
                    if (action.type == 'mass_print_web_tags'){
                        priceType = 5;
                    }
                    if (action.type == 'mass_print_intl_tags'){
                        priceType = 6;
                    }

                    if (data.hasOwnProperty('selected')) {
                        if (data.selected.length > 0) {
                            /**
                             * So there is a bug in the Magento 2 REST API.
                             * Session based authentication for REST API in admin is currently not working.
                             * And it should work; See GitHub: https://github.com/magento/magento2/issues/14297
                             */

                            /**
                             * For now we have to generate an access token
                             * with that token, we can consume the REST API
                             */

                            /**
                             * if this bug is fixed. We can remove:
                             * - Controller/Adminhtml/Auth/Token.php
                             * - etc/adminhtml/routes.xml
                             * - the authToken parameters in the functions
                             * - the below AJAX request (/admin/dymo/auth/token)
                             */


                            if(wdevsDymo.isLoaded()) {
                                //show loader
                                $('body').trigger('processStart');
                                var adminPath = getAdminPath();
                                var authUrl = '/' + adminPath +'/dymo/auth/token';
                                $.ajax({
                                    method: 'POST',
                                    data: {form_key: window.FORM_KEY},
                                    url: authUrl,
                                    dataType: 'json',
                                }).done(function (tokenData) {
                                    //tokenData = {'authToken': 'xyx'}
                                    var tokenData = $.parseJSON(JSON.stringify(tokenData));

                                    var printedTags = [];
                                    if (tokenData.hasOwnProperty('authToken')) {
                                        var authToken = tokenData.authToken;
                                        $.each(data.selected, function (index, entityId) {
                                            var printedTag = printTag(entityId, priceType, authToken);
                                            printedTags.push(printedTag);
                                        });

                                        $.when.apply($, printedTags).done(function () {
                                            //all orders data is fetched and printed
                                            //stop loader
                                            $('body').trigger('processStop');
                                        });

                                    }
                                });
                            }
                        }
                    }
                    return false;
                } else {
                    //call other mass action methods
                    var defaultCallback = this._super();
                    return defaultCallback;
                }
            }
        });
    };
});
