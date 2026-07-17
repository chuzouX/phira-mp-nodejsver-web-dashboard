let currentUser = null;
let isAdmin = false;
let isOwner = false;
let currentPage = 'home';
var userProfile = null;
var routeMap = { '/': 'home', '/room': 'rooms', '/players': 'players', '/admin': 'admin', '/profile': 'profile' };

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupAuth();
    setupThemeToggle();
    setupMobileMenu();
    loadServerConfig();
    checkSession();
    startStatusPolling();
    var initialPage = routeMap[window.location.pathname] || 'home';
    navigateTo(initialPage, true);
});

window.addEventListener('popstate', function() {
    var page = routeMap[window.location.pathname] || 'home';
    navigateTo(page, true);
});

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
    var loginTrigger = document.getElementById('login-trigger');
    if (loginTrigger) loginTrigger.addEventListener('click', openAuthModal);
    document.addEventListener('click', function(e) {
        var dropdown = document.querySelector('.user-dropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.classList.contains('user-avatar')) {
            dropdown.classList.remove('show');
        }
    });
}

function navigateTo(page, silent) {
    closeMobileMenu();
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.toggle('active', item.dataset.page === page);
    });
    document.querySelectorAll('.page-content').forEach(function(c) { c.style.display = 'none'; });
    var target = document.getElementById('page-' + page);
    if (target) target.style.display = 'block';
    if (!silent) {
        var path = Object.keys(routeMap).find(function(k) { return routeMap[k] === page; }) || '/';
        if (window.location.pathname !== path) history.pushState(null, '', path);
    }
    if (page === 'home') loadHomeData();
    else if (page === 'rooms') loadRooms();
    else if (page === 'players') loadPlayers();
    else if (page === 'admin') loadAdminPanel();
    else if (page === 'profile') loadProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupMobileMenu() {
    var btn = document.getElementById('mobile-menu-btn');
    var drawer = document.getElementById('mobile-nav-drawer');
    var backdrop = document.getElementById('mobile-menu-backdrop');
    var closeBtn = document.getElementById('mobile-nav-close');
    if (!btn || !drawer || !backdrop) return;
    btn.addEventListener('click', toggleMobileMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    backdrop.addEventListener('click', closeMobileMenu);
}

function toggleMobileMenu() {
    var drawer = document.getElementById('mobile-nav-drawer');
    var backdrop = document.getElementById('mobile-menu-backdrop');
    var btn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    if (drawer.classList.contains('show')) { closeMobileMenu(); }
    else {
        drawer.classList.add('show');
        backdrop.classList.add('show');
        btn.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    var drawer = document.getElementById('mobile-nav-drawer');
    var backdrop = document.getElementById('mobile-menu-backdrop');
    var btn = document.getElementById('mobile-menu-btn');
    if (drawer) drawer.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
    if (btn) btn.classList.remove('open');
    document.body.style.overflow = '';
}

function setupAuth() {
    var form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(document.getElementById('email').value, document.getElementById('password').value);
        });
    }
}

function openAuthModal() { var m = document.getElementById('auth-modal'); if (m) m.classList.add('show'); }
function closeAuthModal() { var m = document.getElementById('auth-modal'); if (m) m.classList.remove('show'); }

