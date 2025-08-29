// DOM元素
const container = document.getElementById('container');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.getElementById('progressBar');
const loadingPercentage = document.getElementById('loadingPercentage');

// 切换表单
switchToRegister.addEventListener('click', () => {
    container.classList.add('active');
    hideMessages();
});

switchToLogin.addEventListener('click', () => {
    container.classList.remove('active');
    hideMessages();
});

// 隐藏所有消息
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// 显示成功消息
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    // 3秒后隐藏成功消息
    setTimeout(hideMessages, 3000);
}

// 显示加载动画
function showLoadingAnimation() {
    loadingOverlay.classList.add('active');
    
    // 模拟进度条
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        loadingPercentage.textContent = Math.round(progress) + '%';
        
        if (progress === 100) {
            clearInterval(interval);
            // 跳转到首页
            setTimeout(() => {
                window.location.href = 'start.html';
            }, 200);
        }
    }, 100);
}

// 初始化本地存储
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

// 注册表单提交
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 简单验证
    if (username.length < 3) {
        showError('用户名至少需要3个字符');
        return;
    }
    
    if (password.length < 6) {
        showError('密码至少需要6个字符');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('两次输入的密码不匹配');
        return;
    }
    
    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('请输入有效的电子邮件地址');
        return;
    }
    
    // 获取用户数据
    const users = JSON.parse(localStorage.getItem('users'));
    
    // 检查用户名是否已存在
    if (users.some(user => user.username === username)) {
        showError('用户名已存在');
        return;
    }
    
    // 检查邮箱是否已存在
    if (users.some(user => user.email === email)) {
        showError('该邮箱已被注册');
        return;
    }
    
    // 保存用户数据
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    showSuccess('注册成功！请登录');
    
    // 清空表单
    registerForm.reset();
    
    // 切换到登录表单
    container.classList.remove('active');
});

// 登录表单提交
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // 获取用户数据
    const users = JSON.parse(localStorage.getItem('users'));
    
    // 验证用户
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // 保存当前用户会话
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // 显示加载动画
        showLoadingAnimation();
    } else {
        showError('用户名或密码错误');
    }
});

// 如果有已登录用户，直接跳转到首页
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '../start.html';
    }
});