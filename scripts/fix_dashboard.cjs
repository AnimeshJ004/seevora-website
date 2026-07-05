const fs = require("fs");

// Fix Dashboard.css - ensure dark theme doesn't leak from index.css variables
const css = `
/* SEEVORA DASHBOARD - Dark Navy Theme */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap');

.ds-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #0a0f1e !important;
  font-family: 'Inter', sans-serif;
  color: #e2e8f0;
}

.ds-layout * { box-sizing: border-box; }

.ds-layout h1, .ds-layout h2, .ds-layout h3,
.ds-layout h4, .ds-layout h5, .ds-layout h6 {
  color: #f1f5f9;
}

.ds-sidebar {
  width: 220px;
  flex-shrink: 0;
  height: 100vh;
  background: #0d1b2e !important;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.ds-sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.ds-sidebar-logo img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.ds-sidebar-logo-text {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #f1f5f9 !important;
  letter-spacing: -0.01em;
  display: block;
}

.ds-sidebar-logo-sub {
  font-size: 0.6rem;
  color: #475569 !important;
  display: block;
  margin-top: 1px;
}

.ds-role-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 100px;
  margin-left: auto;
  flex-shrink: 0;
}

.ds-nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 6px 10px;
  gap: 1px;
  overflow-y: auto;
}

.ds-nav-group-label {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2d4a6a !important;
  padding: 10px 8px 4px;
  margin-top: 4px;
}

.ds-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #7a8fa8 !important;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  background: none !important;
  width: 100%;
  text-align: left;
}

.ds-nav-item:hover {
  background: rgba(255,255,255,0.05) !important;
  color: #e2e8f0 !important;
}

.ds-nav-item.active {
  background: #1e3a5f !important;
  color: #4f8ef7 !important;
  font-weight: 600;
}

.ds-nav-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.ds-nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: #fff !important;
  font-size: 0.58rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 100px;
}

.ds-nav-item.locked { opacity: 0.3; cursor: not-allowed; }

.ds-sidebar-bottom {
  padding: 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.ds-subscription-box {
  background: linear-gradient(135deg, #1a2d4a, #162540) !important;
  border: 1px solid rgba(79,142,247,0.2);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.ds-subscription-box .plan-label {
  font-size: 0.62rem;
  color: #4f8ef7 !important;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 2px;
  display: block;
}

.ds-subscription-box .plan-name {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.92rem;
  color: #f1f5f9 !important;
  display: block;
}

.ds-subscription-box .plan-exp {
  font-size: 0.66rem;
  color: #64748b !important;
  margin-top: 2px;
  margin-bottom: 10px;
  display: block;
}

.ds-subscription-box button {
  width: 100%;
  padding: 7px;
  background: #4f8ef7 !important;
  border: none;
  border-radius: 6px;
  color: #fff !important;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.ds-sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.ds-sidebar-user:hover { background: rgba(255,255,255,0.04) !important; }

.ds-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  color: #fff !important;
  flex-shrink: 0;
}

.ds-user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0 !important;
}

.ds-user-role {
  font-size: 0.65rem;
  color: #64748b !important;
}

.ds-logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  width: 100%;
  background: none !important;
  border: none;
  color: #64748b !important;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  margin-top: 4px;
  transition: all 0.15s;
}

.ds-logout-btn:hover {
  background: rgba(239,68,68,0.08) !important;
  color: #ef4444 !important;
}

.ds-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: #0a0f1e !important;
}

.ds-header {
  height: 60px;
  background: #0d1b2e !important;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 10px;
  flex-shrink: 0;
}

.ds-hamburger {
  background: none !important;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.ds-hamburger span {
  display: block;
  width: 18px;
  height: 2px;
  background: #64748b;
  border-radius: 2px;
}

.ds-search-wrap {
  flex: 1;
  max-width: 360px;
  position: relative;
}

.ds-search {
  width: 100%;
  padding: 8px 50px 8px 34px;
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: #e2e8f0 !important;
  font-size: 0.8rem;
  outline: none;
  transition: border-color 0.2s;
}

.ds-search::placeholder { color: #475569 !important; }
.ds-search:focus { border-color: #4f8ef7; }

.ds-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #475569;
  pointer-events: none;
}

.ds-search-kbd {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.62rem;
  color: #334155 !important;
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 4px;
}

.ds-header-spacer { flex: 1; }

.ds-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8b9cb6 !important;
  position: relative;
  transition: all 0.15s;
  flex-shrink: 0;
}

.ds-icon-btn:hover {
  background: rgba(255,255,255,0.08) !important;
  color: #e2e8f0 !important;
}

.ds-notif-count {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #0d1b2e;
  font-size: 0.5rem;
  font-weight: 700;
  color: #fff !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ds-header-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.15s;
  background: rgba(255,255,255,0.03) !important;
}

.ds-header-profile:hover { background: rgba(255,255,255,0.06) !important; }

.ds-header-profile-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0 !important;
}

.ds-header-profile-role {
  font-size: 0.65rem;
  color: #64748b !important;
}

.ds-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #0a0f1e !important;
}

.ds-footer {
  background: #0d1b2e !important;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 10px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.ds-footer span, .ds-footer a {
  font-size: 0.7rem;
  color: #2d4a6a !important;
  cursor: pointer;
  text-decoration: none;
}

.ds-access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 12px;
  text-align: center;
}

.ds-access-denied h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: #f1f5f9 !important;
}

.ds-access-denied p { font-size: 0.88rem; color: #64748b !important; max-width: 320px; }

@media (max-width: 768px) {
  .ds-sidebar { display: none; }
  .ds-content { padding: 16px; }
}
`;

fs.writeFileSync("src/components/dashboard/Dashboard.css", css, "utf8");
console.log("CSS done");
