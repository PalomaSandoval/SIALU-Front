import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar/Main.tsx';
import Navbar from './navbar/Main.tsx';
import { theme } from '../theme/theme.ts';
const navigationStyles = `
body{margin:0}
.private-layout{--nav-accent:var(--palette-primary);--nav-soft:var(--palette-noticeSurface);--nav-border:var(--palette-border);min-height:100svh;background:var(--palette-page);color:var(--palette-text);font-family:var(--font-body,'Segoe UI',sans-serif)}
.private-layout *{box-sizing:border-box}.private-layout button,.private-layout a{font:inherit}.private-layout button{cursor:pointer}.private-layout button:focus-visible,.private-layout a:focus-visible,.private-layout summary:focus-visible{outline:2px solid var(--nav-accent);outline-offset:3px}
.private-navbar{height:70px;background:var(--palette-white);border-bottom:1px solid var(--nav-border);display:flex;align-items:center;justify-content:space-between;padding:0 26px 0 18px;position:relative;z-index:30}.navbar-brand,.brand-link{display:flex;align-items:center;gap:14px}.brand-link{color:var(--palette-text);text-decoration:none;font-size:19px;letter-spacing:2px;font-weight:600}.brand-link small{display:block;font-size:10px;font-weight:400;letter-spacing:.3px;color:var(--palette-legacyMuted);margin-top:2px}.brand-symbol{background:var(--nav-accent);color:var(--palette-white);border-radius:9px;width:37px;height:39px;display:grid;place-items:center}.navbar-toggle{border:0;background:transparent;padding:8px;color:var(--palette-legacyMuted);display:grid;place-items:center;border-radius:6px}.navbar-toggle:hover{background:var(--nav-soft)}
.navbar-user{position:relative}.user-trigger{display:flex;align-items:center;gap:10px;background:transparent;border:0;padding:7px;border-radius:7px;color:var(--palette-muted);font-size:13px}.user-trigger:hover{background:var(--palette-noticeSurface)}.user-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--nav-soft);color:var(--nav-accent);font-size:12px;font-weight:600}.user-options{position:absolute;right:0;top:52px;width:240px;max-width:calc(100vw - 30px);background:var(--palette-white);border:1px solid var(--nav-border);border-radius:8px;box-shadow:0 8px 24px var(--palette-legacyCardShadow);padding:16px;overflow-wrap:anywhere}.user-options>strong,.user-options>span{display:block;font-size:13px;margin-bottom:6px}.user-options>span{font-size:12px;color:var(--palette-legacyMuted)}.user-options button{width:100%;margin-top:12px;border:1px solid var(--nav-border);background:var(--palette-noticeSurface);padding:9px;border-radius:6px;color:var(--palette-noticeText)}.user-options p{font-size:12px;color:var(--palette-errorText)}
.private-body{display:flex;min-height:calc(100svh - 70px)}.private-sidebar{width:250px;flex-shrink:0;background:var(--palette-white);border-right:1px solid var(--nav-border);padding:24px 12px 18px;display:flex;flex-direction:column}.sidebar-heading{font-size:10px;color:var(--palette-legacyMuted);letter-spacing:1.5px;padding:0 12px;margin-bottom:16px}.menu-link,.menu-group>summary{display:flex;align-items:center;gap:10px;min-height:42px;padding:10px 12px;border-radius:6px;margin:3px 0;text-decoration:none;color:var(--palette-muted);font-size:13px;overflow-wrap:anywhere}.menu-group>summary{cursor:pointer;list-style:none}.menu-group>summary::-webkit-details-marker{display:none}.menu-group>summary:after{content:'›';margin-left:auto;font-size:18px;line-height:1}.menu-group[open]>summary:after{transform:rotate(90deg)}.menu-link:hover,.menu-group>summary:hover{background:var(--palette-noticeSurface)}.menu-link.is-active{background:var(--nav-soft);color:var(--nav-accent);font-weight:600}.menu-link svg,.menu-group svg{flex-shrink:0}.menu-children{margin-left:20px;padding-left:8px;border-left:1px solid var(--nav-border)}.sidebar-footer{margin-top:auto;padding:32px 12px 0;font-size:12px;color:var(--palette-primary)}.sidebar-footer span{display:block;color:var(--palette-placeholder);font-size:11px;margin-top:4px}.private-content{flex:1;min-width:0;padding:30px}.private-content h1{font-size:24px;font-weight:500;margin:8px 0 24px}.section-breadcrumb{font-size:12px;color:var(--palette-legacyMuted)}.section-placeholder{border:1px solid var(--nav-border);border-radius:7px;background:var(--palette-white);padding:24px;min-height:230px}.section-placeholder h2{font-size:15px;font-weight:500;margin:0 0 12px}.section-placeholder p{font-size:13px;color:var(--palette-legacyMuted);line-height:1.7}.sidebar-backdrop{display:none}
@media(min-width:801px){.private-sidebar.is-collapsed{width:72px;padding:24px 10px}.private-sidebar.is-collapsed .sidebar-heading,.private-sidebar.is-collapsed .sidebar-footer{display:none}.rail-link{justify-content:center;width:100%;border:0;background:transparent}.rail-link.is-active{background:var(--nav-soft)}}
@media(max-width:800px){.private-navbar{padding:0 12px}.private-sidebar{display:none;position:absolute;top:70px;left:0;z-index:25;min-height:calc(100svh - 70px);width:260px;max-width:85vw}.private-sidebar.is-open{display:flex}.sidebar-backdrop{display:block;position:fixed;inset:70px 0 0;background:var(--palette-legacyCardShadow);border:0;z-index:20}.private-content{padding:24px 18px}.user-name{display:none}}

/* Submenús con guía vertical y puntos de navegación. */
.menu-children{margin:5px 0 9px 21px;padding-left:17px;border-left:1px solid var(--palette-divider)}
.menu-children>.menu-link,.menu-children>.menu-group>summary{position:relative;min-height:42px;padding:10px 12px;margin:3px 0;color:var(--palette-muted);background:transparent;font-size:12px}
.menu-children>.menu-link::before,.menu-children>.menu-group>summary::before{content:'';position:absolute;left:-22px;top:50%;width:7px;height:7px;transform:translateY(-50%);border-radius:50%;background:var(--palette-divider);box-shadow:0 0 0 4px var(--palette-white)}
.menu-children>.menu-link:hover,.menu-children>.menu-group>summary:hover{color:var(--palette-primary);background:var(--palette-noticeSurface)}
.menu-children>.menu-link.is-active{color:var(--palette-primary);background:transparent;font-weight:600}
.menu-children>.menu-link.is-active::before,.menu-children>.menu-group:has(.menu-link.is-active)>summary::before{background:var(--palette-primary)}
.menu-children>.menu-group:has(.menu-link.is-active)>summary{color:var(--palette-primary)}
.menu-children .menu-children{margin-left:12px}
/* Marco claro con cabecera lateral y paleta compartida del login. */
.private-layout{--nav-accent:var(--palette-primary);--nav-soft:var(--palette-noticeSurface);--nav-border:var(--palette-legacyBorder);background:var(--palette-white);border-top:4px solid var(--palette-primary);display:grid;grid-template-columns:230px minmax(0,1fr);grid-template-rows:54px minmax(calc(100svh - 58px),auto)}
.private-navbar{grid-column:2;grid-row:1;height:54px;padding:0 24px 0 14px;border-bottom:1px solid var(--nav-border);background:var(--palette-white)}
.private-body{display:contents;min-height:0}
.private-sidebar{grid-column:1;grid-row:1 / 3;width:auto;padding:0 0 20px;border-right:1px solid var(--nav-border)}
.sidebar-brand{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:150px;padding:20px 12px;text-decoration:none;color:var(--palette-muted);gap:3px}
.sidebar-logo{display:grid;place-items:center;color:var(--nav-accent);width:58px;height:58px}
.sidebar-brand-name{font-size:16px;font-weight:600;letter-spacing:1.2px;margin-top:3px}
.sidebar-brand-caption{font-size:10px;color:var(--palette-placeholder);letter-spacing:.2px}
.private-sidebar>nav{padding:0 14px}
.menu-link,.menu-group>summary{border-radius:0;font-size:12px;min-height:44px;color:var(--palette-legacyMuted);padding:11px 12px;margin:3px 0}
.menu-link svg,.menu-group>summary svg{color:var(--palette-icon);stroke-width:1.6}
.menu-link.is-active{background:var(--palette-noticeSurface);color:var(--palette-text);position:relative}
.private-sidebar>nav>.menu-link.is-active:before{content:'';position:absolute;left:-14px;top:7px;bottom:7px;width:3px;background:var(--palette-eyeActive)}
.menu-link.is-active svg,.menu-group:has(.menu-link.is-active)>summary svg{color:var(--palette-primary)}
.menu-group:has(.menu-link.is-active)>summary{color:var(--palette-text);font-weight:500}
.sidebar-footer{padding-left:26px;color:var(--palette-legacyMuted);font-size:11px}
.private-content{grid-column:2;grid-row:2;padding:27px 26px;background:var(--palette-white)}
.section-placeholder{background:var(--palette-white);border-color:var(--nav-border);box-shadow:none;border-radius:2px}
.user-trigger{font-size:12px;color:var(--palette-legacyMuted)}
.user-avatar{background:var(--palette-noticeSurface);color:var(--palette-primary);width:30px;height:30px}
.navbar-toggle{color:var(--palette-muted)}
.menu-children{border-color:var(--palette-divider)}
.menu-children>.menu-link,.menu-children>.menu-group>summary{font-size:12px}
@media(min-width:801px){.private-layout.sidebar-compact{grid-template-columns:72px minmax(0,1fr)}.private-sidebar.is-collapsed{width:auto;padding:0 0 20px}.is-collapsed .sidebar-brand{min-height:105px;padding:12px 4px}.is-collapsed .sidebar-logo{width:42px;height:42px}.is-collapsed .sidebar-logo svg{width:33px;height:33px}.is-collapsed .sidebar-brand-name,.is-collapsed .sidebar-brand-caption{display:none}.is-collapsed>nav{padding:0 10px}.rail-link.is-active{background:var(--palette-noticeSurface)}.private-sidebar.is-collapsed>nav>.menu-link.is-active:before{left:-10px}}
@media(max-width:800px){.private-layout{grid-template-columns:minmax(0,1fr);grid-template-rows:54px minmax(calc(100svh - 58px),auto)}.private-navbar{grid-column:1;padding:0 12px}.private-content{grid-column:1;padding:23px 18px}.private-sidebar{display:none;position:absolute;top:58px;left:0;width:260px;min-height:calc(100svh - 58px);z-index:25}.private-sidebar.is-open{display:flex}.sidebar-backdrop{top:58px}.sidebar-brand{min-height:130px}.private-sidebar .sidebar-footer{display:block}}
.sidebar-logo img{display:block;width:100%;height:100%;object-fit:contain}

.sidebar-brand-name{font-family:var(--font-title);font-size:clamp(24px,2.15vw,32px);font-weight:700;line-height:1.25;letter-spacing:2px;color:var(--palette-text);margin:20px 0 12px}
@media(max-width:640px){.sidebar-brand-name{font-size:27px}}
.navbar-sialu{font-family:var(--font-title);font-size:24px;font-weight:700;letter-spacing:2px;line-height:1.25;color:var(--palette-text);text-decoration:none}

/* Acentos secundarios de la paleta del login. */
.private-layout .menu-children>.menu-link.is-active::before,
.private-layout .menu-children>.menu-group:has(.menu-link.is-active)>summary::before{background:var(--palette-eyeActive)}
.private-layout .menu-group:has(.menu-link.is-active)>summary:after{color:var(--palette-primary)}
.private-layout .navbar-toggle:hover{color:var(--palette-primary)}
.private-layout .user-avatar{box-shadow:none}
.private-layout button:focus-visible,.private-layout a:focus-visible,.private-layout summary:focus-visible{outline-color:var(--palette-eyeActive)}
.private-layout .user-options button:hover{background:var(--palette-primary);color:var(--palette-buttonText)}
/* Profundidad, jerarquía y estados de navegación. */
.private-layout,.private-content{background:var(--palette-workspaceSurface)}
.private-sidebar{background:var(--palette-sidebarSurface)}
.private-navbar{border-bottom:0;box-shadow:0 1px 5px var(--palette-surfaceShadow)}
.section-placeholder{background:var(--palette-white);border:1px solid color-mix(in srgb,var(--palette-divider) 40%,transparent);border-radius:10px;box-shadow:0 1px 3px var(--palette-surfaceShadow);padding:26px}
.private-sidebar .menu-link,.private-sidebar .menu-group>summary{font-size:13px;font-weight:500;border-radius:7px}
.private-sidebar .menu-link svg,.private-sidebar .menu-group>summary svg{stroke-width:2;color:var(--palette-muted)}
.private-sidebar .menu-link.is-active,.private-sidebar .menu-group:has(.menu-link.is-active)>summary{background:var(--palette-navigationActive);color:var(--palette-primary)}
.private-sidebar .menu-link.is-active svg,.private-sidebar .menu-group:has(.menu-link.is-active)>summary svg{color:var(--palette-primary)}
.private-sidebar .menu-children>.menu-link.is-active{background:var(--palette-navigationActive)}
.private-sidebar .menu-children>.menu-link::before,.private-sidebar .menu-children>.menu-group>summary::before{box-shadow:0 0 0 4px var(--palette-sidebarSurface)}
.sidebar-section-label{font-size:10px;font-weight:600;letter-spacing:1.4px;color:var(--palette-legacyMuted);margin:23px 12px 9px}
.sidebar-section-label:first-child{margin-top:6px}
.sidebar-brand{min-height:122px}
.sidebar-session{margin-top:auto;padding:32px 24px 0}
.sidebar-signature{font-size:12px;font-weight:600;color:var(--palette-primary)}
.sidebar-signature small{display:block;font-weight:400;font-size:11px;color:var(--palette-legacyMuted);margin:5px 0 14px}
.sidebar-session button{width:100%;padding:9px;border:1px solid var(--palette-divider);background:var(--palette-white);color:var(--palette-muted);border-radius:7px;font-size:12px}
.sidebar-session button:hover{background:var(--palette-noticeSurface);color:var(--palette-primary)}
.sidebar-session p{font-size:12px;color:var(--palette-errorText);overflow-wrap:anywhere}
.user-identity{display:flex;flex-direction:column;text-align:left;gap:3px;min-width:0}
.user-name{font-size:13px;font-weight:500;color:var(--palette-text);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-role{font-size:11px;color:var(--palette-legacyMuted)}
.section-breadcrumb{font-size:13px;color:var(--palette-muted);line-height:1.6}
.section-breadcrumb span{color:var(--palette-primary)}
.section-heading{margin:13px 0 26px;display:flex;justify-content:space-between;gap:20px;align-items:center}
.section-heading h1{margin:0 0 8px;font-size:26px;font-weight:600}
.section-heading p{margin:0;color:var(--palette-legacyMuted);font-size:13px;line-height:1.7;max-width:700px}
@media(max-width:800px){.user-identity{display:none}.private-sidebar{background:var(--palette-sidebarSurface)}.section-placeholder{padding:20px}.section-heading h1{font-size:23px}}
/* Los submenús conservan una apariencia neutra al seleccionarse. */
.private-layout .private-sidebar .menu-children .menu-link.is-active,
.private-layout .private-sidebar .menu-children .menu-group:has(.menu-link.is-active)>summary{background:transparent;color:var(--palette-text)}
.private-layout .private-sidebar .menu-children .menu-link.is-active::before,
.private-layout .private-sidebar .menu-children .menu-group:has(.menu-link.is-active)>summary::before{background:var(--palette-primary)}
.private-layout .private-sidebar .menu-children .menu-group:has(.menu-link.is-active)>summary:after{color:var(--palette-muted)}
.private-layout .private-sidebar .menu-children .menu-link:hover,
.private-layout .private-sidebar .menu-children .menu-group>summary:hover{background:var(--palette-neutralSurface);color:var(--palette-text)}
/* Subniveles de texto: el acento identifica únicamente la página activa. */
.private-layout .private-sidebar .menu-children{border-left:0;margin:2px 0 6px 14px;padding-left:10px}
.private-layout .private-sidebar .menu-children .menu-link,
.private-layout .private-sidebar .menu-children .menu-group>summary{min-height:38px;margin:2px 0;padding:9px 12px;font-size:13px;line-height:20px}
.private-layout .private-sidebar .menu-children .menu-link{font-weight:400;color:var(--palette-legacyMuted)}
.private-layout .private-sidebar .menu-children .menu-group>summary{font-weight:500;color:var(--palette-text);background:transparent}
.private-layout .private-sidebar .menu-children .menu-link::before,
.private-layout .private-sidebar .menu-children .menu-group>summary::before{content:none;box-shadow:none}
.private-layout .private-sidebar .menu-group:has(.menu-link.is-active)>summary{background:transparent;color:var(--palette-text);font-weight:500}
.private-layout .private-sidebar .menu-group:has(.menu-link.is-active)>summary svg,
.private-layout .private-sidebar .menu-group:has(.menu-link.is-active)>summary:after{color:var(--palette-muted)}
.private-layout .private-sidebar .menu-children .menu-link.is-active{position:relative;background:var(--palette-navigationActive);color:var(--palette-primary);font-weight:500;border-radius:5px}
.private-layout .private-sidebar .menu-children .menu-link.is-active::before{content:'';position:absolute;left:0;top:8px;bottom:8px;transform:none;width:3px;height:auto;border-radius:2px;background:var(--palette-primary);box-shadow:none}
.private-layout .private-sidebar .menu-children .menu-link:not(.is-active):hover,
.private-layout .private-sidebar .menu-children .menu-group>summary:hover{background:var(--palette-neutralSurface);color:var(--palette-text)}
/* Jerarquía de grupos y marca lateral de la sección activa. */
.private-layout .private-sidebar .menu-children .menu-group>summary{font-weight:500}
.private-layout .private-sidebar>nav>.menu-group:has(.menu-link.is-active)>summary{position:relative}
.private-layout .private-sidebar>nav>.menu-group:has(.menu-link.is-active)>summary::before{content:'';position:absolute;left:-14px;top:7px;bottom:7px;width:3px;background:var(--palette-eyeActive);border-radius:2px}
.private-layout .private-sidebar .menu-group:has(.menu-link.is-active)>summary{font-weight:600}

/* Logotipo y control lateral intercambiados. */
.navbar-logo{display:grid;place-items:center;width:42px;height:42px;flex:none}
.navbar-logo img{display:block;width:100%;height:100%;object-fit:contain}
.navbar-toggle-mobile{display:none}
.sidebar-brand{align-items:flex-start;padding-left:16px}
.sidebar-toggle{display:grid;place-items:center;width:40px;height:40px}
@media(min-width:801px){.is-collapsed .sidebar-brand{padding-left:16px}}
@media(max-width:800px){.navbar-toggle-mobile{display:grid}.sidebar-toggle{display:none}}

/* Franja horizontal bajo el navbar, sin desplazar el sidebar. */
.private-layout{grid-template-rows:54px 54px minmax(calc(100svh - 112px),auto)}
.private-sidebar{grid-row:1 / 4}
.private-navbar{padding-left:26px}
.private-subnavbar{grid-column:2;grid-row:2;display:flex;align-items:center;padding:0 26px;background:var(--palette-white);border-bottom:1px solid var(--palette-legacyBorder);box-shadow:none}
.private-subnavbar .subnavbar-link{align-self:stretch;display:flex;align-items:center;margin:0 28px 0 0;padding:0;min-height:0;border-bottom:3px solid transparent;border-radius:0;background:transparent;color:var(--palette-muted);font-size:13px;font-weight:500;text-decoration:none}
.private-subnavbar .subnavbar-link:hover{background:transparent;color:var(--palette-text)}
.private-subnavbar .subnavbar-link.is-active{background:transparent;border-bottom-color:var(--palette-primary);color:var(--palette-text);font-weight:600}
.subnav-group{position:relative;align-self:stretch;height:100%}
.private-subnavbar .subnav-trigger{height:100%;box-sizing:border-box;gap:6px;border-top:0;border-right:0;border-left:0;cursor:pointer}
.subnav-trigger::after{content:'';width:6px;height:6px;border-right:1px solid currentColor;border-bottom:1px solid currentColor;transform:translateY(-2px) rotate(45deg);transition:transform .18s ease}
.subnav-trigger[aria-expanded=true]::after{transform:translateY(2px) rotate(225deg)}
.subnav-options{position:absolute;top:100%;left:0;z-index:35;width:min(620px,calc(100vw - 24px));max-height:calc(100svh - 130px);overflow:auto;padding:10px;background:var(--palette-white);border:1px solid var(--palette-legacyBorder)}
.subnav-options[data-state=open]{animation:subnav-enter .18s cubic-bezier(.2,.8,.2,1) both}
@keyframes subnav-enter{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){.subnav-options[data-state=open],.subnav-options[data-state=closed]{animation:none}}
.subnav-options ul{list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin:0;padding:0}
.subnav-options .subnav-option{display:flex;flex-direction:column;gap:6px;min-height:76px;padding:12px;border-radius:6px;color:var(--palette-text);text-decoration:none}
.subnav-options .subnav-option:hover,.subnav-options .subnav-option.is-active{background:var(--palette-neutralSurface)}
.subnav-option strong{font-size:13px;font-weight:600}
.subnav-option span{color:var(--palette-legacyMuted);font-size:11px;line-height:1.5}
.private-content{grid-row:3}
@media(max-width:800px){.private-layout{grid-template-rows:54px 54px minmax(calc(100svh - 112px),auto)}.private-navbar{padding-left:18px}.private-subnavbar{grid-column:1;padding:0 18px}.private-content{grid-row:3}}
@media(max-width:640px){.private-subnavbar .subnavbar-link{margin-right:20px;font-size:12px}.private-subnavbar .subnav-trigger{gap:6px}.subnav-options{left:auto;right:0}.subnav-options ul{grid-template-columns:minmax(0,1fr)}}

.source-navigation{display:flex;flex-direction:column;gap:4px;padding:0 14px}
.source-navigation .sidebar-section-label{margin:6px 12px 10px}
.source-navigation-item{display:flex;align-items:center;gap:12px;width:100%;min-height:50px;padding:7px 10px;border:0;border-radius:7px;background:transparent;color:var(--palette-text);text-align:left;font-size:13px;font-weight:500}
.source-navigation-item:hover{color:var(--palette-text)}
.source-navigation-item img{display:block;flex:none;width:34px;height:34px;object-fit:contain;border-radius:5px}
.source-navigation-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(min-width:801px){.private-sidebar.is-collapsed .source-navigation{padding:0 10px}.private-sidebar.is-collapsed .source-navigation-item{justify-content:center;padding:7px}}

/* Navegación principal en sidebar y una sola barra superior. */
.private-layout{border-top:2px solid var(--palette-primary);grid-template-columns:240px minmax(0,1fr);grid-template-rows:56px minmax(calc(100svh - 58px),auto);transition:grid-template-columns .2s ease}
.private-navbar{grid-column:2;grid-row:1;height:56px;padding:0 26px;border-bottom:1px solid var(--palette-legacyBorder);box-shadow:none;gap:16px}
.private-content{grid-column:2;grid-row:2}
.private-sidebar{grid-column:1;grid-row:1 / 3;position:sticky;top:0;align-self:start;display:flex;flex-direction:column;width:auto;height:calc(100svh - 2px);padding:0 0 16px;background:var(--palette-white);border-right:1px solid var(--palette-legacyBorder);z-index:25}
.private-layout.sidebar-compact{grid-template-columns:64px minmax(0,1fr)}
.private-sidebar.is-collapsed{width:auto;padding:0 0 16px}
.private-sidebar .sidebar-brand,.private-sidebar.is-collapsed .sidebar-brand{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;min-height:56px;padding:0 14px;border-bottom:1px solid var(--palette-legacyBorder)}
.sidebar-brand-link{display:flex;align-items:center;gap:10px;min-width:0;max-width:160px;overflow:hidden;color:var(--palette-text);font-size:17px;font-weight:700;letter-spacing:1px;text-decoration:none;transition:max-width .22s ease,opacity .18s ease}
.sidebar-brand-link img{display:block;width:32px;height:32px;object-fit:contain;flex:none}
.sidebar-brand-link span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.private-sidebar .sidebar-toggle{display:grid;place-items:center;flex:none;width:32px;height:32px;padding:5px;border-radius:8px}
.private-sidebar.is-collapsed .sidebar-brand{justify-content:center;gap:0;padding:0 8px}
.private-sidebar.is-collapsed .sidebar-brand-link{max-width:0;opacity:0;pointer-events:none}
.private-sidebar.is-collapsed .sidebar-toggle{margin:auto}
.sidebar-scroll{display:flex;flex:1;flex-direction:column;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:var(--palette-divider) transparent}
.private-sidebar .sidebar-main-nav{display:flex;flex:none;flex-direction:column;gap:4px;min-width:0;padding:16px 12px}
.sidebar-nav-group{display:flex;flex-direction:column;gap:4px;min-width:0}
.private-layout .sidebar-nav-link{display:flex;align-items:center;gap:12px;width:100%;min-height:42px;padding:9px 12px;border:0;border-radius:8px;background:transparent;color:var(--palette-muted);font-size:13px;font-weight:500;text-align:left;text-decoration:none;line-height:1.35;transition:background-color .18s ease,color .18s ease,gap .22s ease}
.private-layout .sidebar-nav-link:hover{background:transparent;color:var(--palette-text)}
.private-layout .sidebar-nav-link.is-active{background:var(--palette-neutralSurface);color:var(--palette-text)}
.sidebar-nav-link svg{flex:none}
.sidebar-nav-link span{min-width:0;max-width:180px;overflow:hidden;white-space:nowrap;transition:max-width .22s ease,opacity .18s ease}
.sidebar-nav-trigger span{white-space:normal;line-height:1.3}
.sidebar-nav-chevron{margin-left:auto;transition:transform .22s ease,width .22s ease,opacity .18s ease}
.sidebar-nav-trigger.is-open .sidebar-nav-chevron{transform:rotate(180deg)}
.sidebar-nav-panel{display:grid;grid-template-rows:0fr;opacity:0;visibility:hidden;transition:grid-template-rows .24s cubic-bezier(.2,.8,.2,1),opacity .18s ease,visibility 0s linear .24s}
.sidebar-nav-panel.is-open{grid-template-rows:1fr;opacity:1;visibility:visible;transition:grid-template-rows .24s cubic-bezier(.2,.8,.2,1),opacity .18s ease}
.sidebar-nav-panel-inner{min-height:0;overflow:hidden}
.sidebar-nav-children{display:flex;flex-direction:column;gap:2px;margin:0 0 4px 19px;padding-left:12px;border-left:1px solid var(--palette-divider)}
.private-layout .sidebar-nav-children .sidebar-nav-link{min-height:36px;padding:7px 10px;font-size:12px;font-weight:400}
.private-layout .sidebar-nav-children .sidebar-nav-link.is-active{font-weight:500}
.sidebar-bottom{display:flex;flex:none;flex-direction:column;gap:8px;min-width:0;margin-top:auto;padding-top:12px;border-top:1px solid var(--palette-legacyBorder)}
.private-sidebar .source-navigation{min-width:0;padding:0 12px}
.private-sidebar .source-navigation .sidebar-section-label{max-width:calc(100% - 24px);margin:4px 12px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.private-sidebar .source-navigation-item{min-height:42px;padding:5px 10px;border-radius:8px}
.private-sidebar .source-navigation-item:hover{background:transparent;color:var(--palette-text)}
.private-sidebar .source-navigation-item img{width:27px;height:27px}
.private-sidebar.is-collapsed .sidebar-main-nav{padding:16px 8px}
.private-sidebar.is-collapsed .sidebar-nav-link{justify-content:center;gap:0;padding:9px}
.private-sidebar.is-collapsed .sidebar-nav-link span{max-width:0;opacity:0}
.private-sidebar.is-collapsed .sidebar-nav-chevron{width:0;opacity:0}
.private-sidebar.is-collapsed .source-navigation{padding:0 8px}
.private-sidebar.is-collapsed .source-navigation-item{justify-content:center;gap:0;padding:5px}
.private-sidebar.is-collapsed .source-navigation-item span{max-width:0;opacity:0}
.private-sidebar.is-collapsed .sidebar-section-label{display:none}
.source-navigation-item span,.private-sidebar .sidebar-section-label{max-width:180px;max-height:24px;transition:max-width .22s ease,max-height .22s ease,opacity .18s ease}
.navbar-leading,.navbar-actions{display:flex;align-items:center;gap:8px;min-width:0}
.navbar-actions{margin-left:auto}
.navbar-breadcrumb{min-width:0;color:var(--palette-legacyMuted);font-size:13px;white-space:nowrap}
.navbar-breadcrumb ol{display:flex;align-items:center;gap:9px;min-width:0;margin:0;padding:0;list-style:none}
.navbar-breadcrumb li{display:flex;align-items:center;gap:9px;min-width:0}
.navbar-breadcrumb a{color:var(--palette-legacyMuted);text-decoration:none}
.navbar-breadcrumb a:hover{color:var(--palette-text);text-decoration:underline;text-underline-offset:3px}
.navbar-breadcrumb li>svg{flex:none;color:var(--palette-legacyMuted)}
.navbar-breadcrumb [aria-current=page]{display:block;overflow:hidden;color:var(--palette-text);font-weight:600;text-overflow:ellipsis}
.navbar-icon-button{display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--palette-muted)}
.navbar-icon-button:hover{background:var(--palette-neutralSurface);color:var(--palette-primary)}
.navbar-search-overlay{position:fixed;inset:0;z-index:100;display:flex;justify-content:center;align-items:flex-start;padding:15vh 16px 16px;background:rgba(22,18,28,.32)}
.navbar-search-dialog{width:min(520px,100%);overflow:hidden;border:1px solid var(--palette-legacyBorder);border-radius:12px;background:var(--palette-white);box-shadow:0 18px 50px rgba(22,18,28,.18)}
.navbar-search-field{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--palette-legacyBorder);color:var(--palette-muted)}
.navbar-search-field input{flex:1;min-width:0;padding:6px 0;border:0;outline:0;background:transparent;color:var(--palette-text);font:inherit;font-size:14px}
.navbar-search-field button{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--palette-muted)}
.navbar-search-results{display:flex;flex-direction:column;gap:2px;max-height:50vh;overflow:auto;padding:8px}
.navbar-search-results a{display:flex;justify-content:space-between;gap:16px;padding:10px 12px;border-radius:8px;color:var(--palette-text);font-size:13px;text-decoration:none}
.navbar-search-results a:hover,.navbar-search-results a:focus-visible{background:var(--palette-navigationActive);color:var(--palette-primary)}
.navbar-search-results small{color:var(--palette-legacyMuted);white-space:nowrap}
.navbar-search-results p{padding:10px 12px;color:var(--palette-muted);font-size:13px}
@media(min-width:801px){.navbar-toggle-mobile{display:none}}
@media(max-width:800px){
.private-layout,.private-layout.sidebar-compact{grid-template-columns:minmax(0,1fr);grid-template-rows:56px minmax(calc(100svh - 58px),auto)}
.private-navbar{grid-column:1;padding:0 18px}.private-content{grid-column:1;grid-row:2}
.private-sidebar{display:flex;position:fixed;top:0;left:0;width:240px;height:100svh;z-index:80;transform:translateX(-100%);visibility:hidden;pointer-events:none;box-shadow:8px 0 24px var(--palette-surfaceShadow);transition:transform .24s cubic-bezier(.2,.8,.2,1),visibility 0s linear .24s}
.private-sidebar.is-open{transform:translateX(0);visibility:visible;pointer-events:auto;transition:transform .24s cubic-bezier(.2,.8,.2,1)}
.sidebar-backdrop{display:block;position:fixed;inset:0;z-index:70;background:rgba(22,18,28,.32);opacity:0;pointer-events:none;transition:opacity .24s ease}
.sidebar-backdrop.is-visible{opacity:1;pointer-events:auto}
.private-sidebar .sidebar-toggle,.navbar-toggle-mobile{display:grid}
.navbar-breadcrumb{font-size:12px}
}
@media(max-width:500px){.navbar-breadcrumb li:not(:first-child):not(:last-child){display:none}.navbar-search-results a{flex-direction:column;gap:3px}}
@media(prefers-reduced-motion:reduce){.private-layout,.sidebar-nav-link,.sidebar-nav-link span,.sidebar-nav-chevron,.sidebar-nav-panel,.sidebar-brand-link,.source-navigation-item span,.private-sidebar .sidebar-section-label,.private-sidebar,.sidebar-backdrop{transition:none}.sidebar-scroll{scroll-behavior:auto}}

`;

export default function PrivateMain() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches);
  const [open, setOpen] = useState(() => !window.matchMedia('(max-width: 800px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    function onViewportChange(event: MediaQueryListEvent) {
      setMobile(event.matches);
      setOpen(!event.matches);
    }
    media.addEventListener('change', onViewportChange);
    return () => media.removeEventListener('change', onViewportChange);
  }, []);
  return <div className={`private-layout${open ? "" : " sidebar-compact"}`} style={theme.cssVariables}>
      <style>{navigationStyles}</style>
    <link rel="stylesheet" href={theme.fonts.stylesheet} />
    <Navbar onToggle={() => setOpen(value => !value)} expanded={open} />
    <div className="private-body">
      <button className={`sidebar-backdrop${mobile && open ? ' is-visible' : ''}`} aria-label="Cerrar menú" tabIndex={mobile && open ? 0 : -1} onClick={() => setOpen(false)} />
      <Sidebar onToggle={() => setOpen(value => !value)} open={open} mobile={mobile}
        onNavigate={() => { if (mobile) setOpen(false); }} />
      <main className="private-content" id="private-content"><Outlet /></main>
    </div>
  </div>;
}
