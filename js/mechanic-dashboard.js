// mechanic-dashboard.js - ULTRA FIXED VERSION
// Handles all API response structures

// ✅ PRODUCTION API URL
const API_BASE_URL = 'https://suaxeweb-production.up.railway.app/api';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadDashboardStats();
    loadNotifications();
    loadUpcomingAppointments();
    
    document.getElementById('logout-link')?.addEventListener('click', logout);
    document.getElementById('sidebar-logout')?.addEventListener('click', logout);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    let userRole = null;
    let userName = 'Kỹ thuật viên';
    
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            userRole = user.role;
            userName = user.fullName || 'Kỹ thuật viên';
            
            const mechanicNameEl = document.getElementById('mechanicName');
            if (mechanicNameEl) {
                mechanicNameEl.textContent = userName;
            }
            
            const avatarEl = document.getElementById('avatarPlaceholder');
            if (avatarEl && userName) {
                avatarEl.textContent = userName.charAt(0).toUpperCase();
            }
        }
    } catch (e) {
        console.error('❌ Lỗi parse user:', e);
    }
    
    if (userRole !== 3) {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Auth check successful - Mechanic role confirmed');
}

function getToken() {
    return localStorage.getItem('token');
}

async function loadDashboardStats() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/mechanics/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const stats = data.data;
            
            document.getElementById('todayAppointments').textContent = stats.todayAppointments || 0;
            document.getElementById('pendingCount').textContent = stats.pendingCount || stats.pendingAppointments || 0;
            document.getElementById('weekCompleted').textContent = stats.weekCompleted || stats.weeklyCompleted || 0;
            document.getElementById('avgRating').textContent = stats.avgRating || stats.averageRating || '0.0';
            
            console.log('✅ Dashboard stats loaded');
        }
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
    }
}

async function loadNotifications() {
    const notificationsList = document.getElementById('recentNotifications');
    
    if (!notificationsList) {
        console.warn('⚠️ Không tìm thấy element recentNotifications');
        return;
    }
    
    try {
        const token = getToken();
        
        const response = await fetch(`${API_BASE_URL}/notifications?limit=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Notifications response:', data);
        
        if (data.success && data.data) {
            if (data.data.length === 0) {
                notificationsList.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-bell-slash fs-1"></i>
                        <p class="mt-2 mb-0">Không có thông báo nào</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            data.data.forEach(notification => {
                const isRead = notification.IsRead ? '' : 'unread';
                const iconClass = getNotificationIcon(notification.Type || notification.IconType);
                const timeAgo = formatTimeAgo(notification.CreatedAt);
                
                html += `
                    <div class="notification-item ${isRead}" 
                         data-id="${notification.NotificationID}"
                         onclick="handleRecentNotificationClick(${notification.NotificationID}, '${notification.ActionUrl || ''}')">
                        <div class="notification-icon ${iconClass.color}">
                            <i class="bi ${iconClass.icon}"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.Title}</div>
                            <div class="notification-text">${notification.Message}</div>
                            <div class="notification-time">${timeAgo}</div>
                        </div>
                        ${!notification.IsRead ? '<span class="notification-dot"></span>' : ''}
                    </div>
                `;
            });
            
            notificationsList.innerHTML = html;
            console.log('✅ Notifications loaded:', data.data.length);
        } else {
            notificationsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-bell-slash fs-1"></i>
                    <p class="mt-2 mb-0">Không có thông báo nào</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        notificationsList.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2 mb-0">Lỗi tải thông báo</p>
            </div>
        `;
    }
}

window.handleRecentNotificationClick = async function(notificationId, actionUrl) {
    await markNotificationRead(notificationId);
    
    if (actionUrl) {
        window.location.href = actionUrl;
    }
};

async function markNotificationRead(notificationId) {
    try {
        const token = getToken();
        
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Notification marked as read:', notificationId);
            loadNotifications();
        }
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
    }
}

function getNotificationIcon(type) {
    const iconMap = {
        'booking': { icon: 'bi-calendar-check', color: 'text-primary' },
        'payment': { icon: 'bi-cash', color: 'text-success' },
        'reminder': { icon: 'bi-clock', color: 'text-warning' },
        'system': { icon: 'bi-info-circle', color: 'text-info' },
        'success': { icon: 'bi-check-circle', color: 'text-success' },
        'warning': { icon: 'bi-exclamation-triangle', color: 'text-warning' },
        'info': { icon: 'bi-info-circle', color: 'text-info' },
        'error': { icon: 'bi-x-circle', color: 'text-danger' }
    };
    
    return iconMap[type] || iconMap['info'];
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

// ✅ ULTRA FIX: Handle all possible API response structures
async function loadUpcomingAppointments() {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/mechanics/appointments/upcoming`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Upcoming appointments response:', data);
        
        if (data.success) {
            // ✅ ULTRA FIX: Handle ALL possible response structures
            let appointments = null;
            
            // Case 1: data.data.appointments (wrapped with extra data layer)
            if (data.data && data.data.appointments) {
                appointments = data.data.appointments;
                console.log('✅ Parsed from data.data.appointments');
            }
            // Case 2: data.appointments (direct from backend)
            else if (data.appointments) {
                appointments = data.appointments;
                console.log('✅ Parsed from data.appointments');
            }
            // Case 3: data.data (array directly)
            else if (Array.isArray(data.data)) {
                appointments = data.data;
                console.log('✅ Parsed from data.data (array)');
            }
            
            if (appointments && Array.isArray(appointments)) {
                renderUpcomingAppointments(appointments);
            } else {
                console.warn('⚠️ No valid appointments array found');
                renderUpcomingAppointments([]);
            }
        }
    } catch (error) {
        console.error('❌ Error loading upcoming appointments:', error);
        document.getElementById('upcomingAppointmentsList').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td>
            </tr>
        `;
    }
}

function renderUpcomingAppointments(appointments) {
    const tbody = document.getElementById('upcomingAppointmentsList');
    
    if (!tbody) {
        console.error('❌ upcomingAppointmentsList element not found');
        return;
    }
    
    if (!appointments || appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Không có lịch hẹn sắp tới</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    appointments.forEach(apt => {
        const date = new Date(apt.AppointmentDate);
        const formattedDate = date.toLocaleDateString('vi-VN') + ' ' + 
                             date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        
        const statusBadge = getStatusBadge(apt.Status);
        
        html += `
            <tr>
                <td>#${apt.AppointmentID}</td>
                <td>${apt.CustomerName || 'N/A'}</td>
                <td>${apt.Services || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewAppointmentDetail(${apt.AppointmentID})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    console.log('✅ Upcoming appointments rendered:', appointments.length);
}

function getStatusBadge(status) {
    const statusMap = {
        'Pending': '<span class="badge bg-warning text-dark">Chờ xác nhận</span>',
        'PendingApproval': '<span class="badge bg-warning text-dark">Chờ xác nhận</span>',
        'Confirmed': '<span class="badge bg-info">Đã xác nhận</span>',
        'InProgress': '<span class="badge bg-primary">Đang sửa</span>',
        'Completed': '<span class="badge bg-success">Hoàn thành</span>',
        'Canceled': '<span class="badge bg-danger">Đã hủy</span>',
        'Rejected': '<span class="badge bg-danger">Bị từ chối</span>'
    };
    
    return statusMap[status] || `<span class="badge bg-secondary">${status}</span>`;
}

window.viewAppointmentDetail = function(appointmentId) {
    window.location.href = `mechanic-appointments.html?id=${appointmentId}`;
};

function logout(e) {
    e.preventDefault();
    
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

console.log('✅ Mechanic dashboard ULTRA FIXED - handles all API response structures');