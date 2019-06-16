let visible = false;
let users = [];
const status_types = {ACTIVE: 0, IDLE: 1, AWAY: 2};
const linkify = require("linkifyjs");
const linkify_string = require("linkifyjs/string");
require("linkifyjs/plugins/ticket")(linkify);

function set_var(name, value) {
    document.documentElement.style.setProperty(`--${name}`, `${value}px`);
}

function scroll_to_bottom() {
    const messages = document.getElementById("messages");
    const rect = messages.getBoundingClientRect();
    messages.scrollTop = messages.scrollHeight - rect.height + 1;
}

function show(focus = true) {
    const chat_input = document.getElementById("chat_input");
    set_var("chat-height", 240);
    chat_input.value = "";
    scroll_to_bottom();
    if (focus) chat_input.focus();
}

function hide() {
    document.getElementById("chat_input").blur();
    set_var("chat-height", 0);
}

function toggle(focus) {
    visible = !visible;
    if (visible) {
        show(focus);
    } else {
        hide();
    }
}

function add_click_event(link, goto_line) {
    return (event) => {
        const match = link.href.match(/^goto:\/\/#(\d+)/);
        if (match) {
            goto_line(match[1]);
        } else {
            electron.shell.openExternal(link.href);
        }
        event.preventDefault();
    };
}

function create_links(element, text, goto_line) {
    element.innerHTML = linkify_string(text, {className: "", formatHref: {ticket: (line_no) => `goto://${line_no}`}});
    const links = element.getElementsByTagName("a");
    for (const link of links) {
        link.setAttribute("tabIndex", -1);
        link.addEventListener("click", add_click_event(link, goto_line), true);
    }
}

function action(nick, text) {
    const messages = document.getElementById("messages");
    const rect = messages.getBoundingClientRect();
    const scroll = (rect.height > messages.scrollHeight) || (messages.scrollTop == messages.scrollHeight - rect.height + 1);
    const nick_div = document.createElement("div");
    nick_div.classList.add("nick");
    nick_div.innerText = `${nick} ${text}`;
    const container = document.createElement("div");
    container.appendChild(nick_div);
    document.getElementById("messages").appendChild(container);
    if (scroll) scroll_to_bottom();
}

function welcome(text, goto_line) {
    const welcome_div = document.createElement("div");
    welcome_div.classList.add("welcome");
    create_links(welcome_div, text, goto_line);
    document.getElementById("messages").appendChild(welcome_div);
}

function set_status(id, status) {
    if (users[id]) {
        users[id].status = status;
        switch (status) {
            case status_types.ACTIVE: users[id].div.style.backgroundImage = "url(\"../img/active_indicator.png\")"; break;
            case status_types.IDLE: users[id].div.style.backgroundImage = "url(\"../img/idle_indicator.png\")"; break;
            case status_types.AWAY: users[id].div.style.backgroundImage = "url(\"../img/away_indicator.png\")"; break;
        }
    }
}

function join(id, nick, group, status, show_join = true) {
    if (show_join) action(nick, "has joined");
    users[id] = {nick, group, div: document.createElement("div"), status};
    if (group == "") {
        users[id].div.innerText = nick;
    } else {
        users[id].div.innerText = `${nick} <${group}>`;
    }
    document.getElementById("user_list").appendChild(users[id].div);
    set_status(id, status);
}

function leave(id) {
    if (users[id]) {
        action(users[id].nick, "has left");
        document.getElementById("user_list").removeChild(users[id].div);
        delete users[id];
    }
}

function updated_sauce(id) {
    if (users[id]) action(users[id].nick, "has edited the SAUCE record");
}

function chat(id, nick, group, text, goto_line) {
    const messages = document.getElementById("messages");
    const rect = messages.getBoundingClientRect();
    const scroll = (rect.height > messages.scrollHeight) || (messages.scrollTop == messages.scrollHeight - rect.height + 1);
    const nick_div = document.createElement("div");
    nick_div.classList.add("nick");
    if (group == "") {
        nick_div.innerText = `${nick}:`;
    } else {
        nick_div.innerText = `${nick} <${group}>:`;
    }
    const text_div = document.createElement("div");
    text_div.classList.add("text");
    create_links(text_div, text, goto_line);
    const container = document.createElement("div");
    container.appendChild(nick_div);
    container.appendChild(text_div);
    messages.appendChild(container);
    if (users[id] && (users[id].nick != nick || users[id].group != group)) {
        users[id].nick = nick;
        users[id].group = group;
        if (group == "") {
            users[id].div.innerText = nick;
        } else {
            users[id].div.innerText = `${nick} <${group}>`;
        }
    }
    if (scroll) scroll_to_bottom();
}

module.exports = {toggle, join, leave, chat, welcome, updated_sauce, status: set_status};