async function handleLogin(email, password) {
    var btn = document.getElementById('auth-submit');
    btn.disabled = true; btn.textContent = 'Logging in...';
    try {
        var res = await fetch('/api/user-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) });
        var data = await res.json();
        if (res.ok && data.success) {
            currentUser = data.user;
            isAdmin = data.user.isAdmin;
            isOwner = data.user.isOwner;
            fetchUserProfile(function() { updateUserMenu(); });
            closeAuthModal();
            navigateTo('home');
            notify('Login successful');
        } else {
            showError('auth-error', data.error || 'Login failed');
        }
    } catch (e) { showError('auth-error', 'Network error'); }
    finally { btn.disabled = false; btn.textContent = 'Login'; }
}

async function checkSession() {
    try {
        var res = await fetch('/check-session');
        var data = await res.json();
        if (data.valid) {
            currentUser = { id: data.userId, name: data.username, isAdmin: data.isAdmin, isOwner: data.isOwner };
            isAdmin = data.isAdmin; isOwner = data.isOwner;
            fetchUserProfile(function() { updateUserMenu(); });
        }
    } catch (e) { console.log('No session'); }
}

function fetchUserProfile(callback) {
    fetch('/api/user-profile', { credentials: 'same-origin' }).then(function(r) {
        return r.ok ? r.json() : null;
    }).then(function(d) {
        if (d) { userProfile = d; }
        if (callback) callback();
    }).catch(function() {
        if (callback) callback();
    });
}

function updateUserMenu() {
    var menu = document.getElementById('user-menu');
    if (currentUser) {
        var avUrl = (userProfile && userProfile.avatar) ? userProfile.avatar : '';
        var placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="8" fill="#2d2d3a"/><text x="20" y="27" text-anchor="middle" fill="#666" font-size="18" font-family="sans-serif">' + (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?') + '</text></svg>');
        menu.innerHTML =
            '<img src="' + (avUrl || placeholder) + '" class="user-avatar" onclick="toggleUserDropdown()" onerror="this.onerror=null;this.src=\'' + placeholder + '\'">' +
            '<div class="user-dropdown" id="user-dropdown">' +
            '<a href="#" onclick="navigateTo(\'profile\');closeDropdown()"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 15 Q2 10 8 10 Q14 10 14 15" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><span>Profile</span></a>' +
            (isAdmin || isOwner ? '<a href="#" onclick="navigateTo(\'admin\');closeDropdown()"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 1 L8 4 M8 12 L8 15 M1 8 L4 8 M12 8 L15 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><span>Admin</span></a>' : '') +
            '<button onclick="logout()"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 2 L6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><rect x="2" y="5" width="7" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10 8 L13 8 M11.5 6.5 L14 8 L11.5 9.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Logout</span></button>' +
            '</div>';
        document.querySelectorAll('.nav-item[data-page="admin"]').forEach(function(el) {
            el.style.display = (isAdmin || isOwner) ? 'flex' : 'none';
        });
    } else {
        menu.innerHTML = '<button class="login-btn" id="login-trigger" onclick="openAuthModal()">Login</button>';
        document.querySelectorAll('.nav-item[data-page="admin"]').forEach(function(el) {
            el.style.display = 'none';
        });
    }
}

function toggleUserDropdown() { var d = document.getElementById('user-dropdown'); if (d) d.classList.toggle('show'); }
function closeDropdown() { var d = document.getElementById('user-dropdown'); if (d) d.classList.remove('show'); }

async function logout() {
    try { await fetch('/logout'); } catch (e) {}
    currentUser = null; isAdmin = false; isOwner = false;
    updateUserMenu(); navigateTo('home'); notify('Logged out');
}

function showError(id, msg) {
    var el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('show'); setTimeout(function() { el.classList.remove('show'); }, 5000); }
}

function notify(msg) {
    var n = document.createElement('div');
    n.style.cssText = 'position:fixed;top:80px;right:24px;background:var(--primary);color:#fff;padding:12px 24px;border-radius:var(--radius);box-shadow:var(--shadow-lg);z-index:3000;font-weight:600;animation:slideIn 0.3s ease;';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function() { n.style.animation = 'slideOut 0.3s ease'; setTimeout(function() { n.remove(); }, 300); }, 3000);
}

function setupThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    var svg = document.getElementById('theme-icon-svg');
    var moon = '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 1 A7 7 0 0 0 8 15 A5 5 0 0 1 8 1" fill="currentColor" opacity="0.3"/>';
    var sun = '<circle cx="8" cy="8" r="4" fill="currentColor"/><path d="M8 1 L8 3 M13 3 L11.5 4.5 M14 8 L12 8 M13 13 L11.5 11.5 M8 14 L8 12 M3 13 L4.5 11.5 M1 8 L3 8 M3 3 L4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>';
    btn.addEventListener('click', function() {
        var isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        svg.innerHTML = isLight ? sun : moon;
    });
    if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); svg.innerHTML = sun; }
}

