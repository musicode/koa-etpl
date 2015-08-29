# koa-etpl

etpl for koa

```

var etpl = require('koa-etpl');

etpl(app, {

    root: __dirname + '/views',

    cache: true,
    extname: '.html',

    engine: {
        strip: true,
        namingConflict: 'error'
    },

    filters: {
        markdown: function (source, useExtra) {

        }
    }

});

```
