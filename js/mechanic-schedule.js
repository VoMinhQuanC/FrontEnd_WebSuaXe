// mechanic-schedule.js - JavaScript cho trang lịch làm việc kỹ thuật viên

document.addEventListener('DOMContentLoaded', function() {
    // Sử dụng API_CONFIG từ config.js (được load trước)
    const API_BASE_URL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'http://localhost:3001/api';
    
    // Lưu trữ dữ liệu
    let mechanicData = {};
    let schedules = [];
    let listViewSchedules = []; // Schedules cho List View
    let appointments = [];
    let calendar; // FullCalendar instance
    let selectedDate = null;
    let isEditMode = false;
    let selectedScheduleId = null;
    let allMechanicSchedules = []; // Lịch của TẤT CẢ kỹ thuật viên
    let mechanicCountByDate = {}; // Đếm số KTV theo ngày
    let currentWeekStart = null; // Ngày đầu tuần hiện tại (Weekly Schedule)
    let allMechanicsData = []; // Data tất cả KTV cho Weekly Schedule
    let currentViewMonth = new Date(); // Tháng đang xem (List View)
    
    // Kiểm tra xác thực kỹ thuật viên TRƯỚC (để load mechanicData)
    checkMechanicAuth();
    
    // SAU ĐÓ mới initialize các views (cần mechanicData)
    initializeWeeklySchedule();
    initializeTabs();
    initializeListView();
    updateMonthText();
    
    // Khởi tạo lịch
    initializeCalendar();
    
    // Tải dữ liệu ban đầu
    loadScheduleData();
    
    // Đăng ký sự kiện
    document.getElementById('addScheduleBtn').addEventListener('click', openAddScheduleModal);
    document.getElementById('refreshScheduleBtn').addEventListener('click', refreshScheduleData);
    document.getElementById('saveScheduleBtn').addEventListener('click', saveSchedule);
    document.getElementById('confirmDeleteScheduleBtn').addEventListener('click', deleteSchedule);
    document.getElementById('viewAllSchedulesBtn').addEventListener('click', viewAllSchedules);
    document.getElementById('logout-link').addEventListener('click', logout);
    document.getElementById('sidebar-logout').addEventListener('click', logout);
    
    /**
     * Kiểm tra xác thực kỹ thuật viên
     */
    function checkMechanicAuth() {
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('user');
        
        if (!token || !userInfo) {
            // Chưa đăng nhập, chuyển hướng đến trang đăng nhập
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const user = JSON.parse(userInfo);
            
            // Kiểm tra vai trò kỹ thuật viên (role = 3)
            if (user.role !== 3) {
                // Không phải kỹ thuật viên, chuyển hướng đến trang chủ
                alert('Bạn không có quyền truy cập trang kỹ thuật viên');
                window.location.href = 'index.html';
                return;
            }
            
            // Lưu thông tin kỹ thuật viên
            mechanicData = user;
            
            // Hiển thị tên kỹ thuật viên
            document.getElementById('mechanicName').textContent = user.fullName || 'Kỹ thuật viên';
            
            // Hiển thị avatar với chữ cái đầu tiên của tên
            if (user.fullName) {
                document.getElementById('avatarPlaceholder').textContent = user.fullName.charAt(0).toUpperCase();
            }
            
        } catch (error) {
            console.error('Lỗi phân tích dữ liệu người dùng:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    }
    
    /**
     * Khởi tạo FullCalendar
     */
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) return;
        
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            locale: 'vi',
            buttonText: {
                today: 'Hôm nay',
                month: 'Tháng',
                week: 'Tuần',
                day: 'Ngày',
                list: 'Danh sách'
            },
            firstDay: 1, // Thứ 2 là ngày đầu tuần
            allDaySlot: false,
            slotMinTime: '07:00:00',
            slotMaxTime: '22:00:00',
            slotDuration: '00:30:00',
            navLinks: true,
            editable: false,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            nowIndicator: true,
            slotEventOverlap: false,
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
            },
            select: function(info) {
                handleDateSelection(info.start, info.end);
            },
            eventClick: function(info) {
                handleEventClick(info.event);
            },
            dateClick: function(info) {
                handleDateClick(info.date);
            }
        });
        
        calendar.render();
        
        // Lưu tham chiếu toàn cục đến calendar
        window.schedulesCalendar = calendar;
    }
    
    /**
     * Tải dữ liệu lịch làm việc và lịch hẹn
     */
    async function loadScheduleData() {
        try {
            const token = localStorage.getItem('token');
            
            // Hàm này load TẤT CẢ lịch của mechanic (không cần date range)
            // Dùng cho FullCalendar - calendar tự filter theo visible range
            const response = await fetch(`${API_BASE_URL}/mechanics/schedules/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu lịch làm việc');
            }
            
            const data = await response.json();
            
            if (data.success) {
                schedules = data.schedules;
                
                // Load lịch của tất cả KTV
                await loadAllMechanicSchedules();
                
                // Render calendar
                if (calendar) calendar.refetchEvents();
                
                // Render table
                renderSchedulesList(schedules);
            } else {
                showAlert(data.message || 'Không thể tải dữ liệu', 'danger');
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            showAlert('Có lỗi xảy ra khi tải dữ liệu', 'danger');
        }
    }
    
    /**
     * Tải lịch làm việc của kỹ thuật viên
     */
    async function loadMechanicSchedules() {
        try {
            const token = localStorage.getItem('token');
            
            // Hiển thị trạng thái đang tải
            document.getElementById('schedulesList').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                        <p class="mt-2">Đang tải lịch làm việc...</p>
                    </td>
                </tr>
            `;
            
            // Gọi API để lấy lịch làm việc
            const response = await fetch(`${API_BASE_URL}/mechanics/schedules?startDate=${startDateStr}&endDate=${endDateStr}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Lưu lịch làm việc
                schedules = data.schedules || [];
                
                // Hiển thị danh sách lịch làm việc
                renderSchedulesList(schedules);
            } else {
                throw new Error(data.message || 'Không thể tải lịch làm việc');
            }
            
        } catch (error) {
            console.error('Lỗi khi tải lịch làm việc:', error);
            
            document.getElementById('schedulesList').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Lỗi: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    /**
     * Tải lịch hẹn của kỹ thuật viên
     */
    async function loadMechanicAppointments() {
        try {
            const token = localStorage.getItem('token');
            
            // Gọi API để lấy lịch hẹn
            const response = await fetch(`${API_BASE_URL}/mechanics/appointments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Lưu lịch hẹn
                appointments = data.appointments || [];
            } else {
                throw new Error(data.message || 'Không thể tải lịch hẹn');
            }
            
        } catch (error) {
            console.error('Lỗi khi tải lịch hẹn:', error);
            showError('Không thể tải lịch hẹn: ' + error.message);
        }
    }
    
    /**
     * Hiển thị danh sách lịch làm việc
     */
    function renderSchedulesList(schedulesData) {
        const tableBody = document.getElementById('schedulesList');
        
        if (!schedulesData || schedulesData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-3">
                        <i class="bi bi-calendar-x me-2"></i>
                        Bạn chưa đăng ký lịch làm việc nào
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sắp xếp lịch làm việc theo thời gian bắt đầu mới nhất đến cũ nhất
        const sortedSchedules = [...schedulesData].sort((a, b) => {
            return new Date(b.StartTime) - new Date(a.StartTime);
        });
        
        // Giới hạn hiển thị 5 lịch gần nhất
        const recentSchedules = sortedSchedules.slice(0, 5);
        
        let html = '';
        
        recentSchedules.forEach(schedule => {
            // Format thời gian
            const startDate = new Date(schedule.StartTime);
            const endDate = new Date(schedule.EndTime);
            
            const formattedStartDate = startDate.toLocaleDateString('vi-VN') + ' ' + 
                                      startDate.toLocaleTimeString('vi-VN', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                      });
            
            const formattedEndDate = endDate.toLocaleDateString('vi-VN') + ' ' + 
                                    endDate.toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
            
            // Tạo badge trạng thái
            let statusBadge = '';
            let statusClass = '';
            
            switch (schedule.Status) {
                case 'Approved':
                    statusBadge = 'Đã duyệt';
                    statusClass = 'bg-approved';
                    break;
                case 'Pending':
                    statusBadge = 'Chờ duyệt';
                    statusClass = 'bg-pending';
                    break;
                case 'Rejected':
                    statusBadge = 'Đã từ chối';
                    statusClass = 'bg-rejected';
                    break;
                default:
                    statusBadge = 'Không xác định';
                    statusClass = 'bg-secondary';
            }
            
            html += `
                <tr>
                    <td>${schedule.ScheduleID}</td>
                    <td>${formattedStartDate}</td>
                    <td>${formattedEndDate}</td>
                    <td><span class="badge ${statusClass}">${statusBadge}</span></td>
                    <td>${schedule.Notes || 'Không có ghi chú'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-action" onclick="editSchedule(${schedule.ScheduleID})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-action" onclick="confirmDeleteSchedule(${schedule.ScheduleID})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Đặt hàm xử lý sự kiện cho các nút
        window.editSchedule = editSchedule;
        window.confirmDeleteSchedule = confirmDeleteSchedule;
    }
    
    /**
     * Cập nhật sự kiện trên lịch
     */
    function updateCalendarEvents() {
        if (!window.schedulesCalendar) return;
        
        // Xóa tất cả sự kiện hiện tại
        window.schedulesCalendar.removeAllEvents();
        
        // Thêm lịch làm việc
        const scheduleEvents = schedules.map(schedule => {
            // Xác định màu sắc dựa trên loại lịch
            let className = 'bg-schedule';
            
            if (schedule.Type === 'unavailable') {
                className = 'bg-unavailable';
            }
            
            return {
                id: 'schedule-' + schedule.ScheduleID,
                title: schedule.Type === 'available' ? 'Lịch làm việc' : 'Không làm việc',
                start: schedule.StartTime,
                end: schedule.EndTime,
                className: className,
                extendedProps: {
                    type: 'schedule',
                    schedule: schedule
                }
            };
        });
        
        // Thêm lịch hẹn
        const appointmentEvents = appointments.map(appointment => {
            return {
                id: 'appointment-' + appointment.AppointmentID,
                title: 'Lịch hẹn: ' + (appointment.CustomerName || 'Khách hàng'),
                start: appointment.AppointmentDate,
                end: new Date(new Date(appointment.AppointmentDate).getTime() + 60 * 60 * 1000), // Thêm 1 giờ
                className: 'bg-appointment',
                extendedProps: {
                    type: 'appointment',
                    appointment: appointment
                }
            };
        });
        
        // Thêm tất cả sự kiện vào lịch
        window.schedulesCalendar.addEventSource(scheduleEvents);
        window.schedulesCalendar.addEventSource(appointmentEvents);
    }
    
    /**
     * Xử lý khi chọn một khoảng thời gian trên lịch
     */
    function handleDateSelection(start, end) {
        // Lưu ngày được chọn
        selectedDate = start;
        
        // Mở modal đăng ký lịch với thời gian đã chọn
        openAddScheduleModal(start, end);
    }
    
    /**
     * Xử lý khi nhấp vào một ngày trên lịch
     */
    function handleDateClick(date) {
        // Lưu ngày được chọn
        selectedDate = date;
        
        // Có thể thêm hành động khác ở đây nếu cần
    }
    
    /**
     * Xử lý khi nhấp vào một sự kiện trên lịch
     */
    function handleEventClick(event) {
        const eventData = event.extendedProps;
        
        if (eventData.type === 'schedule') {
            // Mở modal chỉnh sửa lịch làm việc
            editSchedule(eventData.schedule.ScheduleID);
        } else if (eventData.type === 'appointment') {
            // Hiển thị thông tin lịch hẹn
            alert('Lịch hẹn: ' + event.title);
            // Có thể mở modal chi tiết lịch hẹn ở đây
        }
    }
    
    
    /**
     * Mở modal thêm lịch làm việc mới - V2
     * KHÔNG hiển thị checkbox đăng ký nghỉ
     */
    function openAddScheduleModal(start = null, end = null) {
        // Reset form
        document.getElementById('scheduleForm').reset();
        document.getElementById('scheduleId').value = '';
        document.getElementById('isEditMode').value = 'false';
        
        // ẨN phần đăng ký nghỉ (CHỈ DÀNH CHO EDIT)
        document.getElementById('leaveRequestSection').style.display = 'none';
        document.getElementById('isUnavailable').checked = false;
        
        // Enable giờ bắt đầu/kết thúc
        document.getElementById('startTime').disabled = false;
        document.getElementById('endTime').disabled = false;
        document.getElementById('startTime').setAttribute('required', 'required');
        document.getElementById('endTime').setAttribute('required', 'required');
        
        // Reset ghi chú
        document.getElementById('notesLabel').textContent = 'Ghi chú';
        document.getElementById('scheduleNotes').required = false;
        document.getElementById('scheduleNotes').placeholder = 'VD: Ca sáng, ca chiều...';
        document.getElementById('reasonRequired').style.display = 'none';
        document.getElementById('notesHint').style.display = 'block';
        document.getElementById('reasonHint').style.display = 'none';
        
        // Ẩn trạng thái
        document.getElementById('statusDisplay').style.display = 'none';
        
        // Nếu có thời gian đã chọn, điền vào form
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // Điền ngày
            document.getElementById('scheduleDate').value = formatDateForInput(startDate);
            
            // Điền giờ (chuyển sang format HH:MM cho dropdown)
            const startHour = startDate.getHours().toString().padStart(2, '0');
            const startMin = startDate.getMinutes().toString().padStart(2, '0');
            document.getElementById('startTime').value = `${startHour}:${startMin}`;
            
            const endHour = endDate.getHours().toString().padStart(2, '0');
            const endMin = endDate.getMinutes().toString().padStart(2, '0');
            document.getElementById('endTime').value = `${endHour}:${endMin}`;
        } else {
            // Set ngày mặc định là ngày mai
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('scheduleDate').value = formatDateForInput(tomorrow);
        }
        
        // Cập nhật tiêu đề modal
        document.getElementById('scheduleModalLabel').textContent = 'Đăng ký lịch làm việc mới';
        document.getElementById('saveBtnText').textContent = 'Lưu lịch';
        
        // Đặt chế độ thêm mới
        isEditMode = false;
        selectedScheduleId = null;
        
        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();
    }
    
    /**
     * Mở modal chỉnh sửa lịch làm việc - V2
     * HIỂN THỊ checkbox đăng ký nghỉ
     */
    function editSchedule(scheduleId) {
        // Tìm lịch làm việc - ưu tiên listViewSchedules (nếu đang ở List View)
        let schedule = listViewSchedules.find(s => s.ScheduleID === scheduleId);
        
        // Nếu không tìm thấy, tìm trong schedules (FullCalendar)
        if (!schedule) {
            schedule = schedules.find(s => s.ScheduleID === scheduleId);
        }
        
        if (!schedule) {
            showAlert('Không tìm thấy thông tin lịch làm việc', 'danger');
            return;
        }
        
        // Lưu ID lịch đang chỉnh sửa
        selectedScheduleId = scheduleId;
        isEditMode = true;
        
        // Cập nhật hidden fields
        document.getElementById('scheduleId').value = schedule.ScheduleID;
        document.getElementById('isEditMode').value = 'true';
        
        // Điền ngày
        const workDate = schedule.WorkDate ? new Date(schedule.WorkDate) : new Date(schedule.StartTime);
        document.getElementById('scheduleDate').value = formatDateForInput(workDate);
        
        // HIỂN THỊ phần đăng ký nghỉ (CHỈ KHI EDIT)
        document.getElementById('leaveRequestSection').style.display = 'block';
        
        // Kiểm tra xem lịch này đã là lịch nghỉ chưa
        const isUnavailable = schedule.Type === 'unavailable' || schedule.IsAvailable === 0;
        document.getElementById('isUnavailable').checked = isUnavailable;
        
        if (isUnavailable) {
            // ĐÃ LÀ LỊCH NGHỈ
            document.getElementById('startTime').disabled = true;
            document.getElementById('endTime').disabled = true;
            document.getElementById('startTime').value = '';
            document.getElementById('endTime').value = '';
            document.getElementById('startTime').removeAttribute('required');
            document.getElementById('endTime').removeAttribute('required');
            
            document.getElementById('notesLabel').textContent = 'Lý do nghỉ';
            document.getElementById('scheduleNotes').required = true;
            document.getElementById('scheduleNotes').placeholder = 'VD: Có việc gia đình, khám bệnh...';
            document.getElementById('reasonRequired').style.display = 'inline';
            document.getElementById('notesHint').style.display = 'none';
            document.getElementById('reasonHint').style.display = 'block';
            document.getElementById('saveBtnText').textContent = 'Cập nhật đơn xin nghỉ';
            
            // Đổi màu warning
            document.getElementById('isUnavailable').parentElement.style.backgroundColor = '#fee2e2';
            document.getElementById('isUnavailable').parentElement.style.borderColor = '#ef4444';
            
        } else {
            // VẪN LÀ LỊCH LÀM VIỆC BÌNH THƯỜNG
            
            // Parse thời gian
            let startTimeValue = '';
            let endTimeValue = '';
            
            if (schedule.StartTime) {
                const startDate = new Date(schedule.StartTime);
                const startHour = startDate.getHours().toString().padStart(2, '0');
                const startMin = startDate.getMinutes().toString().padStart(2, '0');
                startTimeValue = `${startHour}:${startMin}`;
            }
            
            if (schedule.EndTime) {
                const endDate = new Date(schedule.EndTime);
                const endHour = endDate.getHours().toString().padStart(2, '0');
                const endMin = endDate.getMinutes().toString().padStart(2, '0');
                endTimeValue = `${endHour}:${endMin}`;
            }
            
            document.getElementById('startTime').value = startTimeValue;
            document.getElementById('endTime').value = endTimeValue;
            document.getElementById('startTime').disabled = false;
            document.getElementById('endTime').disabled = false;
            document.getElementById('startTime').setAttribute('required', 'required');
            document.getElementById('endTime').setAttribute('required', 'required');
            
            document.getElementById('notesLabel').textContent = 'Ghi chú';
            document.getElementById('scheduleNotes').required = false;
            document.getElementById('scheduleNotes').placeholder = 'VD: Ca sáng, ca chiều...';
            document.getElementById('reasonRequired').style.display = 'none';
            document.getElementById('notesHint').style.display = 'block';
            document.getElementById('reasonHint').style.display = 'none';
            document.getElementById('saveBtnText').textContent = 'Cập nhật lịch';
            
            // Màu bình thường
            document.getElementById('isUnavailable').parentElement.style.backgroundColor = '#f0f9ff';
            document.getElementById('isUnavailable').parentElement.style.borderColor = '#bfdbfe';
        }
        
        document.getElementById('scheduleNotes').value = schedule.Notes || '';
        
        // Hiển thị trạng thái
        const statusDisplay = document.getElementById('statusDisplay');
        const statusBadge = document.getElementById('statusBadge');
        
        if (schedule.Status) {
            statusDisplay.style.display = 'block';
            statusBadge.className = 'badge';
            
            switch(schedule.Status) {
                case 'Approved':
                    statusBadge.classList.add('bg-success');
                    statusBadge.innerHTML = '<i class="bi bi-check-circle"></i> Đã duyệt';
                    break;
                case 'Pending':
                    statusBadge.classList.add('bg-warning');
                    statusBadge.innerHTML = '<i class="bi bi-clock"></i> Chờ duyệt';
                    break;
                case 'Rejected':
                    statusBadge.classList.add('bg-danger');
                    statusBadge.innerHTML = '<i class="bi bi-x-circle"></i> Từ chối';
                    break;
            }
        } else {
            statusDisplay.style.display = 'none';
        }
        
        // Cập nhật tiêu đề modal
        document.getElementById('scheduleModalLabel').textContent = 'Chỉnh sửa lịch làm việc';
        
        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();
    }

    /**
 * Load lịch của TẤT CẢ kỹ thuật viên để hiển thị trên calendar
 */

    
/**
 * Lưu lịch làm việc (tạo mới hoặc cập nhật)
 */
async function saveSchedule() {
    try {
        // Lấy dữ liệu từ form
        const scheduleDate = document.getElementById('scheduleDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const notes = document.getElementById('scheduleNotes').value;
        const isUnavailable = document.getElementById('isUnavailable').checked;
        
        // Kiểm tra dữ liệu cơ bản
        if (!scheduleDate) {
            showAlert('Vui lòng chọn ngày', 'danger');
            return;
        }
        
        // Kiểm tra quy tắc 24 giờ (chỉ khi tạo mới, không áp dụng khi edit)
        if (!isEditMode) {
            const selectedDateTime = new Date(scheduleDate);
            const now = new Date();
            const diffHours = (selectedDateTime - now) / (1000 * 60 * 60);
            
            if (diffHours < 24) {
                showAlert('Lịch làm việc phải được đăng ký trước ít nhất 24 giờ', 'danger');
                return;
            }
        }
        
        // Kiểm tra thời gian làm việc (nếu không phải đăng ký nghỉ)
        if (!isUnavailable) {
            if (!startTime || !endTime) {
                showAlert('Vui lòng chọn thời gian bắt đầu và kết thúc', 'danger');
                return;
            }
            
            if (startTime >= endTime) {
                showAlert('Thời gian kết thúc phải sau thời gian bắt đầu', 'danger');
                return;
            }
        }
        
        // Kiểm tra lý do nghỉ (nếu đăng ký nghỉ)
        if (isUnavailable && !notes) {
            showAlert('Vui lòng nhập lý do nghỉ', 'danger');
            return;
        }
        
        // ===== THÊM VALIDATION MỚI Ở ĐÂY =====
        const isValid = await validateScheduleData(
            scheduleDate,
            startTime,
            endTime,
            isUnavailable,
            isEditMode,
            selectedScheduleId
        );
        
        if (!isValid) {
            return; // Dừng lại nếu validation fail
        }
        // ===== KẾT THÚC VALIDATION MỚI =====
        
        const saveBtn = document.getElementById('saveScheduleBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';
        
        const token = localStorage.getItem('token');
        
        // Chuẩn bị dữ liệu gửi lên server
        const scheduleData = {
            WorkDate: scheduleDate,
            StartTime: startTime,
            EndTime: endTime,
            Type: isUnavailable ? 'unavailable' : 'available',
            IsAvailable: isUnavailable ? 0 : 1,
            Notes: notes
        };
        
        // Tạo datetime cho startTime và endTime (nếu không phải nghỉ)
        if (!isUnavailable) {
            scheduleData.startTime = new Date(`${scheduleDate}T${startTime}`).toISOString();
            scheduleData.endTime = new Date(`${scheduleDate}T${endTime}`).toISOString();
        }
        
        let url, method;
        
        if (isEditMode) {
            url = `${API_BASE_URL}/mechanics/schedules/${selectedScheduleId}`;
            method = 'PUT';
        } else {
            url = `${API_BASE_URL}/mechanics/schedules`;
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successMessage = isUnavailable 
                ? 'Đơn xin nghỉ đã được gửi đến admin. Vui lòng chờ phê duyệt.'
                : (isEditMode ? 'Cập nhật lịch làm việc thành công!' : 'Đã đăng ký lịch làm việc thành công!');
            
            showAlert(successMessage, 'success');
            
            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
            modal.hide();
            
            // Reload dữ liệu
            await loadScheduleData();
        } else {
            showAlert(data.message || 'Có lỗi xảy ra khi lưu lịch', 'danger');
        }
        
    } catch (error) {
        console.error('Lỗi khi lưu lịch:', error);
        showAlert('Có lỗi xảy ra khi lưu lịch', 'danger');
    } finally {
        const saveBtn = document.getElementById('saveScheduleBtn');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Lưu lịch';
    }
}
    
    /**
     * Hiển thị modal xác nhận xóa lịch làm việc
     */
    function confirmDeleteSchedule(scheduleId) {
        // Lưu ID lịch cần xóa
        selectedScheduleId = scheduleId;
        
        // Hiển thị modal xác nhận
        const modal = new bootstrap.Modal(document.getElementById('deleteScheduleModal'));
        modal.show();
    }
    
    /**
     * Xóa lịch làm việc
     */
    async function deleteSchedule() {
        try {
            const token = localStorage.getItem('token');
            
            if (!token || !selectedScheduleId) {
                throw new Error('Không có thông tin cần thiết');
            }
            
            // Hiển thị trạng thái đang xóa
            const deleteBtn = document.getElementById('confirmDeleteScheduleBtn');
            const deleteSpinner = document.getElementById('deleteScheduleSpinner');
            deleteBtn.disabled = true;
            deleteSpinner.classList.remove('d-none');
            
            // Gọi API để xóa lịch làm việc
            const response = await fetch(`${API_BASE_URL}/mechanics/schedules/${selectedScheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Đóng modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteScheduleModal'));
                modal.hide();
                
                // Hiển thị thông báo thành công
                showSuccess('Xóa lịch làm việc thành công');
                
                // Tải lại dữ liệu
                await loadScheduleData();
            } else {
                throw new Error(data.message || 'Không thể xóa lịch làm việc');
            }
            
        } catch (error) {
            console.error('Lỗi khi xóa lịch làm việc:', error);
            showError('Không thể xóa lịch làm việc: ' + error.message);
        } finally {
            // Khôi phục trạng thái nút
            const deleteBtn = document.getElementById('confirmDeleteScheduleBtn');
            const deleteSpinner = document.getElementById('deleteScheduleSpinner');
            deleteBtn.disabled = false;
            deleteSpinner.classList.add('d-none');
        }
    }
    
    /**
     * Xem tất cả lịch làm việc
     */
    function viewAllSchedules() {
        // Tải tất cả lịch làm việc và hiển thị
        renderSchedulesList(schedules);
    }
    
    /**
     * Làm mới dữ liệu lịch làm việc
     */
    function refreshScheduleData() {
        loadScheduleData();
    }
    
    /**
     * Đăng xuất
     */
    function logout(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
    
    /**
     * Hiển thị thông báo lỗi
     */
    function showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    }
    
    /**
     * Hiển thị thông báo thành công
     */
    function showSuccess(message) {
        const successAlert = document.getElementById('successAlert');
        const successMessage = document.getElementById('successMessage');
        
        successMessage.textContent = message;
        successAlert.classList.remove('d-none');
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            successAlert.classList.add('d-none');
        }, 5000);
    }
    
    /**
     * Format ngày cho input date
     */
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Format giờ cho input time
     */
    function formatTimeForInput(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }
    async function loadAllMechanicSchedules() {
        try {
            const token = localStorage.getItem('token');
        
            // Lấy ngày bắt đầu và kết thúc của tháng hiện tại
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        
            const response = await fetch(
                `${API_BASE_URL}/mechanics/schedules/all?startDate=${formatDateForInput(startDate)}&endDate=${formatDateForInput(endDate)}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        
            if (!response.ok) throw new Error('Không thể tải lịch kỹ thuật viên');
        
            const data = await response.json();
        
            if (data.success) {
                allMechanicSchedules = data.data;
            
                // Đếm số KTV theo ngày
                mechanicCountByDate = {};
                data.data.forEach(schedule => {
                    const dateKey = schedule.WorkDate.split('T')[0];
                    if (!mechanicCountByDate[dateKey]) {
                        mechanicCountByDate[dateKey] = {
                            count: 0,
                            mechanics: []
                        };
                    }
                
                    // Chỉ đếm unique mechanic
                    if (!mechanicCountByDate[dateKey].mechanics.find(m => m.id === schedule.MechanicID)) {
                        mechanicCountByDate[dateKey].count++;
                        mechanicCountByDate[dateKey].mechanics.push({
                            id: schedule.MechanicID,
                            name: schedule.MechanicName,
                            phone: schedule.MechanicPhone,
                            startTime: schedule.StartTime,
                            endTime: schedule.EndTime
                        });
                    }
                });
            
                console.log('✅ Đã load lịch tất cả KTV:', data.data.length);
                console.log('📊 Số KTV theo ngày:', mechanicCountByDate);
            }
        } catch (error) {
            console.error('Lỗi khi load lịch tất cả KTV:', error);
        }
    }

/**
 * Kiểm tra số lượng KTV đã đăng ký ngày cụ thể
 */
    async function checkMechanicCountByDate(date) {
        try {
            const token = localStorage.getItem('token');
        
            const response = await fetch(
                `${API_BASE_URL}/mechanics/schedules/count-by-date?date=${date}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        
            if (!response.ok) throw new Error('Không thể kiểm tra số lượng KTV');
        
            const data = await response.json();
        
            return data;
        } catch (error) {
            console.error('Lỗi khi kiểm tra số lượng KTV:', error);
            return { success: false, mechanicCount: 0, available: 6 };
        }
    }

/**
 * Kiểm tra overlap 4 tiếng
 */
    async function checkTimeOverlap(date, startTime, endTime, excludeScheduleId = null) {
        try {
            const token = localStorage.getItem('token');
        
            const response = await fetch(
                `${API_BASE_URL}/mechanics/schedules/check-overlap`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date,
                        startTime,
                        endTime,
                        excludeScheduleId
                    })
                }
            );
        
            if (!response.ok) throw new Error('Không thể kiểm tra overlap');
        
            const data = await response.json();
        
            return data;
        } catch (error) {
            console.error('Lỗi khi kiểm tra overlap:', error);
            return { success: false, hasOverlap: false };
        }
    }

