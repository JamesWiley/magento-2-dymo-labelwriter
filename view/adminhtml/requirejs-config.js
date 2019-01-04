var config = {
    paths: {
        "dymoFramework": 'Wdevs_Dymo/js/dymo.label.framework.min'
    },
    map: {
        '*': {
            wdevsDymo: 'Wdevs_Dymo/js/main',
            wdevsPriceTagFormatter: 'Wdevs_Dymo/js/pricetag.formatter'
        }
    },
    shim: {
        'dymoFramework': {
            exports: 'dymo'
        },
    },
    config: {
        mixins: {
            'Magento_Ui/js/grid/massactions': {
                'Wdevs_Dymo/js/grid/massactions-mixin': true
            }
        }
    }
};
