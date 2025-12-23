// js/common-header.js
// File chung xử lý header và avatar cho TẤT CẢ các trang
// IMPROVED VERSION - Debug logging và force styles mạnh hơn

/**
 * Cập nhật thông tin người dùng trong header (TẤT CẢ TRANG)
 * @param {Object} user - Thông tin người dùng
 */
function updateHeaderUserInfo(user) {
    const userInfoHeader = document.getElementById('userInfoHeader');
    const userAvatarSmall = document.getElementById('userAvatarSmall');
    const userNameSmall = document.getElementById('userNameSmall');
    
    console.log('📝 [UPDATE UI] Updating header user info...');
    
    if (userInfoHeader) {
        userInfoHeader.style.display = 'flex';
        console.log('   ✓ Set userInfoHeader display: flex');
    }
    
    if (userNameSmall) {
        const displayName = user.fullName || user.FullName || user.email || 'Người dùng';
        userNameSmall.textContent = displayName;
        console.log('   ✓ Set user name:', displayName);
    }
    
    if (userAvatarSmall) {
        // Xóa nội dung cũ
        userAvatarSmall.innerHTML = '';
        
        if (user.avatarUrl || user.AvatarUrl) {
            // Có avatar - Tạo thẻ img
            const imgElement = document.createElement('img');
            imgElement.src = user.avatarUrl || user.AvatarUrl;
            imgElement.alt = 'Avatar';
            imgElement.className = 'rounded-circle';
            imgElement.style.width = '40px';
            imgElement.style.height = '40px';
            imgElement.style.objectFit = 'cover';
            imgElement.style.border = '2px solid #fff';
            
            // Xử lý khi hình ảnh không tải được
            imgElement.onerror = function() {
                console.warn('⚠️ Failed to load avatar:', user.avatarUrl);
                showAvatarPlaceholder(userAvatarSmall, user.fullName || user.FullName);
            };
            
            userAvatarSmall.appendChild(imgElement);
            console.log('   ✓ Set avatar image:', user.avatarUrl || user.AvatarUrl);
        } else {
            // Không có avatar - Hiển thị chữ cái đầu
            showAvatarPlaceholder(userAvatarSmall, user.fullName || user.FullName);
            console.log('   ✓ Set avatar placeholder');
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
 * IMPROVED VERSION - với debug logging và force styles mạnh hơn
 */
function initHeaderAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const authButtons = document.getElementById('authButtons');
    const loginBtn = document.getElementById('loginBtn');
    const userInfoHeader = document.getElementById('userInfoHeader');
    const userDropdown = document.querySelector('.user-info-header');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [AUTH CHECK] Checking login status...');
    console.log('   Token exists:', !!token);
    console.log('   User data exists:', !!userStr);
    console.log('   authButtons element:', !!authButtons);
    console.log('   userInfoHeader element:', !!userInfoHeader);
    
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log('✅ [AUTH SUCCESS] User logged in:');
            console.log('   Name:', user.fullName || user.FullName);
            console.log('   Email:', user.email);
            console.log('   Role:', user.role);
            
            // ẨN NÚT ĐĂNG NHẬP - FORCE với multiple methods
            if (authButtons) {
                authButtons.style.cssText = 'display: none !important; visibility: hidden !important;';
                authButtons.classList.add('d-none');
                console.log('   ✓ Hidden authButtons');
            }
            if (loginBtn) {
                loginBtn.style.cssText = 'display: none !important; visibility: hidden !important;';
                loginBtn.classList.add('d-none');
                console.log('   ✓ Hidden loginBtn');
            }
            
            // HIỆN THÔNG TIN USER - FORCE với multiple methods
            if (userInfoHeader) {
                userInfoHeader.style.cssText = 'display: flex !important; visibility: visible !important;';
                userInfoHeader.classList.remove('d-none');
                console.log('   ✓ Shown userInfoHeader');
            }
            if (userDropdown) {
                userDropdown.style.cssText = 'display: flex !important; visibility: visible !important;';
                userDropdown.classList.remove('d-none');
                console.log('   ✓ Shown userDropdown');
            }
            
            // Cập nhật avatar và tên
            updateHeaderUserInfo(user);
            console.log('   ✓ Updated avatar and name');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (error) {
            console.error('❌ [AUTH ERROR] Failed to parse user data:', error);
            console.error('   User string:', userStr);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Hiện nút đăng nhập nếu lỗi
            if (authButtons) {
                authButtons.style.cssText = 'display: flex !important; visibility: visible !important;';
                authButtons.classList.remove('d-none');
            }
            if (loginBtn) {
                loginBtn.style.cssText = 'display: block !important; visibility: visible !important;';
                loginBtn.classList.remove('d-none');
            }
            if (userInfoHeader) {
                userInfoHeader.style.cssText = 'display: none !important; visibility: hidden !important;';
                userInfoHeader.classList.add('d-none');
            }
            if (userDropdown) {
                userDropdown.style.cssText = 'display: none !important; visibility: hidden !important;';
                userDropdown.classList.add('d-none');
            }
        }
    } else {
        // Chưa đăng nhập
        console.log('⚠️ [AUTH] User NOT logged in');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (authButtons) {
            authButtons.style.cssText = 'display: flex !important; visibility: visible !important;';
            authButtons.classList.remove('d-none');
        }
        if (loginBtn) {
            loginBtn.style.cssText = 'display: block !important; visibility: visible !important;';
            loginBtn.classList.remove('d-none');
        }
        if (userInfoHeader) {
            userInfoHeader.style.cssText = 'display: none !important; visibility: hidden !important;';
            userInfoHeader.classList.add('d-none');
        }
        if (userDropdown) {
            userDropdown.style.cssText = 'display: none !important; visibility: hidden !important;';
            userDropdown.classList.add('d-none');
        }
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
    console.log('📄 [DOM] Content Loaded - Initializing header auth');
    initHeaderAuth();
    
    // Xử lý logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
        console.log('   ✓ Logout button listener added');
    }
});

// Force chạy lại sau khi page load xong (tránh race condition)
window.addEventListener('load', function() {
    console.log('🌐 [WINDOW] Loaded - Re-checking header auth');
    setTimeout(function() {
        initHeaderAuth();
    }, 100);
});

// Export functions cho global scope
window.initHeaderAuth = initHeaderAuth;
window.updateHeaderUserInfo = updateHeaderUserInfo;
window.handleLogout = handleLogout;
window.toggleSearch = toggleSearch;

console.log('✅ [COMMON-HEADER] Module loaded successfully');