/**
 * Validate dữ liệu trước khi lưu
 */
    async function validateScheduleData(scheduleDate, startTime, endTime, isUnavailable, isEdit, scheduleId) {
        // VALIDATE 1: Thời gian tối thiểu 4 tiếng
        if (!isUnavailable && startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            const hoursDiff = (end - start) / (1000 * 60 * 60);
        
            if (hoursDiff < 4) {
                showAlert('Thời gian làm việc tối thiểu phải 4 tiếng', 'danger');
                return false;
            }
        }
    
        // VALIDATE 2: Số lượng KTV (max 6)
        if (!isEdit) {
            const countData = await checkMechanicCountByDate(scheduleDate);
        
            if (countData.success && countData.mechanicCount >= 6) {
                showAlert('Đã đủ 6 kỹ thuật viên đăng ký ngày này. Vui lòng chọn ngày khác.', 'danger');
                return false;
            }
        }
    
        // VALIDATE 3: Overlap 4 tiếng
        if (!isUnavailable && startTime && endTime) {
            const overlapData = await checkTimeOverlap(
                scheduleDate,
                startTime,
                endTime,
                isEdit ? scheduleId : null
            );
        
            if (overlapData.success && overlapData.hasOverlap) {
                if (overlapData.overlaps && overlapData.overlaps.length > 0) {
                    const existingTime = new Date(overlapData.overlaps[0].StartTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    showAlert(`Bạn đã có lịch lúc ${existingTime}. Lịch phải cách nhau tối thiểu 4 tiếng.`, 'danger');
                } else {
                    showAlert('Thời gian này xung đột với lịch khác. Phải cách nhau tối thiểu 4 tiếng.', 'danger');
                }
                return false;
            }
        }
    
        return true;
    }
    /**
     * Hiển thị thông báo
     */

// ========================================
// FUNCTIONS CHO BẢNG LỊCH TRÌNH TUẦN
// ========================================

/**
 * Biến toàn cục cho weekly schedule
 */

/**
 * Khởi tạo weekly schedule view
 */
function initializeWeeklySchedule() {
    // Set tuần hiện tại (Thứ Hai)
    currentWeekStart = getMonday(new Date());
    
    // Load data
    loadWeeklyScheduleData();
    
    // Event listeners
    document.getElementById('prevWeekBtn').addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        loadWeeklyScheduleData();
    });
    
    document.getElementById('nextWeekBtn').addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        loadWeeklyScheduleData();
    });
    
    document.getElementById('addScheduleFromWeeklyBtn').addEventListener('click', () => {
        openAddScheduleModal();
    });
}