function loadServerConfig() {
    var cfg = window.SERVER_CONFIG;
    var serverName = (cfg && cfg.serverName) ? cfg.serverName : 'Phira Server';
    document.title = serverName + ' - Dashboard';
    var b = document.getElementById('brand-name'); if (b) b.textContent = serverName;
    var s = document.getElementById('server-name-display'); if (s) s.textContent = serverName;
    var h = document.getElementById('hero-welcome'); if (h) h.textContent = 'Welcome to ' + serverName;
    var ip = document.getElementById('server-ip-display');
    if (cfg && cfg.displayIp && ip) ip.textContent = cfg.displayIp;
}

async function loadHomeData() {
    try {
        var _a = await Promise.all([fetch('/api/status'), fetch('/api/version')]);
        var status = await _a[0].json(); var version = await _a[1].json();
        var a = document.getElementById('online-count'); if (a) a.textContent = status.onlinePlayers || 0;
        var b = document.getElementById('room-count'); if (b) b.textContent = status.roomCount || 0;
        var c = document.getElementById('server-version'); if (c) c.textContent = version.version || '--';
    } catch (e) { console.error(e); }
}

async function loadRooms() {
    var list = document.getElementById('room-list');
    var empty = document.getElementById('empty-rooms');
    var st = document.getElementById('room-status');
    if (st) st.textContent = 'Loading...';
    try {
        var res = await fetch('/api/status'); var data = await res.json();
        if (st) { st.textContent = 'Connected'; st.className = 'connection-status connected'; }
        list.innerHTML = '';
        if (data.rooms && data.rooms.length) {
            empty.style.display = 'none';
            data.rooms.forEach(function(room) {
                var card = document.createElement('div');
                card.className = 'room-card' + (room.isRemote ? ' room-card-remote' : '');
                var lockIcon = room.locked ? 'L' : 'O';
                var lockClass = room.locked ? 'locked-status' : 'unlocked-status';
                var tag = room.isRemote ? '<span class="room-server-tag room-server-remote">' + (room.nodeName || 'Remote') + '</span>' : '';
                card.innerHTML = '<h2>#' + room.id + tag + '</h2><div class="room-info">' +
                    '<p>Mode: <span class="room-mode-tag">' + (room.cycle ? 'Cycle' : 'Normal') + '</span></p>' +
                    '<p>Name: <span>' + (room.name || '--') + '</span></p>' +
                    '<p>Players: <span>' + room.playerCount + ' / ' + room.maxPlayers + '</span></p>' +
                    '<p>Status: <span>' + ((room.state && room.state.type) || 'Idle') + '</span></p>' +
                    '<p>Locked: <span class="' + lockClass + '">' + lockIcon + '</span></p></div>';
                card.addEventListener('click', function() { window.location.href = '/room?id=' + room.id; });
                list.appendChild(card);
            });
        } else { empty.style.display = 'flex'; }
    } catch (e) {
        console.error(e);
        if (st) { st.textContent = 'Disconnected'; st.className = 'connection-status disconnected'; }
    }
}

