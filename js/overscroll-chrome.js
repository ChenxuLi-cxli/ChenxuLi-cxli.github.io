/*
 * 此前用于兜底修正 Chrome 中页脚下方残留可滚动空白。
 * 真正根因（body 因 overflow-x: hidden 升格为滚动容器，
 * 把 nav/footer 的 fixed -100vh 玻璃延伸层算入 scrollHeight）已在 CSS 中修复。
 * 保留空脚本以避免 index.html 中的 <script> 报 404。
 */
