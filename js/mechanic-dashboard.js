// mechanic-dashboard.js - Frontend JavaScript cho trang Dashboard Kỹ thuật viên

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    checkAuth();
    
    // Load dữ liệu dashboard
    loadDashboardStats();
    loadNotifications();
    loadUpcomingAppointments();
    // loadSchedules(); // Không cần vì trang dashboard không có section này
});

/**
 * Kiểm tra xác thực người dùng
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Lấy role từ object user trong localStorage
    let userRole = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            userRole = user.role;
        }
    } catch (e) {
        console.error('Lỗi parse user:', e);
    }
    
    // Kiểm tra quyền kỹ thuật viên (RoleID = 3)
    if (userRole !== 3) {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'index.html';
        return;
    }
}

/**
 * Lấy token từ localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Load thống kê dashboard
 */
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
        
        const data = await response.json();
        
        if (data.success) {
            // Cập nhật số liệu lên giao diện
            document.getElementById('todayAppointments').textContent = data.stats.todayAppointments || 0;
            document.getElementById('pendingAppointments').textContent = data.stats.pendingAppointments || 0;
            document.getElementById('weeklyCompleted').textContent = data.stats.weeklyCompleted || 0;
            document.getElementById('averageRating').textContent = data.stats.averageRating || 0;
        } else {
            console.error('Lỗi load stats:', data.message);
        }
    } catch (error) {
        console.error('Lỗi khi tải thống kê dashboard:', error);
    }
}

/**
 * Load thông báo gần đây
 */
