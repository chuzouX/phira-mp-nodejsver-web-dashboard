"use strict";
// 自定义路由注入 — 独立文件，避免被回退覆盖
// 如果 /panel 消失，说明 main.js 被回退了，重新运行 npm start 即可

module.exports = function attachCustomRoutes(app, { serveHtmlWithConfig, verifyUserRole, publicPath }) {
    // /room — 无 id 参数时跳回 SPA
    app.get(['/room', '/room.html'], (req, res) => {
        if (req.query.id) {
            return serveHtmlWithConfig(res, require('path').join(publicPath, 'room.html'));
        }
        return res.redirect('/?page=rooms');
    });

    // /players — 跳回 SPA
    app.get(['/players', '/players.html'], (_req, res) => {
        return res.redirect('/?page=players');
    });

    // /panel — 鉴权 + iframe 支持
    app.get(['/panel', '/panel.html'], verifyUserRole('Admin'), (req, res) => {
        if (req.query.embed === '1') {
            return serveHtmlWithConfig(res, require('path').join(publicPath, 'panel.html'));
        }
        return res.redirect('/?page=admin');
    });
};
