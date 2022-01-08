const fs = require('fs');

module.exports = function(app) {
    app.use((req, res, next) => {
        if (req.url.endsWith('.sqlite')) {
            res.setHeader('Content-Length', fs.statSync('docs/geoip.sqlite').size.toString());
        }
        next();
    });
};
