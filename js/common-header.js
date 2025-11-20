// js/common-header.js
// File chung xử lý header và avatar cho TẤT CẢ các trang

/**
 * Cập nhật thông tin người dùng trong header (TẤT CẢ TRANG)
 * @param {Object} user - Thông tin người dùng
 */
function updateHeaderUserInfo(user) {
    const userInfoHeader = document.getElementById('userInfoHeader');
    const userAvatarSmall = document.getElementById('userAvatarSmall');
    const userNameSmall = document.getElementById('userNameSmall');
    
    if (userInfoHeader) {
        userInfoHeader.style.display = 'flex';
    }
    
    if (userNameSmall) {
        userNameSmall.textContent = user.fullName || user.FullName || user.email || 'Người dùng';
    }
    
    if (userAvatarSmall) {
        // Xóa nội dung cũ
        userAvatarSmall.innerHTML = '';
        
        if (user.avatarUrl || user.AvatarUrl) {
            // Có avatar - Tạo thẻ img
            const imgElement = document.createElement('img');
            imgElement.src = user.avatarUrl || user.AvatarUrl; // Dùng URL trực tiếp
            imgElement.alt = 'Avatar';
            imgElement.className = 'rounded-circle';
            imgElement.style.width = '40px';
            imgElement.style.height = '40px';
            imgElement.style.objectFit = 'cover';
            imgElement.style.border = '2px solid #fff';
            
            // Xử lý khi hình ảnh không tải được
            imgElement.onerror = function() {
                console.error('Failed to load avatar:', user.avatarUrl);
                // Fallback: Hiển thị chữ cái đầu
                showAvatarPlaceholder(userAvatarSmall, user.fullName || user.FullName);
            };
            
            userAvatarSmall.appendChild(imgElement);
        } else {
            // Không có avatar - Hiển thị chữ cái đầu
            showAvatarPlaceholder(userAvatarSmall, user.fullName || user.FullName);
        }
    }
}

/**
 * Hiển thị placeholder avatar (chữ cái đầu)
 * @param {HTMLElement} container - Container element
 * @param {string} fullName - Tên đầy đủ
 */
function showAvatarPlaceholder(container, fullName) {
    const firstLetter = fullName ? fullName.charAt(0).toUpperCase() : 'U';
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'avatar-placeholder';
    placeholderDiv.style.cssText = `
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #d62828;
        color: white;
        border-radius: 50%;
        font-size: 18px;
        font-weight: bold;
        border: 2px solid #fff;
    `;
    placeholderDiv.textContent = firstLetter;
    container.appendChild(placeholderDiv);
}

/**
 * Kiểm tra trạng thái đăng nhập và cập nhật header
 */
function initHeaderAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authButtons = document.getElementById('authButtons');
    const loginBtn = document.getElementById('loginBtn');
    const userInfoHeader = document.getElementById('userInfoHeader');
    const userDropdown = document.querySelector('.user-info-header');
    
    console.log('🔍 Checking auth status:', { 
        hasToken: !!token, 
        hasUser: !!userStr 
    });
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log('✅ User logged in:', user.fullName || user.FullName);
            
            // Ẩn NÚT ĐĂNG NHẬP (tất cả các cách có thể)
            if (authButtons) {
                authButtons.style.cssText = 'display: none !important';
            }
            if (loginBtn) {
                loginBtn.style.cssText = 'display: none !important';
            }
            
            // Hiện thông tin user và cập nhật avatar
            if (userInfoHeader) {
                userInfoHeader.style.cssText = 'display: flex !important';
            }
            if (userDropdown) {
                userDropdown.style.cssText = 'display: flex !important';
            }
            
            // Cập nhật avatar
            updateHeaderUserInfo(user);
            
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            // Hiện nút đăng nhập nếu lỗi
            if (authButtons) authButtons.style.cssText = 'display: flex !important';
            if (loginBtn) loginBtn.style.cssText = 'display: block !important';
            if (userInfoHeader) userInfoHeader.style.cssText = 'display: none !important';
            if (userDropdown) userDropdown.style.cssText = 'display: none !important';
        }
    } else {
        // Chưa đăng nhập
        console.log('⚠️ User not logged in');
        if (authButtons) authButtons.style.cssText = 'display: flex !important';
        if (loginBtn) loginBtn.style.cssText = 'display: block !important';
        if (userInfoHeader) userInfoHeader.style.cssText = 'display: none !important';
        if (userDropdown) userDropdown.style.cssText = 'display: none !important';
    }
}

/**
 * Xử lý đăng xuất
 */
function handleLogout() {
    // Xóa tất cả thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    console.log('🚪 User logged out');
    
    // Hiển thị thông báo
    alert('Đã đăng xuất thành công!');
    
    // Chuyển về trang chủ
    window.location.href = 'index.html';
}

/**
 * Toggle search form
 */
function toggleSearch() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.classList.toggle('d-none');
    }
}

// ===== AUTO-RUN KHI TRANG LOAD =====

// Chạy khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Initializing header auth');
    initHeaderAuth();
    
    // Xử lý logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});

// Force chạy lại sau khi page load xong (tránh race condition)
window.addEventListener('load', function() {
    console.log('🔄 Window Loaded - Re-checking header auth');
    setTimeout(function() {
        initHeaderAuth();
    }, 100);
});