async function loadNotifications() {
    const notificationsList = document.getElementById('recentNotifications');
    
    if (!notificationsList) {
        console.warn('Không tìm thấy element recentNotifications');
        return;
    }
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/mechanics/notifications?limit=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.notifications) {
            if (data.notifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-bell-slash fs-1"></i>
                        <p class="mt-2">Không có thông báo nào</p>
                    </div>
                `;
                return;
            }
            
            let html = '';
            data.notifications.forEach(notification => {
                const isRead = notification.IsRead ? '' : 'unread';
                const iconClass = getNotificationIcon(notification.Type);
                const timeAgo = formatTimeAgo(notification.CreatedAt);
                
                html += `
                    <div class="notification-item ${isRead}" data-id="${notification.NotificationID}">
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
            
            // Thêm event click để đánh dấu đã đọc
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.addEventListener('click', () => markNotificationRead(item.dataset.id));
            });
        } else {
            notificationsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-bell-slash fs-1"></i>
                    <p class="mt-2">Không có thông báo nào</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        notificationsList.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2">Lỗi tải thông báo</p>
            </div>
        `;
    }
}

/**
 * Load lịch hẹn sắp tới
 */
async function loadUpcomingAppointments() {
    const appointmentsList = document.getElementById('upcomingAppointmentsList');
    
    if (!appointmentsList) {
        console.warn('Không tìm thấy element upcomingAppointmentsList');
        return;
    }
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/mechanics/appointments/upcoming`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.appointments) {
            if (data.appointments.length === 0) {
                appointmentsList.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <i class="bi bi-calendar-x fs-1 text-muted"></i>
                            <p class="mt-2 mb-0">Không có lịch hẹn sắp tới</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let html = '';
            data.appointments.forEach(appointment => {
                const appointmentDate = new Date(appointment.AppointmentDate);
                const formattedDate = appointmentDate.toLocaleDateString('vi-VN');
                const formattedTime = appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const statusClass = getStatusClass(appointment.Status);
                const statusText = getStatusText(appointment.Status);
                
                html += `
                    <tr>
                        <td>#${appointment.AppointmentID}</td>
                        <td>${appointment.CustomerName || 'Khách hàng'}</td>
                        <td>${appointment.Services || 'Chưa xác định'}</td>
                        <td>${formattedDate} ${formattedTime}</td>
                        <td><span class="badge bg-${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewAppointmentDetail(${appointment.AppointmentID})">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            appointmentsList.innerHTML = html;
        } else {
            appointmentsList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-calendar-x fs-1 text-muted"></i>
                        <p class="mt-2 mb-0">Không có lịch hẹn sắp tới</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Lỗi khi tải lịch hẹn sắp tới:', error);
        appointmentsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <p class="mt-2 mb-0">Lỗi tải lịch hẹn</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Load lịch làm việc
 */
async function loadSchedules() {
    const schedulesList = document.getElementById('schedulesList');
    
    if (!schedulesList) {
        console.warn('Không tìm thấy element schedulesList');
        return;
    }
    
    try {
        const token = getToken();
        
        // Lấy ngày hôm nay và 7 ngày tới
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const fromDate = today.toISOString().split('T')[0];
        const toDate = nextWeek.toISOString().split('T')[0];
        
        const response = await fetch(`${API_BASE_URL}/mechanics/schedules?from=${fromDate}&to=${toDate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.schedules) {
            if (data.schedules.length === 0) {
                schedulesList.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-calendar-week fs-1"></i>
                        <p class="mt-2">Chưa có lịch làm việc</p>
                        <a href="mechanic-schedule.html" class="btn btn-primary btn-sm mt-2">
                            <i class="bi bi-plus-circle me-1"></i> Đăng ký lịch
                        </a>
                    </div>
                `;
                return;
            }
            
            let html = '<div class="list-group">';
            data.schedules.forEach(schedule => {
                const workDate = schedule.WorkDate ? new Date(schedule.WorkDate) : new Date(schedule.StartTime);
                const formattedDate = workDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
                
                // Lấy giờ bắt đầu và kết thúc
                let startTime = schedule.StartTimeOnly || schedule.StartTime;
                let endTime = schedule.EndTimeOnly || schedule.EndTime;
                
                // Format nếu là datetime
                if (startTime && startTime.includes('T')) {
                    startTime = new Date(startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
                if (endTime && endTime.includes('T')) {
                    endTime = new Date(endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
                
                const statusBadge = getScheduleStatusBadge(schedule.Status);
                const typeIcon = schedule.Type === 'available' ? 'bi-check-circle text-success' : 'bi-x-circle text-danger';
                
                html += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi ${typeIcon} me-2"></i>
                            <strong>${formattedDate}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>${startTime} - ${endTime}
                            </small>
                        </div>
                        ${statusBadge}
                    </div>
                `;
            });
            html += '</div>';
            
            schedulesList.innerHTML = html;
        } else {
            schedulesList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-week fs-1"></i>
                    <p class="mt-2">Chưa có lịch làm việc</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi khi tải lịch làm việc:', error);
        schedulesList.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle fs-1"></i>
                <p class="mt-2">Lỗi tải lịch làm việc</p>
            </div>
        `;
    }
}

/**
 * Đánh dấu thông báo đã đọc
 */
async function markNotificationRead(notificationId) {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/mechanics/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cập nhật UI
            const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
            if (item) {
                item.classList.remove('unread');
                const dot = item.querySelector('.notification-dot');
                if (dot) dot.remove();
            }
        }
    } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Lấy icon cho loại thông báo
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'schedule':
            return { icon: 'bi-calendar-check', color: 'primary' };
        case 'appointment':
            return { icon: 'bi-calendar-event', color: 'success' };
        case 'system':
            return { icon: 'bi-gear', color: 'warning' };
        default:
            return { icon: 'bi-bell', color: 'primary' };
    }
}

/**
 * Format thời gian thành "X phút/giờ/ngày trước"
 */
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

/**
 * Lấy class CSS cho trạng thái lịch hẹn (dùng cho Bootstrap badge)
 */
function getStatusClass(status) {
    switch (status) {
        case 'Pending': return 'warning';
        case 'Confirmed': return 'info';
        case 'InProgress': return 'primary';
        case 'Completed': return 'success';
        case 'Canceled': return 'danger';
        default: return 'secondary';
    }
}

/**
 * Lấy text tiếng Việt cho trạng thái
 */
function getStatusText(status) {
    switch (status) {
        case 'Pending': return 'Chờ xác nhận';
        case 'Confirmed': return 'Đã xác nhận';
        case 'InProgress': return 'Đang thực hiện';
        case 'Completed': return 'Hoàn thành';
        case 'Canceled': return 'Đã hủy';
        default: return status;
    }
}

/**
 * Lấy badge cho trạng thái lịch làm việc
 */
function getScheduleStatusBadge(status) {
    switch (status) {
        case 'Approved':
            return '<span class="badge bg-success">Đã duyệt</span>';
        case 'Pending':
            return '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
        case 'Rejected':
            return '<span class="badge bg-danger">Từ chối</span>';
        default:
            return '<span class="badge bg-secondary">Không xác định</span>';
    }
}

/**
 * Xem chi tiết lịch hẹn
 */
function viewAppointmentDetail(appointmentId) {
    // Redirect đến trang quản lý lịch hẹn với ID
    window.location.href = `mechanic-appointments.html?id=${appointmentId}`;
}