async function loadPlayers() {
    var container = document.getElementById('player-list-container');
    var empty = document.getElementById('empty-players');
    var st = document.getElementById('player-status');
    if (st) st.textContent = 'Loading...';
    try {
        var res;
        if (isAdmin || isOwner) res = await fetch('/api/all-players');
        else res = await fetch('/api/status');
        var data = await res.json();
        if (st) { st.textContent = 'Connected'; st.className = 'connection-status connected'; }
        var players = [];
        if (isAdmin || isOwner) players = data;
        else players = data.rooms ? data.rooms.flatMap(function(r) { return r.players || []; }) : [];
        if (players.length) {
            empty.style.display = 'none';
            var ul = document.createElement('ul'); ul.className = 'player-list';
            players.forEach(function(p) {
                var li = document.createElement('li'); li.className = 'player-item';
                var pfxClass = p.isOwner ? 'prefix-owner' : (p.isAdmin ? 'prefix-admin' : 'prefix-player');
                var pfxText = p.isOwner ? 'OWNER' : (p.isAdmin ? 'ADMIN' : 'PLAYER');
                li.innerHTML =
                    '<div class="player-info-left">' +
                    '<img src="' + (p.avatar || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="8" fill="#2d2d3a"/><text x="18" y="24" text-anchor="middle" fill="#666" font-size="16" font-family="sans-serif">' + (p.name ? p.name.charAt(0).toUpperCase() : '?') + '</text></svg>')) + '" class="player-avatar-small" onerror="this.onerror=null">' +
                    '<div><span class="name-prefix ' + pfxClass + '">' + pfxText + '</span><span class="player-name">' + p.name + '</span></div></div>' +
                    '<div class="player-info-right">' +
                    ((isAdmin || isOwner) && p.ip ? '<span style="font-size:0.75rem;color:var(--text-tertiary);font-family:monospace;">' + p.ip + '</span>' : '') +
                    ((isAdmin || isOwner) ? '<button class="kick-btn" onclick="kickPlayer(' + p.id + ')">Kick</button>' : '') +
                    '</div>';
                ul.appendChild(li);
            });
            container.innerHTML = ''; container.appendChild(ul);
        } else { empty.style.display = 'flex'; container.innerHTML = ''; }
    } catch (e) {
        console.error(e);
        if (st) { st.textContent = 'Disconnected'; st.className = 'connection-status disconnected'; }
    }
}

async function kickPlayer(userId) {
    if (!confirm('Kick this player?')) return;
    try {
        var res = await fetch('/api/admin/kick-player', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userId }) });
        var data = await res.json();
        if (data.success) { notify('Player kicked'); loadPlayers(); } else notify('Failed');
    } catch (e) { console.error(e); }
}

async function loadAdminPanel() {
    var warning = document.getElementById('admin-warning');
    var panel = document.getElementById('admin-panel');
    if (isAdmin || isOwner) { warning.style.display = 'none'; panel.style.display = 'grid'; loadBans(); loadSystemInfo(); }
    else { warning.style.display = 'flex'; panel.style.display = 'none'; }
}