/**
 * Lấy ngày Thứ Hai của tuần chứa date
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

/**
 * Load dữ liệu lịch tuần từ API
 */
async function loadWeeklyScheduleData() {
    try {
        // Tính ngày bắt đầu và kết thúc tuần
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Format dates for API (YYYY-MM-DD)
        const startDateStr = weekStart.toISOString().split('T')[0];
        const endDateStr = weekEnd.toISOString().split('T')[0];
        
        // Update header text
        const weekRangeText = `${formatDateVN(weekStart)} - ${formatDateVN(weekEnd)}`;
        document.getElementById('weekRangeText').textContent = weekRangeText;
        
        // Update ngày cho mỗi cột
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const dayElement = document.getElementById(`day${i+1}`);
            if (dayElement) {
                dayElement.textContent = formatDateShort(dayDate);
            }
        }
        
        // Call API lấy lịch theo tuần (DÙNG ĐÚNG API)
        const token = localStorage.getItem('token');
        const apiUrl = `${API_BASE_URL}/schedules/by-date-range/${startDateStr}/${endDateStr}`;
        
        console.log('🔗 Calling API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu');
        }
        
        const data = await response.json();
        
        console.log('📊 Weekly API Response:', {
            success: data.success,
            hasSchedules: !!data.schedules,
            hasDataSchedules: !!data.data?.schedules,
            count: data.schedules?.length || data.data?.schedules?.length || 0,
            structure: Object.keys(data)
        });
        
        if (data.success) {
            // Check data.schedules tồn tại
            const allSchedules = data.schedules || data.data?.schedules || [];
            console.log('📅 Total schedules for weekly:', allSchedules.length);
            
            // Lọc lịch trong tuần này
            const weekSchedules = allSchedules.filter(schedule => {
                const scheduleDate = new Date(schedule.WorkDate);
                return scheduleDate >= weekStart && scheduleDate <= weekEnd;
            });
            
            // Group theo MechanicID
            const mechanicSchedules = groupSchedulesByMechanic(weekSchedules);
            
            // Render bảng
            renderWeeklyScheduleTable(mechanicSchedules, weekStart);
        } else {
            console.warn('⚠️ API response: success = false');
            // Render empty table
            renderWeeklyScheduleTable([], weekStart);
        }
        
    } catch (error) {
        console.error('❌ Lỗi load weekly schedule:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Render empty table thay vì crash
        const tbody = document.getElementById('weeklyScheduleBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-3 text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Không thể tải lịch trình tuần. Vui lòng thử lại.
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Group schedules theo MechanicID
 */
function groupSchedulesByMechanic(schedules) {
    const grouped = {};
    
    schedules.forEach(schedule => {
        const mechanicId = schedule.MechanicID;
        const mechanicName = schedule.MechanicName || 'KTV #' + mechanicId;
        
        if (!grouped[mechanicId]) {
            grouped[mechanicId] = {
                id: mechanicId,
                name: mechanicName,
                schedules: []
            };
        }
        
        grouped[mechanicId].schedules.push(schedule);
    });
    
    return Object.values(grouped);
}

/**
 * Render bảng lịch tuần
 */
function renderWeeklyScheduleTable(mechanicSchedules, weekStart) {
    const tbody = document.getElementById('weeklyScheduleBody');
    
    if (!mechanicSchedules || mechanicSchedules.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-3 text-muted">
                    <i class="bi bi-calendar-x me-2"></i>
                    Chưa có lịch làm việc nào trong tuần này
                </td>
            </tr>
        `;
        document.getElementById('hiddenMechanicsCount').textContent = '0';
        return;
    }
    
    // Sort theo tên
    mechanicSchedules.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    
    let html = '';
    const maxDisplay = 10; // Hiển thị tối đa 10 KTV
    const displayMechanics = mechanicSchedules.slice(0, maxDisplay);
    const hiddenCount = Math.max(0, mechanicSchedules.length - maxDisplay);
    
    displayMechanics.forEach(mechanic => {
        html += '<tr>';
        html += `<td><strong>${mechanic.name}</strong></td>`;
        
        // 7 cột cho 7 ngày
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            
            // Lọc schedules cho ngày này
            const daySchedules = mechanic.schedules.filter(s => {
                const sDate = new Date(s.WorkDate).toISOString().split('T')[0];
                return sDate === dateStr;
            });
            
            html += '<td class="text-center">';
            
            if (daySchedules.length === 0) {
                html += '<span class="text-muted">-</span>';
            } else {
                // Hiển thị tối đa 2 ca đầu tiên
                const displaySchedules = daySchedules.slice(0, 2);
                
                displaySchedules.forEach((schedule, idx) => {
                    const startTime = formatTime(schedule.StartTime);
                    const endTime = formatTime(schedule.EndTime);
                    const bgClass = schedule.Type === 'work' ? 'bg-light' : 'bg-warning bg-opacity-25';
                    
                    html += `
                        <div class="schedule-cell ${bgClass} p-2 mb-1 rounded">
                            <small>${startTime} - ${endTime}</small>
                        </div>
                    `;
                });
                
                // Nếu có nhiều hơn 2 ca
                if (daySchedules.length > 2) {
                    const moreCount = daySchedules.length - 2;
                    html += `
                        <small class="text-muted">+${moreCount} ca khác</small>
                    `;
                }
            }
            
            html += '</td>';
        }
        
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
    document.getElementById('hiddenMechanicsCount').textContent = hiddenCount;
}

/**
 * Format date sang dd-mm-yyyy
 */
function formatDateVN(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Format date ngắn gọn (dd/mm)
 */
function formatDateShort(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
}

/**
 * Format time từ ISO string sang HH:MM:SS
 */
// ========================================
// TAB SWITCHING FUNCTIONALITY
// ========================================

/**
 * Khởi tạo tabs
 */
// ========================================
// LIST VIEW FUNCTIONS - CHỈ HIỂN THỊ NGÀY CÓ LỊCH
// ========================================

/**
 * Biến toàn cục cho list view
 */

/**
 * Khởi tạo list view
 */
function initializeListView() {
    // Load lịch tháng hiện tại
    loadScheduleListView();
    
    // Event listeners
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() - 1);
        updateMonthText();
        loadScheduleListView();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() + 1);
        updateMonthText();
        loadScheduleListView();
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentViewMonth = new Date();
        updateMonthText();
        loadScheduleListView();
    });
    
    // Event cho empty state button
    const addFromEmptyBtn = document.getElementById('addScheduleFromEmptyBtn');
    if (addFromEmptyBtn) {
        addFromEmptyBtn.addEventListener('click', () => {
            openAddScheduleModal();
        });
    }
    
    console.log('✅ List view initialized');
}

/**
 * Update text hiển thị tháng
 */
function updateMonthText() {
    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const month = monthNames[currentViewMonth.getMonth()];
    const year = currentViewMonth.getFullYear();
    
    document.getElementById('currentMonthText').textContent = `${month}/${year}`;
}

/**
 * Load lịch làm việc cho list view
 */
async function loadScheduleListView() {
    try {
        // Show loading
        document.getElementById('scheduleLoading').style.display = 'block';
        document.getElementById('scheduleEmpty').style.display = 'none';
        document.getElementById('scheduleList').innerHTML = '';
        
        // Tính start và end date của tháng
        const year = currentViewMonth.getFullYear();
        const month = currentViewMonth.getMonth();
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Call API - Lấy tất cả lịch rồi filter ở frontend
        const token = localStorage.getItem('token');
        
        // Get current user's MechanicID - handle nhiều trường hợp
        const currentMechanicId = mechanicData.UserID || mechanicData.userId || mechanicData.id || mechanicData.MechanicID;
        
        console.log('📅 mechanicData:', mechanicData);
        console.log('📅 Loading schedules for Mechanic ID:', currentMechanicId);
        
        if (!currentMechanicId) {
            console.error('❌ Không tìm thấy MechanicID! mechanicData:', mechanicData);
            document.getElementById('scheduleLoading').style.display = 'none';
            document.getElementById('scheduleEmpty').style.display = 'block';
            return;
        }
        console.log('📅 Date range:', startDateStr, 'to', endDateStr);
        
        const response = await fetch(
            `${API_BASE_URL}/mechanics/schedules?startDate=${startDateStr}&endDate=${endDateStr}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to load schedules');
        }
        
        const data = await response.json();
        
        console.log('📊 Total schedules from API:', data.schedules?.length || 0);
        
        // FILTER: Chỉ lấy lịch của user hiện tại
        let allSchedules = data.schedules || [];
        const mySchedules = allSchedules.filter(schedule => 
            schedule.MechanicID === currentMechanicId
        );
        
        console.log('✅ My schedules only:', mySchedules.length);
        
        // Override data.schedules với filtered schedules
        data.schedules = mySchedules;
        
        // LƯU VÀO BIẾN GLOBAL
        listViewSchedules = mySchedules;
        
        console.log('📅 Loaded schedules for list view:', data.schedules?.length || 0);
        
        // Hide loading
        document.getElementById('scheduleLoading').style.display = 'none';
        
        if (!data.schedules || data.schedules.length === 0) {
            // Show empty state
            document.getElementById('scheduleEmpty').style.display = 'block';
        } else {
            // Render list
            renderScheduleList(data.schedules);
        }
        
    } catch (error) {
        console.error('❌ Error loading schedule list:', error);
        document.getElementById('scheduleLoading').style.display = 'none';
        
        // Show error message
        document.getElementById('scheduleList').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Không thể tải lịch làm việc. Vui lòng thử lại.
            </div>
        `;
    }
}

/**
 * Render danh sách lịch - GROUP THEO NGÀY
 */
function renderScheduleList(schedules) {
    const container = document.getElementById('scheduleList');
    
    // Group schedules theo ngày
    const schedulesByDate = {};
    
    schedules.forEach(schedule => {
        const date = new Date(schedule.WorkDate).toISOString().split('T')[0];
        if (!schedulesByDate[date]) {
            schedulesByDate[date] = [];
        }
        schedulesByDate[date].push(schedule);
    });
    
    // Sort dates
    const sortedDates = Object.keys(schedulesByDate).sort();
    
    // Render
    let html = '';
    
    sortedDates.forEach(date => {
        const dateObj = new Date(date);
        const daySchedules = schedulesByDate[date];
        
        // Date header
        html += `
            <div class="schedule-date-group schedule-fade-in">
                <div class="schedule-date-header">
                    <h6>
                        <i class="bi bi-calendar-event me-2"></i>
                        ${formatDateHeader(dateObj)}
                    </h6>
                    <small>${formatDayOfWeek(dateObj)}</small>
                </div>
        `;
        
        // Schedule cards cho ngày này
        daySchedules.forEach(schedule => {
            html += renderScheduleCard(schedule);
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Attach event listeners cho các buttons
    attachScheduleCardEvents();
}

/**
 * Render 1 schedule card
 */
function renderScheduleCard(schedule) {
    console.log('🎨 Rendering card for schedule:', {
        ScheduleID: schedule.ScheduleID,
        MechanicID: schedule.MechanicID,
        WorkDate: schedule.WorkDate,
        StartTime: schedule.StartTime,
        EndTime: schedule.EndTime,
        Type: schedule.Type
    });
    
    const startTime = formatTimeOnly(schedule.StartTime);
    const endTime = formatTimeOnly(schedule.EndTime);
    
    console.log('⏰ Formatted times:', { startTime, endTime });
    
    // Determine type class và text
    let typeClass = 'work';
    let typeText = 'Lịch làm việc';
    
    if (schedule.Type === 'appointment') {
        typeClass = 'appointment';
        typeText = 'Lịch hẹn';
    } else if (schedule.Type === 'unavailable') {
        typeClass = 'unavailable';
        typeText = 'Không làm việc';
    }
    
    return `
        <div class="schedule-card" data-schedule-id="${schedule.ScheduleID}">
            <div class="schedule-card-time">
                <i class="bi bi-clock"></i>
                ${startTime} - ${endTime}
            </div>
            
            <span class="schedule-card-type ${typeClass}">
                ${typeText}
            </span>
            
            ${schedule.Notes ? `
                <div class="schedule-card-notes">
                    <i class="bi bi-sticky me-1"></i>
                    ${schedule.Notes}
                </div>
            ` : ''}
            
            <div class="schedule-card-actions">
                <button class="btn btn-sm btn-outline-primary edit-schedule-btn" 
                        data-schedule-id="${schedule.ScheduleID}">
                    <i class="bi bi-pencil me-1"></i>Sửa
                </button>
                <button class="btn btn-sm btn-outline-danger delete-schedule-btn"
                        data-schedule-id="${schedule.ScheduleID}">
                    <i class="bi bi-trash me-1"></i>Xóa
                </button>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners cho schedule cards
 */
function attachScheduleCardEvents() {
    // Edit buttons
    document.querySelectorAll('.edit-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-schedule-id');
            editScheduleFromList(scheduleId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const scheduleId = this.getAttribute('data-schedule-id');
            deleteScheduleFromList(scheduleId);
        });
    });
}

/**
 * Edit schedule từ list
 */
function editScheduleFromList(scheduleId) {
    console.log('✏️ Edit schedule:', scheduleId);
    // Gọi hàm editSchedule có sẵn
    editSchedule(scheduleId);
}

/**
 * Delete schedule từ list
 */
function deleteScheduleFromList(scheduleId) {
    console.log('🗑️ Delete schedule:', scheduleId);
    // Gọi hàm deleteSchedule có sẵn
    deleteSchedule(scheduleId);
}

/**
 * Format date header (ngày tháng năm)
 */
function formatDateHeader(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day} tháng ${month}, ${year}`;
}

/**
 * Format day of week
 */
function formatDayOfWeek(date) {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return days[date.getDay()];
}

/**
 * Format time only (HH:MM)
 */
function formatTimeOnly(timeStr) {
    console.log('⏰ formatTimeOnly called with:', timeStr, '| type:', typeof timeStr);
    
    if (!timeStr) {
        console.log('⏰ → Empty, returning "-"');
        return '-';
    }
    
    // Nếu đã là HH:MM hoặc HH:MM:SS
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        return timeStr.substring(0, 5); // Lấy HH:MM
    }
    
    // Parse ISO datetime
    const date = new Date(timeStr);
    
    if (isNaN(date.getTime())) {
        return '-';
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * Refresh list view sau khi thêm/sửa/xóa
 */
function refreshListView() {
    loadScheduleListView();
}

// ========================================
// THÊM VÀO DOMContentLoaded
// ========================================

// Thêm dòng này sau initializeTabs():
// initializeListView();
// updateMonthText();


function initializeTabs() {
    const tabMySchedule = document.getElementById('tabMySchedule');
    const tabTeamSchedule = document.getElementById('tabTeamSchedule');
    
    const myScheduleSection = document.getElementById('myScheduleSection');
    const teamScheduleSection = document.getElementById('teamScheduleSection');
    
    const myScheduleActions = document.getElementById('myScheduleActions');
    const teamScheduleActions = document.getElementById('teamScheduleActions');
    
    // Event: Click "Lịch của tôi"
    tabMySchedule.addEventListener('click', function() {
        // Update active state
        tabMySchedule.classList.add('active');
        tabTeamSchedule.classList.remove('active');
        
        // Show/hide sections
        myScheduleSection.style.display = 'block';
        teamScheduleSection.style.display = 'none';
        
        // Show/hide action buttons
        myScheduleActions.style.display = 'block';
        teamScheduleActions.style.display = 'none';
        
        console.log('✅ Switched to: My Schedule');
        
        // Refresh calendar nếu cần
        if (calendar) {
            if (calendar) calendar.refetchEvents();
        }
    });
    
    // Event: Click "Lịch team"
    tabTeamSchedule.addEventListener('click', function() {
        // Update active state
        tabTeamSchedule.classList.add('active');
        tabMySchedule.classList.remove('active');
        
        // Show/hide sections
        teamScheduleSection.style.display = 'block';
        myScheduleSection.style.display = 'none';
        
        // Show/hide action buttons
        teamScheduleActions.style.display = 'block';
        myScheduleActions.style.display = 'none';
        
        console.log('✅ Switched to: Team Schedule');
        
        // Refresh weekly schedule
        loadWeeklyScheduleData();
    });
    
    console.log('✅ Tabs initialized');
}

// ========================================
// THÊM VÀO DOMContentLoaded
// ========================================

// Thêm dòng này vào cuối hàm DOMContentLoaded, SAU initializeWeeklySchedule():
// initializeTabs();


function formatTime(timeStr) {
    if (!timeStr) return '-';
    
    // Nếu đã là định dạng HH:MM:SS
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        return timeStr;
    }
    
    // Parse ISO datetime string
    const date = new Date(timeStr);
    
    // Check valid date
    if (isNaN(date.getTime())) {
        console.warn('Invalid time format:', timeStr);
        return '-';
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// ========================================
// THÊM VÀO DOMContentLoaded
// ========================================

// Thêm dòng này vào cuối hàm DOMContentLoaded, TRƯỚC dòng checkMechanicAuth():
// initializeWeeklySchedule();


    function showAlert(message, type) {
        const alertId = type === 'success' ? 'successAlert' : 'errorAlert';
        const messageId = type === 'success' ? 'successMessage' : 'errorMessage';
        
        const alert = document.getElementById(alertId);
        const messageEl = document.getElementById(messageId);
        
        if (alert && messageEl) {
            messageEl.textContent = message;
            alert.classList.remove('d-none');
            
            // Scroll to top để thấy alert
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Tự động ẩn sau 5 giây
            setTimeout(() => {
                alert.classList.add('d-none');
            }, 5000);
        }
    }});