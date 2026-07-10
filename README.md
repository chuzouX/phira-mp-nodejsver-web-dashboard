# Web Dashboard Plugin

Web 管理面板，提供服务器状态监控、房间管理、玩家管理等功能。

## 功能特性

- ✅ **服务器状态** - 实时查看在线人数、房间列表
- ✅ **房间管理** - 查看房间详情、强制开始、锁定/解锁、设置人数上限、关闭房间
- ✅ **玩家管理** - 查看在线玩家、踢出玩家
- ✅ **封禁管理** - IP/ID 封禁与解封，登录失败黑名单
- ✅ **全服广播** - 向所有房间或指定房间发送广播
- ✅ **Phira 账号登录** - 支持管理员/Owner 角色鉴权
- ✅ **NoneBot 集成** - 支持 AES-256-CBC 加密鉴权
- ✅ **联邦支持** - 跨服务器房间查看
- ✅ **极验验证码** - 支持 Geetest 验证码（可选）
- ✅ **多语言** - 支持中文/英文界面

## 配置方法

在 `config/web-dashboard/config.yaml` 中配置：

```yaml
# 显示的服务器 IP/域名
displayIp: "your-server.com:666"

# Session 密钥（强烈建议修改为随机字符串）
sessionSecret: "change-this-to-a-random-secret"

# 登录失败后 IP 黑名单持续时间（秒）
loginBlacklistDuration: 600

# 验证码提供商 (geetest / none)
captchaProvider: none

# 允许的跨域来源
allowedOrigins:
  - http://localhost:5173
  - http://localhost:3000

# 公开房间过滤
enablePubWeb: false
pubPrefix: "pub"

# 私密房间过滤
enablePriWeb: false
priPrefix: "sm"
```

## 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 - 服务器状态总览 |
| `/login` | 管理员登录 |
| `/admin` | 管理面板 |
| `/room` | 房间列表与详情 |
| `/players` | 在线玩家列表（需管理员） |
| `/manage` | 房间管理面板 |
| `/panel` | 控制面板 |

## API 接口

### 公共接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 服务器状态 |
| GET | `/api/public-config` | 公开配置 |
| GET | `/api/version` | 服务端版本 |
| POST | `/api/user-login` | 用户登录 |

### 管理员接口
| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/all-players` | Admin | 所有玩家列表 |
| POST | `/api/admin/server-message` | Admin | 发送房间消息 |
| POST | `/api/admin/broadcast` | Admin | 全服广播 |
| POST | `/api/admin/kick-player` | Admin | 踢出玩家 |
| GET | `/api/admin/bans` | Admin | 封禁列表 |
| POST | `/api/admin/ban` | Admin | 封禁玩家 |
| POST | `/api/admin/unban` | Admin | 解封玩家 |

### Owner 接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/owner/system-info` | 系统信息 |

### 联邦接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/federation/handshake` | 联邦握手 |
| GET | `/api/federation/health` | 联邦健康检查 |
| GET | `/api/federation/peers` | 联邦节点列表 |
| GET | `/api/federation/rooms` | 联邦房间列表 |

## 依赖说明

本插件依赖 **websocket** 插件：
- **websocket** (UUID: `c8d4e5f6-9a2b-4c7d-8e1f-3a9b6c5d7e2a`)
  - 提供 WebSocket 实时通信

插件加载顺序：
1. websocket (无依赖)
2. **web-dashboard** (依赖 websocket)

## 开发者信息

- **插件 ID**: web-dashboard
- **UUID**: b9e2f5a8-7c3d-4f1e-9a6b-2d8c4e5f7a1b
- **版本**: 1.2.0
- **依赖**: websocket (c8d4e5f6-9a2b-4c7d-8e1f-3a9b6c5d7e2a)
