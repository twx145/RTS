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
switchToRegister.addEventListener('click', () => {container.classList.add('active');hideMessages();});
switchToLogin.addEventListener('click', () => {container.classList.remove('active');hideMessages();});

// 验证规则常量
const VALIDATION_RULES = {
    username: {
        minLength: 3,maxLength: 20,regex: /^[a-zA-Z0-9_]+$/,
        message: "用户名应为3-20个字符，只能包含字母、数字和下划线"
    },
    password: {
        minLength: 6,maxLength: 30,
        message: "密码至少6个字符"
    }
};

// 验证函数
function validateUsername(username) {
    const rules = VALIDATION_RULES.username;
    const validationElement = document.getElementById('usernameValidation');
    
    if (username.length === 0) {
        validationElement.textContent = "";
        validationElement.className = "validation-message";
        return false;
    }
    if (username.length < rules.minLength) {
        validationElement.textContent = `用户名太短，至少需要${rules.minLength}个字符`;
        validationElement.className = "validation-message invalid";
        return false;
    }
    
    if (username.length > rules.maxLength) {
        validationElement.textContent = `用户名太长，不能超过${rules.maxLength}个字符`;
        validationElement.className = "validation-message invalid";
        return false;
    }
    
    if (!rules.regex.test(username)) {
        validationElement.textContent = rules.message;
        validationElement.className = "validation-message invalid";
        return false;
    }
    
    validationElement.textContent = "用户名可用";
    validationElement.className = "validation-message valid";
    return true;
}

function validatePassword(password) {
    const rules = VALIDATION_RULES.password;
    const validationElement = document.getElementById('passwordValidation');
    
    if (password.length === 0) {
        validationElement.textContent = "";
        validationElement.className = "validation-message";
        return false;
    }
    if (password.length < rules.minLength) {
        validationElement.textContent = `密码太短，至少需要${rules.minLength}个字符`;
        validationElement.className = "validation-message invalid";
        return false;
    }
    validationElement.textContent = "密码强度足够";
    validationElement.className = "validation-message valid";
    return true;
}

function validateConfirmPassword(password, confirmPassword) {
    const validationElement = document.getElementById('confirmValidation');
    
    if (confirmPassword.length === 0) {
        validationElement.textContent = "";
        validationElement.className = "validation-message";
        return false;
    }
    
    if (password !== confirmPassword) {
        validationElement.textContent = "两次输入的密码不一致";
        validationElement.className = "validation-message invalid";
        return false;
    }
    
    validationElement.textContent = "密码匹配";
    validationElement.className = "validation-message valid";
    return true;
}


// 隐藏所有消息
function hideMessages() {errorMessage.style.display = 'none';successMessage.style.display = 'none';}

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
                window.location.href = '../index.html';
            }, 200);
        }
    }, 100);
}

// 初始化本地存储
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

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


// 注册表单提交
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 验证所有字段
    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(password, confirmPassword);
    
    // 如果有任何验证失败，不提交表单
    if (!isUsernameValid || !isPasswordValid || !isConfirmValid) {
        showError('请修正表单中的错误');
        return;
    }
    
    // 获取用户数据
    const users = JSON.parse(localStorage.getItem('users'));
    // 检查用户名是否已存在
    if (users.some(user => user.username === username)) {
        showError('用户名已存在');
        return;
    }
    
    // 保存用户数据
    users.push({ username,  password });
    localStorage.setItem('users', JSON.stringify(users));
    
    showSuccess('注册成功！请登录');
    
    // 清空表单
    registerForm.reset();
    
    // 清除验证消息
    document.querySelectorAll('.validation-message').forEach(el => {
        el.textContent = '';
        el.className = 'validation-message';
    });
    
    // 切换到登录表单
    container.classList.remove('active');
});


// 如果有已登录用户，直接跳转到首页
window.addEventListener('DOMContentLoaded', () => {
    // 添加输入事件监听器
    document.getElementById('registerUsername').addEventListener('input', function() {
        validateUsername(this.value.trim());
    });

    document.getElementById('registerPassword').addEventListener('input', function() {
        validatePassword(this.value);
        // 同时验证确认密码
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (confirmPassword.length > 0) {
            validateConfirmPassword(this.value, confirmPassword);
        }
    });

    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('registerPassword').value;
        validateConfirmPassword(password, this.value);
    });
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '../index.html';
    }
});