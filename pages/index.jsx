import { useEffect } from "react";
import "../src/style.css";

export default function Home() {
  useEffect(() => {
    document.title = "My World - Voxel Survival Sandbox";
    import("../src/main.js");
  }, []);

  return (
    <div id="app">
      <canvas id="game"></canvas>

      <div id="crosshair" aria-hidden="true"></div>

      <section id="start-panel" className="panel visible">
        <h1>MY WORLD</h1>
        <p>第一人称体素生存沙盒</p>
        <form id="auth-form" className="auth-card" autoComplete="on">
          <div className="auth-row">
            <div>
              <label htmlFor="auth-username">账号</label>
              <input id="auth-username" name="username" type="text" minLength="3" maxLength="24" autoComplete="username" />
            </div>
            <div>
              <label htmlFor="auth-password">密码</label>
              <input id="auth-password" name="password" type="password" minLength="4" autoComplete="current-password" />
            </div>
          </div>
          <div className="auth-actions">
            <button id="login-button" type="submit">登录</button>
            <button id="register-button" type="button">注册</button>
            <button id="logout-button" type="button">退出</button>
          </div>
          <div className="auth-row auth-code-row">
            <div>
              <label htmlFor="creative-code">创造码</label>
              <input id="creative-code" name="creative-code" type="password" autoComplete="off" />
            </div>
            <button id="unlock-creative-button" type="button">解锁创造</button>
          </div>
          <div id="auth-status" className="auth-status"></div>
        </form>
        <button id="play-button" type="button">进入世界</button>
        <div className="control-grid">
          <span>WASD</span><span>移动</span>
          <span>鼠标</span><span>视角</span>
          <span>左键</span><span>攻击/挖掘/弓箭射击</span>
          <span>右键</span><span>放置/使用</span>
          <span>右键</span><span>吃食物/锄地/播种/开门/睡觉</span>
          <span>空格</span><span>跳跃</span>
          <span>E</span><span>背包与合成</span>
          <span>C</span><span>生存/创造</span>
          <span>F</span><span>全屏</span>
          <span>P</span><span>保存</span>
        </div>
      </section>

      <section id="inventory-panel" className="panel inventory" aria-hidden="true">
        <div className="panel-header">
          <h2>背包与合成</h2>
          <button id="close-inventory" type="button">关闭</button>
        </div>
        <div className="inventory-layout">
          <div>
            <h3>装备</h3>
            <div id="equipment-list" className="equipment"></div>
            <h3>附魔/升级</h3>
            <div id="enchantment-list" className="recipes"></div>
            <h3>酿造/药水</h3>
            <div id="brewing-list" className="recipes"></div>
          </div>
          <div>
            <h3>方块/物品</h3>
            <div id="block-palette" className="palette"></div>
          </div>
          <div>
            <h3>合成/冶炼</h3>
            <div id="recipe-list" className="recipes"></div>
          </div>
        </div>
      </section>

      <div id="hud">
        <div id="status-bars"></div>
        <div id="hotbar"></div>
        <div id="world-readout"></div>
      </div>

      <div id="touch-controls" aria-hidden="true">
        <div id="touch-stick" className="touch-stick" aria-label="移动摇杆">
          <div id="touch-stick-knob"></div>
        </div>
        <div className="touch-actions" aria-label="触控动作">
          <button type="button" data-touch-action="jump">跳</button>
          <button type="button" data-touch-action="mine">挖</button>
          <button type="button" data-touch-action="use">用</button>
          <button type="button" data-touch-action="inventory">包</button>
        </div>
      </div>

      <div id="toast"></div>
    </div>
  );
}
