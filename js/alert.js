// 显示确认对话框
function showConfirmDialog(title, message, func) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').style.display = 'flex';
    document.getElementById('confirm-yes').onclick = function() {
        if (func && typeof func === 'function') {func();}
        closeConfirmDialog();
    };
}
// 关闭确认对话框
function closeConfirmDialog() {
    document.getElementById('confirm-dialog').style.display = 'none';
    document.getElementById('confirm-yes').onclick = null;
}
// 显示提示对话框
function showAlert(title = '提示', message, func = null) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('alert-dialog').style.display = 'flex';
    document.getElementById('alert-ok').onclick = function() {
        closeAlertDialog();
        if (func && typeof func === 'function') {func();}
    };
}
// 关闭提示对话框
function closeAlertDialog() {
    document.getElementById('alert-dialog').style.display = 'none';
}
document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('confirm-no').addEventListener('click', closeConfirmDialog);
    document.getElementById('alert-ok').addEventListener('click', closeAlertDialog);
});