async function loadBans() {
    try {
        var res = await fetch('/api/admin/bans'); var data = await res.json();
        var tbody = document.getElementById('ban-list-body'); tbody.innerHTML = '';
        var all = [].concat((data.idBans || []).map(function(b) { b.type = 'ID'; return b; }), (data.ipBans || []).map(function(b) { b.type = 'IP'; return b; }));
        if (!all.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bans</td></tr>'; return; }
        all.forEach(function(ban) {
            var row = document.createElement('tr');
            row.innerHTML = '<td>' + ban.type + '</td><td>' + ban.target + '</td><td title="' + ban.reason + '">' + (ban.reason || '') + '</td><td>' + (ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : 'Permanent') + '</td><td><button class="admin-btn action-success" onclick="unban(\'' + ban.type.toLowerCase() + '\',\'' + ban.target + '\')">Unban</button></td>';
            tbody.appendChild(row);
        });
    } catch (e) { console.error(e); }
}

async function executeBan() {
    var type = document.getElementById('ban-type').value;
    var target = document.getElementById('ban-target').value.trim();
    var duration = document.getElementById('ban-duration').value.trim();
    var reason = document.getElementById('ban-reason').value.trim();
    if (!target) { notify('Enter target'); return; }
    try {
        var res = await fetch('/api/admin/ban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: type, target: target, duration: duration || null, reason: reason || null }) });
        var data = await res.json();
        if (data.success) { notify('Banned'); document.getElementById('ban-target').value = ''; document.getElementById('ban-duration').value = ''; document.getElementById('ban-reason').value = ''; loadBans(); }
        else notify('Failed');
    } catch (e) { console.error(e); }
}

async function unban(type, target) {
    if (!confirm('Unban ' + target + '?')) return;
    try {
        var res = await fetch('/api/admin/unban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: type, target: target }) });
        var data = await res.json();
        if (data.success) { notify('Unbanned'); loadBans(); }
    } catch (e) { console.error(e); }
}

async function loadSystemInfo() {
    try {
        var res = await fetch('/api/owner/system-info'); var data = await res.json();
        document.getElementById('system-info').innerHTML =
            '<div class="system-info-item"><span class="label">Uptime</span><span class="value">' + formatUptime(data.uptime) + '</span></div>' +
            '<div class="system-info-item"><span class="label">RSS</span><span class="value">' + ((data.memory && data.memory.rss) || 0) + ' MB</span></div>' +
            '<div class="system-info-item"><span class="label">Heap</span><span class="value">' + ((data.memory && data.memory.heapUsed) || 0) + ' MB</span></div>' +
            '<div class="system-info-item"><span class="label">Node</span><span class="value">' + (data.nodeVersion || '-') + '</span></div>';
    } catch (e) { console.log('System info not available'); }
}

function formatUptime(s) {
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d > 0) return d + 'd ' + h + 'h'; if (h > 0) return h + 'h ' + m + 'm'; return m + 'm';
}

async function adminAction(action) {
    if (action === 'broadcast') {
        var content = document.getElementById('broadcast-content').value.trim();
        if (!content) { notify('Enter message'); return; }
        try {
            var res = await fetch('/api/admin/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: content }) });
            var data = await res.json();
            if (data.success) { notify('Sent to ' + data.roomCount + ' rooms'); document.getElementById('broadcast-content').value = ''; }
        } catch (e) { console.error(e); }
    }
}

function copyServerIp() {
    var ip = document.getElementById('server-ip-display').textContent;
    navigator.clipboard.writeText(ip).then(function() { notify('IP copied'); }).catch(function() { notify('Failed'); });
}

function startStatusPolling() {
    setInterval(function() {
        if (currentPage === 'home') loadHomeData();
        if (currentPage === 'rooms') loadRooms();
        if (currentPage === 'players') loadPlayers();
    }, 5000);
}

async function loadProfile() {
    if (!currentUser) { openAuthModal(); return; }
    var avatar = document.getElementById('profile-avatar');
    var nameEl = document.getElementById('profile-name');
    var idEl = document.getElementById('profile-id');
    var emailEl = document.getElementById('profile-email');
    var roleEl = document.getElementById('profile-role');
    var rksEl = document.getElementById('profile-rks');

    function applyProfile() {
        if (avatar) {
            if (userProfile && userProfile.avatar) {
                avatar.src = userProfile.avatar;
                var navAv = document.querySelector('.user-avatar');
                if (navAv) navAv.src = userProfile.avatar;
            }
        }
        if (nameEl) nameEl.textContent = (userProfile && userProfile.name) || currentUser.name || 'Unknown';
        if (idEl) idEl.textContent = 'ID: ' + currentUser.id;
        if (emailEl) emailEl.textContent = (userProfile && userProfile.email) || currentUser.email || '';
        if (rksEl && userProfile && userProfile.rks !== undefined) rksEl.textContent = Number(userProfile.rks).toFixed(2);
    }

    if (avatar) {
        var placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="20" fill="#2d2d3a"/><text x="60" y="78" text-anchor="middle" fill="#666" font-size="48" font-family="sans-serif">' + (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?') + '</text></svg>');
        avatar.src = placeholder;
        avatar.onerror = function() { this.src = placeholder; };
    }
    applyProfile();
    fetchUserProfile(function() { applyProfile(); });

    var roleText = 'Player', roleColor = 'var(--text-tertiary)';
    if (currentUser.isOwner) { roleText = 'Owner'; roleColor = 'var(--warning)'; }
    else if (currentUser.isAdmin) { roleText = 'Admin'; roleColor = 'var(--primary)'; }
    if (roleEl) { roleEl.textContent = roleText; roleEl.style.background = roleColor; }

    try {
        var sRes = await fetch('/check-session'); var sData = await sRes.json();
        if (sData.valid) {
            var lt = document.getElementById('session-login-time'); if (lt) lt.textContent = new Date(sData.expiresAt - 30*86400000).toLocaleString();
            var et = document.getElementById('session-expire-time'); if (et) et.textContent = new Date(sData.expiresAt).toLocaleString();
            var ip = document.getElementById('session-ip'); if (ip) ip.textContent = sData.ip || '--';
        }
    } catch (e) { console.error(e); }

    try {
        var statusRes = await fetch('/api/status'); var statusData = await statusRes.json();
        var rc = document.getElementById('profile-room-count');
        if (rc && statusData.rooms) rc.textContent = statusData.rooms.length;
    } catch (e) { console.error(e); }
}
