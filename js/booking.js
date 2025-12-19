// booking.js - Quản lý đặt lịch sửa xe

// ========================================
// THÊM ĐOẠN NÀY VÀO ĐẦU FILE booking.js
// (Ngay sau dòng đầu tiên)
// ========================================

// Function to update Step 4 confirmation info
function updateStep4Confirmation() {
    console.log('🔄 Updating Step 4...');
    
    setTimeout(() => {
        // Get services from Step 1
        const serviceCards = document.querySelectorAll('.service-card.selected');
        let servicesHtml = '';
        let totalPrice = 0;
        
        serviceCards.forEach(card => {
            const name = card.querySelector('h5')?.textContent || '';
            const priceText = card.querySelector('.service-price')?.textContent || '0';
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            
            // Tạo div để tránh quote issues
            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'd-flex justify-content-between mb-2';
            
            const nameDiv = document.createElement('div');
            nameDiv.textContent = name;
            
            const priceDiv = document.createElement('div');
            priceDiv.textContent = price.toLocaleString('vi-VN') + ' ₫';
            
            serviceDiv.appendChild(nameDiv);
            serviceDiv.appendChild(priceDiv);
            
            servicesHtml += serviceDiv.outerHTML;
            totalPrice += price;
        });
        
        // Update services
        const confirmServices = document.getElementById('confirmServices');
        const confirmTotalPrice = document.getElementById('confirmTotalPrice');
        if (confirmServices) {
            confirmServices.innerHTML = servicesHtml || '<p>Chưa chọn dịch vụ</p>';
            console.log('✅ Services updated');
        }
        if (confirmTotalPrice) {
            confirmTotalPrice.textContent = totalPrice.toLocaleString('vi-VN') + ' VNĐ';
        }
        
        // Get vehicle from Step 2
        const licensePlate = document.getElementById('licensePlate')?.value || 'N/A';
        const brand = document.getElementById('brand')?.value || 'N/A';
        const model = document.getElementById('model')?.value || 'N/A';
        const year = document.getElementById('vehicleYear')?.value || 'N/A';
        
        const confirmVehicle = document.getElementById('confirmVehicle');
        if (confirmVehicle) {
            const vehicleHTML = 
                '<p><strong>Biển số:</strong> ' + licensePlate + '</p>' +
                '<p><strong>Hãng xe:</strong> ' + brand + '</p>' +
                '<p><strong>Dòng xe:</strong> ' + model + '</p>' +
                '<p><strong>Năm sản xuất:</strong> ' + year + '</p>';
            confirmVehicle.innerHTML = vehicleHTML;
            console.log('✅ Vehicle updated');
        }
        
        // Get datetime from Step 3
        const date = document.getElementById('bookingDate')?.value || 'N/A';
        const timeBtn = document.querySelector('.btn-time-slot.selected');
        const time = timeBtn ? timeBtn.textContent.trim() : 'N/A';
        const mechanicCard = document.querySelector('.mechanic-card.selected');
        const mechanicNameEl = mechanicCard ? mechanicCard.querySelector('.mechanic-name') : null;
        const mechanic = mechanicNameEl ? mechanicNameEl.textContent.trim() : 'Chưa chọn';
        console.log('Mechanic card:', mechanicCard);
        console.log('Mechanic name element:', mechanicNameEl);
        console.log('Mechanic name:', mechanic);
        
        // Calculate total time
        let totalMinutes = 0;
        serviceCards.forEach(card => {
            const timeText = card.querySelector('.service-time')?.textContent || '0';
            const minutes = parseInt(timeText.replace(/[^0-9]/g, '')) || 0;
            totalMinutes += minutes;
        });
        
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const durationText = hours > 0 ? (hours + ' giờ ' + mins + ' phút') : (mins + ' phút');
        
        const confirmDateTime = document.getElementById('confirmDateTime');
        if (confirmDateTime) {
            const dateTimeHTML = 
                '<p><strong>Ngày:</strong> ' + date + '</p>' +
                '<p><strong>Thời gian bắt đầu:</strong> ' + time + '</p>' +
                '<p><strong>Tổng thời gian dự kiến:</strong> ' + durationText + '</p>' +
                '<p><strong>Kỹ thuật viên:</strong> ' + mechanic + '</p>';
            confirmDateTime.innerHTML = dateTimeHTML;
            console.log('✅ DateTime updated');
        }
        
        console.log('✅ Step 4 updated successfully!');
    }, 100);
}

// Expose to global scope
window.updateStep4Confirmation = updateStep4Confirmation;



// Function to setup payment method listeners
function setupPaymentListeners() {
    console.log('🔧 Setting up payment listeners...');
    
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    if (paymentMethodRadios.length === 0) {
        console.log('❌ No payment method radios found');
        return;
    }
    
    paymentMethodRadios.forEach(radio => {
        // Remove old listeners by cloning
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
    });
    
    // Get fresh references
    const updatedRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    updatedRadios.forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                console.log('💳 Payment method selected:', this.value);
                
                const paymentInfo = document.getElementById('paymentInfo');
                const paymentStatusInfo = document.getElementById('paymentStatusInfo');
                
                if (this.value === 'Chuyển khoản') {
                    console.log('🔄 Loading QR code...');
                    
                    if (paymentInfo) {
                        paymentInfo.innerHTML = `
                            <div class="text-center py-4">
                                <div class="spinner-border text-danger" role="status"></div>
                                <p class="mt-2 text-muted">Đang tải mã QR thanh toán...</p>
                            </div>
                        `;
                        paymentInfo.style.display = 'block';
                    }
                    
                    // Get selected services to calculate total
                    const serviceCards = document.querySelectorAll('.service-card.selected');
                    let totalPrice = 0;
                    serviceCards.forEach(card => {
                        const priceText = card.querySelector('.service-price')?.textContent || '0';
                        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
                        totalPrice += price;
                    });
                    
                    const tempId = 'BK' + Date.now();
                    
                    try {
                        // Use VietQR public API
                        // Bank: VCB (Vietcombank), Account: 1234567890, Amount: totalPrice
                        const bankInfo = {
                            bankId: '970436', // Vietcombank
                            accountNo: '1034567890',
                            accountName: 'CONG TY TNHH SUA XE VQTBIKE',
                            amount: totalPrice,
                            description: tempId
                        };
                        
                        const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.jpg?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(bankInfo.description)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
                        
                        const response = { ok: true };
                        const paymentData = { qrDataURL: qrUrl };
                        
                        if (response.ok) {
                            if (paymentInfo && paymentData.qrDataURL) {
                                paymentInfo.innerHTML = `
                                    <div class="text-center">
                                        <h5 class="text-primary mb-3">
                                            <i class="bi bi-qr-code me-2"></i>Quét mã QR để thanh toán
                                        </h5>
                                        <img src="${paymentData.qrDataURL}" 
                                             alt="QR Code" 
                                             class="img-fluid mb-3" 
                                             style="max-width: 300px; border: 2px solid #ddd; padding: 10px;">
                                        <div class="alert alert-info">
                                            <p class="mb-2"><strong>Số tiền:</strong> ${totalPrice.toLocaleString('vi-VN')} ₫</p>
                                            <p class="mb-2"><strong>Nội dung:</strong> ${tempId}</p>
                                            <p class="mb-0"><small>Vui lòng chuyển khoản đúng nội dung để xác nhận tự động</small></p>
                                        </div>
                                    </div>
                                `;
                                console.log('✅ QR code displayed');
                            }
                        } else {
                            throw new Error('Failed to load QR code');
                        }
                    } catch (error) {
                        console.error('❌ QR code error:', error);
                        if (paymentInfo) {
                            paymentInfo.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="bi bi-x-circle me-2"></i>
                                    <strong>Không thể tải mã QR.</strong><br>
                                    <small>Vui lòng thử lại hoặc chọn thanh toán tại tiệm.</small>
                                </div>
                            `;
                        }
                    }
                    
                    if (paymentStatusInfo) {
                        paymentStatusInfo.innerHTML = `
                            <div class="alert alert-info mt-3">
                                <i class="bi bi-info-circle me-2"></i>
                                Vui lòng chuyển khoản theo thông tin bên dưới để hoàn tất đặt lịch.
                            </div>
                        `;
                        paymentStatusInfo.style.display = 'block';
                    }
                    
                } else {
                    // Thanh toán tại tiệm
                    console.log('💵 Cash payment selected');
                    
                    if (paymentInfo) {
                        paymentInfo.style.display = 'none';
                    }
                    
                    if (paymentStatusInfo) {
                        paymentStatusInfo.innerHTML = `
                            <div class="alert alert-warning mt-3">
                                <i class="bi bi-wallet me-2"></i>
                                Bạn sẽ thanh toán trực tiếp tại cửa hàng khi đến sửa xe.
                            </div>
                        `;
                        paymentStatusInfo.style.display = 'block';
                    }
                }
            }
        });
    });
    
    console.log('✅ Payment listeners setup complete!');
}

// Expose to global
window.setupPaymentListeners = setupPaymentListeners;

console.log('✅ updateStep4Confirmation loaded!');

// ========================================
// KẾT THÚC ĐOẠN CODE THÊM
// Phần code cũ của booking.js tiếp tục bên dưới...
// ========================================

// Global API URLs
const PAYMENT_API_URL = 'https://suaxeweb-production.up.railway.app/api/payment';

// Global helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDuration(minutes) {
    if (!minutes) return "0 phút";
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} giờ`;
    return `${hours} giờ ${remainingMinutes} phút`;
}


// Global API URLs

// Global helper functions

document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://suaxeweb-production.up.railway.app/api';

    
    // Biến toàn cục lưu trữ dữ liệu đặt lịch
    const bookingData = {
        services: [],
        vehicle: {
            id: null,
            licensePlate: '',
            brand: '',
            model: '',
            year: ''
        },
        appointment: {
            date: null,
            time: null,
            endTime: null, // Thời gian kết thúc dự kiến
            totalServiceTime: 0, // Tổng thời gian dịch vụ
            mechanicId: null,  
            mechanicName: null,
            notes: ''
        }
    };
    
    // Biến lưu dữ liệu dịch vụ và xe
    let allServices = [];
    let userVehicles = [];
    let allTimeSlots = []; // Lưu trữ tất cả các khung giờ đã tải từ API
    
    // Elements
    const loginRequiredAlert = document.getElementById('loginRequiredAlert');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const stepButtons = {
        nextToStep2: document.getElementById('nextToStep2'),
        backToStep1: document.getElementById('backToStep1'),
        nextToStep3: document.getElementById('nextToStep3'),
        backToStep2: document.getElementById('backToStep2'),
        nextToStep4: document.getElementById('nextToStep4'),
        backToStep3: document.getElementById('backToStep3'),
        nextToStep5: document.getElementById('nextToStep5'), // Thêm nút chuyển sang bước 5
        backToStep4: document.getElementById('backToStep4'), // Thêm nút quay lại bước 4
        submitBooking: document.getElementById('submitBooking')
    };

    // Khởi tạo flatpickr cho date picker
    let datePicker;
    if (document.getElementById('bookingDate')) {
        datePicker = flatpickr("#bookingDate", {
            dateFormat: "d-m-Y",
            minDate: "today",
            locale: "vn",
            disableMobile: "true",
            onChange: function(selectedDates, dateStr) {
                if (selectedDates.length > 0) {
                    // Convert date format từ dd-mm-yyyy sang yyyy-mm-dd cho API
                    const [day, month, year] = dateStr.split('-');
                    const formattedDate = `${year}-${month}-${day}`;
                    bookingData.appointment.date = dateStr;
                    loadAvailableTimeSlots(formattedDate);
                }
            }
        });
    }
    
    // Kiểm tra trạng thái đăng nhập
    checkLoginStatus();
    
    // Thêm handler lỗi toàn cục cho hình ảnh
    document.addEventListener('error', function(e) {
        if (e.target.tagName.toLowerCase() === 'img') {
            console.log('Lỗi tải hình:', e.target.src);
            e.target.src = 'images/service-placeholder.jpg';
        }
    }, true);
    
    // Thêm CSS cho giao diện cải tiến
    addImprovedTimeSlotStyles();
    
    // === INIT FUNCTIONS ===
    
    /**
     * Kiểm tra trạng thái đăng nhập
     */
    function checkLoginStatus() {
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('user');
        
        if (token && userInfo) {
            try {
                // Đã đăng nhập
                if (loginRequiredAlert) loginRequiredAlert.style.display = 'none';
                if (bookingFormContainer) bookingFormContainer.style.display = 'flex';
                
                // Load dữ liệu cần thiết
                loadServices();
                loadUserVehicles();
                populateYearDropdown();
                
            } catch (error) {
                console.error('Lỗi xử lý thông tin người dùng:', error);
                showLoginRequired();
            }
        } else {
            // Chưa đăng nhập
            showLoginRequired();
        }
    }
    
    /**
     * Hiển thị thông báo yêu cầu đăng nhập
     */
    function showLoginRequired() {
        if (loginRequiredAlert) loginRequiredAlert.style.display = 'block';
        if (bookingFormContainer) bookingFormContainer.style.display = 'none';
    }
    
    /**
     * Tạo dropdown năm sản xuất xe
     */
    function populateYearDropdown() {
        const yearSelect = document.getElementById('vehicleYear');
        if (!yearSelect) return;
        
        const currentYear = new Date().getFullYear();
        
        // Xóa options cũ
        while (yearSelect.options.length > 1) {
            yearSelect.remove(1);
        }
        
        // Thêm options năm từ hiện tại đến 20 năm trước
        for (let year = currentYear; year >= currentYear - 50; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }
    
    // === DATA LOADING FUNCTIONS ===
    
    /**
     * Tải danh sách dịch vụ
     */
    async function loadServices() {
        try {
            const serviceList = document.getElementById('serviceList');
            if (!serviceList) return;
            
            // Hiển thị trạng thái loading
            serviceList.innerHTML = `
                <div class="col-12 text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải danh sách dịch vụ...</p>
                </div>
            `;
            
            // Thử cả hai endpoint có thể có
            let response;
            let result;
            let error1;
            
            try {
                // Thử endpoint đầu tiên
                response = await fetch(`${API_URL}/services`);
                if (response.ok) {
                    result = await response.json();
                }
            } catch (err) {
                // Lưu lỗi đầu tiên để hiển thị nếu cả hai endpoint đều thất bại
                error1 = err;
                console.warn('Không thể tải dịch vụ từ endpoint đầu tiên:', err.message);
            }
            
            // Nếu endpoint đầu tiên thất bại, thử endpoint thứ hai
            if (!result) {
                try {
                    response = await fetch(`${API_URL}/booking/services`);
                    if (response.ok) {
                        result = await response.json();
                    } else {
                        throw new Error(`Lỗi kết nối: ${response.status}`);
                    }
                } catch (err) {
                    console.warn('Không thể tải dịch vụ từ endpoint thứ hai:', err.message);
                    // Nếu cả hai endpoint đều thất bại, ném lỗi
                    throw error1 || err;
                }
            }
            
            console.log('Kết quả API dịch vụ:', result);
            
            // Xử lý nhiều cấu trúc phản hồi có thể có
            let services;
            
            if (result.success && result.services && result.services.length > 0) {
                // Cấu trúc: { success: true, services: [...] }
                services = result.services;
            } else if (Array.isArray(result) && result.length > 0) {
                // Cấu trúc: [...]
                services = result;
            } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                // Cấu trúc: { data: [...] }
                services = result.data;
            } else {
                // Không tìm thấy cấu trúc dịch vụ hợp lệ
                throw new Error('Không có dịch vụ nào được trả về từ API');
            }
            
            allServices = services;
            renderServiceList(services);
            
        } catch (error) {
            console.error('Lỗi khi tải dịch vụ:', error);
            
            // Hiển thị thông báo lỗi
            const serviceList = document.getElementById('serviceList');
            if (serviceList) {
                serviceList.innerHTML = `
                    <div class="col-12 text-center">
                        <div class="alert alert-danger">
                            <p>Không thể tải dịch vụ: ${error.message}</p>
                            <button class="btn btn-outline-primary mt-2" onclick="window.loadServices()">Thử lại</button>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Render danh sách dịch vụ
     */
    function renderServiceList(services) {
        const serviceList = document.getElementById('serviceList');
        if (!serviceList) return;
        
        if (!services || services.length === 0) {
            serviceList.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Hiện tại chưa có dịch vụ nào.
                    </div>
                </div>
            `;
            return;
        }
        
        console.log('Cấu trúc dữ liệu dịch vụ đầu tiên:', services[0]);
        
        let html = '';
        
        services.forEach(service => {
            // Xác định trường dữ liệu cần thiết - hỗ trợ nhiều cấu trúc dữ liệu
            const serviceId = service.ServiceID || service.serviceId || service.id;
            const serviceName = service.ServiceName || service.serviceName || service.name;
            const serviceDesc = service.Description || service.description || '';
            const servicePrice = service.Price || service.price || 0;
            const serviceTime = service.EstimatedTime || service.estimatedTime || service.time || 0;
            
            // Fix đường dẫn hình ảnh
            let serviceImagePath;
            const serviceImage = service.ServiceImage || service.serviceImage || service.image;
            if (serviceImage) {
                if (serviceImage.startsWith('http')) {
                    serviceImagePath = serviceImage;
                } else if (serviceImage.startsWith('images/')) {
                    serviceImagePath = serviceImage;
                } else {
                    serviceImagePath = `images/services/${serviceImage}`;
                }
            } else {
                serviceImagePath = 'images/service-placeholder.jpg';
            }
            
            const isSelected = bookingData.services.some(s => s.id === serviceId);
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="service-card ${isSelected ? 'selected' : ''}" data-id="${serviceId}">
                        <div class="form-check">
                            <input class="form-check-input service-checkbox" type="checkbox" ${isSelected ? 'checked' : ''} 
                                id="service-${serviceId}" data-id="${serviceId}">
                        </div>
                        <div class="d-flex">
                            <img src="${serviceImagePath}" alt="${serviceName}" class="service-image" onerror="this.src='images/service-placeholder.jpg'">
                            <div class="service-details">
                                <h5>${serviceName}</h5>
                                <p class="service-desc mb-2">${serviceDesc || 'Không có mô tả'}</p>
                                <div class="d-flex justify-content-between">
                                    <span class="service-price">${formatCurrency(servicePrice)}</span>
                                    <span class="service-time"><i class="bi bi-clock me-1"></i>${serviceTime} phút</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        serviceList.innerHTML = html;
        
        // Thêm event listeners cho service cards
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                const checkbox = this.querySelector('.service-checkbox');
                checkbox.checked = !checkbox.checked;
                toggleServiceSelection(checkbox);
            });
        });
        
        // Thêm event listeners cho checkboxes
        document.querySelectorAll('.service-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation();
                toggleServiceSelection(this);
            });
        });
    }
    
    /**
     * Tải danh sách xe của người dùng
     */
    async function loadUserVehicles() {
        try {
            const token = localStorage.getItem('token');
            const userVehiclesSection = document.getElementById('userVehiclesSection');
            
            if (!token || !userVehiclesSection) {
                return;
            }
            
            // Thử cả hai endpoint có thể có
            let response;
            let result;
            
            try {
                response = await fetch(`${API_URL}/booking/my-vehicles`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    result = await response.json();
                }
            } catch (err) {
                console.warn('Không thể tải xe từ endpoint đầu tiên:', err.message);
            }
            
            if (!result) {
                try {
                    response = await fetch(`${API_URL}/vehicles/my-vehicles`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        result = await response.json();
                    }
                } catch (err) {
                    console.warn('Không thể tải xe từ endpoint thứ hai:', err.message);
                    userVehiclesSection.style.display = 'none';
                    return;
                }
            }
            
            console.log('Kết quả API xe:', result);
            
            // Xử lý nhiều cấu trúc phản hồi có thể có
            let vehicles;
            
            if (result.success && result.vehicles && result.vehicles.length > 0) {
                vehicles = result.vehicles;
            } else if (Array.isArray(result) && result.length > 0) {
                vehicles = result;
            } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                vehicles = result.data;
            } else {
                userVehiclesSection.style.display = 'none';
                return;
            }
            
            userVehicles = vehicles;
            populateVehicleDropdown(vehicles);
            
        } catch (error) {
            console.error('Lỗi khi tải danh sách xe:', error);
            const userVehiclesSection = document.getElementById('userVehiclesSection');
            if (userVehiclesSection) {
                userVehiclesSection.style.display = 'none';
            }
        }
    }
    
    /**
     * Tải khung giờ trống cho ngày đã chọn
     */
    async function loadAvailableTimeSlots(date) {
        try {
            const timeSlotsContainer = document.getElementById('timeSlots');
            if (!timeSlotsContainer) return;
            
            // Hiển thị trạng thái loading
            timeSlotsContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải khung giờ...</p>
                </div>
            `;
            
            // Nếu không có date, hiển thị thông báo chọn ngày
            if (!date) {
                timeSlotsContainer.innerHTML = `
                    <div class="text-center py-3">
                        <p class="text-muted">Vui lòng chọn ngày để xem các khung giờ có sẵn</p>
                    </div>
                `;
                return;
            }
            
            // Lấy token xác thực (để đảm bảo chỉ người dùng đã đăng nhập mới xem được)
            const token = localStorage.getItem('token');
            
            // Thử cả hai endpoint có thể có
            let response;
            let result;
            
            try {
                response = await fetch(`${API_URL}/booking/available-slots?date=${date}`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                
                if (response.ok) {
                    result = await response.json();
                }
            } catch (err) {
                console.warn('Không thể tải khung giờ từ endpoint đầu tiên:', err.message);
            }
            
            if (!result) {
                try {
                    response = await fetch(`${API_URL}/schedules/available-slots?date=${date}`, {
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : ''
                        }
                    });
                    
                    if (response.ok) {
                        result = await response.json();
                    }
                } catch (err) {
                    console.warn('Không thể tải khung giờ từ endpoint thứ hai:', err.message);
                    throw new Error('Không thể tải khung giờ. Vui lòng thử lại sau.');
                }
            }
            
            console.log('Kết quả API khung giờ:', result);
            
            // Xử lý nhiều cấu trúc phản hồi có thể có
            let availableSlots;
            
            if (result.success && result.availableSlots && result.availableSlots.length > 0) {
                availableSlots = result.availableSlots;
            } else if (Array.isArray(result) && result.length > 0) {
                availableSlots = result;
            } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                availableSlots = result.data;
            } else {
                timeSlotsContainer.innerHTML = `
                    <div class="alert alert-info">
                        Không có khung giờ nào khả dụng cho ngày này. Vui lòng chọn ngày khác hoặc liên hệ với chúng tôi.
                    </div>
                `;
                // Disable nút tiếp tục
                if (stepButtons.nextToStep4) {
                    stepButtons.nextToStep4.disabled = true;
                }
                return;
            }
            
            allTimeSlots = availableSlots;
            renderImprovedTimeSlots(availableSlots);
            
        } catch (error) {
            console.error('Lỗi khi tải khung giờ:', error);
            
            // Hiển thị thông báo lỗi
            const timeSlotsContainer = document.getElementById('timeSlots');
            if (timeSlotsContainer) {
                timeSlotsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <p>Lỗi khi tải khung giờ: ${error.message}</p>
                        <button class="btn btn-outline-primary mt-2" onclick="window.loadAvailableTimeSlots('${date}')">Thử lại</button>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Hiển thị danh sách khung giờ (phiên bản cải tiến)
     */
    function renderImprovedTimeSlots(slots) {
        const timeSlotsContainer = document.getElementById('timeSlots');
        if (!timeSlotsContainer) return;
        
        if (!slots || slots.length === 0) {
            timeSlotsContainer.innerHTML = `
                <div class="alert alert-info">
                    Không có khung giờ nào khả dụng cho ngày đã chọn. Vui lòng chọn ngày khác.
                </div>
            `;
            // Disable nút tiếp tục
            if (stepButtons.nextToStep4) {
                stepButtons.nextToStep4.disabled = true;
            }
            return;
        }
        
        // Tính tổng thời gian dịch vụ
        const totalServiceTime = calculateTotalServiceTime();
        
        // Lưu vào bookingData
        bookingData.appointment.totalServiceTime = totalServiceTime;
        
        // Nhóm các khung giờ theo thời gian
        const timeGroups = {};
        
        // Chuẩn hóa cấu trúc dữ liệu khung giờ
        slots.forEach(slot => {
            const slotTime = slot.time || (slot.StartTime ? formatTimeString(slot.StartTime) : null);
            const mechanicId = slot.mechanicId || slot.MechanicID;
            const mechanicName = slot.mechanicName || slot.MechanicName;
            const status = slot.status || 'available';
            
            if (!slotTime) return;
            
            if (!timeGroups[slotTime]) {
                timeGroups[slotTime] = [];
            }
            
            timeGroups[slotTime].push({
                mechanicId: mechanicId,
                mechanicName: mechanicName,
                time: slotTime,
                status: status
            });
        });
        
        let html = `
            <div class="time-slots-improved">
                <h5 class="time-slots-title mb-3">Chọn khung giờ</h5>
                <div class="time-buttons">
        `;
        
        // Tạo các button cho các khung giờ
        Object.keys(timeGroups).sort().forEach(time => {
            html += `
                <button class="btn-time-slot" data-time="${time}">${time}</button>
            `;
        });
        
        html += `
                </div>
                
                <div class="mechanics-panel mt-4" id="mechanicsPanel" style="display: none;">
                    <h5 class="mechanics-title mb-3">Chọn kỹ thuật viên: <span id="selectedTimeLabel"></span></h5>
                    <div class="mechanics-cards" id="mechanicsCards"></div>
                </div>
                
                <div class="service-time-info mt-3 p-3 bg-light border rounded" id="serviceTimeInfo">
                    <strong>Thông tin:</strong> Thời gian dịch vụ dự kiến là ${formatDuration(totalServiceTime)}. 
                    Các khung giờ không khả dụng là do kỹ thuật viên đã có lịch hẹn khác trong khoảng thời gian này.
                </div>
            </div>
        `;
        
        timeSlotsContainer.innerHTML = html;
        
        // Thêm event listeners cho các nút khung giờ
        document.querySelectorAll('.btn-time-slot').forEach(button => {
            button.addEventListener('click', function() {
                // Bỏ selected từ tất cả các nút
                document.querySelectorAll('.btn-time-slot').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Thêm selected cho nút được chọn
                this.classList.add('selected');
                
                // Lấy thời gian đã chọn
                const selectedTime = this.getAttribute('data-time');
                
                // Lưu thời gian vào bookingData
                bookingData.appointment.time = selectedTime;
                
                // Hiển thị kỹ thuật viên cho khung giờ này
                showMechanicsForTimeSlot(selectedTime, timeGroups[selectedTime], totalServiceTime);
            });
        });
    }
    
    /**
     * Hiển thị danh sách kỹ thuật viên cho khung giờ đã chọn
     */
    function showMechanicsForTimeSlot(time, mechanics, totalServiceTime) {
        const mechanicsPanel = document.getElementById('mechanicsPanel');
        const mechanicsCards = document.getElementById('mechanicsCards');
        const selectedTimeLabel = document.getElementById('selectedTimeLabel');
        
        if (!mechanicsPanel || !mechanicsCards || !selectedTimeLabel) return;
        
        // Hiển thị panel kỹ thuật viên
        mechanicsPanel.style.display = 'block';
        selectedTimeLabel.textContent = time;
        
        // Xóa dữ liệu kỹ thuật viên đã chọn
        bookingData.appointment.mechanicId = null;
        bookingData.appointment.mechanicName = null;
        
        // Disable nút tiếp tục
        if (stepButtons.nextToStep4) stepButtons.nextToStep4.disabled = true;
        
        let html = '';
        
        // Hiển thị danh sách kỹ thuật viên
        mechanics.forEach(mechanic => {
            // Tính thời gian kết thúc dự kiến
            const endTime = calculateEndTime(time, totalServiceTime);
            
            const isAvailable = mechanic.status === 'available';
            const mechanicId = mechanic.mechanicId;
            const mechanicName = mechanic.mechanicName;
            
            html += `
                <div class="mechanic-card ${isAvailable ? '' : 'disabled'}" 
                     data-id="${mechanicId}" 
                     data-name="${mechanicName}" 
                     data-end-time="${endTime}">
                    <div class="mechanic-name">${mechanicName}</div>
                    <div class="mechanic-status ${isAvailable ? 'text-success' : 'text-danger'}">
                        ${isAvailable ? 'Có sẵn' : 'Đã đặt'}
                    </div>
                    ${isAvailable ? `<div class="mechanic-endtime">Kết thúc dự kiến: ${endTime}</div>` : ''}
                </div>
            `;
        });
        
        mechanicsCards.innerHTML = html;
        
        // Thêm event listeners cho các thẻ kỹ thuật viên
        document.querySelectorAll('.mechanic-card:not(.disabled)').forEach(card => {
            card.addEventListener('click', function() {
                // Bỏ selected từ tất cả các thẻ
                document.querySelectorAll('.mechanic-card').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // Thêm selected cho thẻ được chọn
                this.classList.add('selected');
                
                // Lấy thông tin kỹ thuật viên
                const mechanicId = this.getAttribute('data-id');
                const mechanicName = this.getAttribute('data-name');
                const endTime = this.getAttribute('data-end-time');
                
                // Lưu thông tin vào bookingData
                bookingData.appointment.mechanicId = mechanicId;
                bookingData.appointment.mechanicName = mechanicName;
                bookingData.appointment.endTime = endTime;
                
                // Enable nút tiếp tục
                if (stepButtons.nextToStep4) stepButtons.nextToStep4.disabled = false;
            });
        });
    }
    
    /**
     * Thêm CSS cho giao diện khung giờ cải tiến
     */
    function addImprovedTimeSlotStyles() {
        // Kiểm tra xem style đã tồn tại chưa
        if (document.getElementById('improved-time-slots-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'improved-time-slots-styles';
        styleElement.textContent = `
            /* Styles cho giao diện time slots cải tiến */
            .time-slots-improved {
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            
            .time-slots-title, .mechanics-title {
                color: #333;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 15px;
            }
            
            .time-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .btn-time-slot {
                padding: 8px 15px;
                background-color: #fff;
                border: 1px solid #ced4da;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
                min-width: 60px;
                text-align: center;
            }
            
            .btn-time-slot:hover {
                border-color: #0d6efd;
                background-color: rgba(13, 110, 253, 0.05);
            }
            
            .btn-time-slot.selected {
                background-color: #0d6efd;
                color: white;
                border-color: #0d6efd;
            }
            
            .mechanics-panel {
                background-color: #fff;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
            }
            
            .mechanics-cards {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .mechanic-card {
                flex: 1;
                min-width: 150px;
                max-width: 200px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                background-color: #fff;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .mechanic-card:hover:not(.disabled) {
                border-color: #0d6efd;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            
            .mechanic-card.selected {
                border-color: #0d6efd;
                background-color: rgba(13, 110, 253, 0.05);
                box-shadow: 0 0 10px rgba(13, 110, 253, 0.3);
            }
            
            .mechanic-card.disabled {
                opacity: 0.6;
                cursor: not-allowed;
                background-color: #f2f2f2;
            }
            
            .mechanic-name {
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .mechanic-status {
                font-size: 0.85rem;
                margin-bottom: 5px;
            }
            
            .mechanic-endtime {
                font-size: 0.8rem;
                color: #6c757d;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .time-buttons {
                    gap: 8px;
                }
                
                .btn-time-slot {
                    padding: 6px 12px;
                    font-size: 14px;
                }
                
                .mechanic-card {
                    min-width: 120px;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    /**
     * Hiển thị danh sách xe vào dropdown
     */
    function populateVehicleDropdown(vehicles) {
        const vehicleSelect = document.getElementById('vehicleSelect');
        if (!vehicleSelect) return;
        
        // Xóa options cũ
        while (vehicleSelect.options.length > 1) {
            vehicleSelect.remove(1);
        }
        
        if (vehicles && vehicles.length > 0) {
            vehicles.forEach(vehicle => {
                // Xác định các trường dữ liệu cần thiết
                const vehicleId = vehicle.VehicleID || vehicle.vehicleId || vehicle.id;
                const licensePlate = vehicle.LicensePlate || vehicle.licensePlate || vehicle.plate;
                const brand = vehicle.Brand || vehicle.brand || '';
                const model = vehicle.Model || vehicle.model || '';
                
                const option = document.createElement('option');
                option.value = vehicleId;
                option.textContent = `${licensePlate} - ${brand} ${model}`.trim();
                vehicleSelect.appendChild(option);
            });
            
            // Event listener cho vehicle select
            vehicleSelect.addEventListener('change', function() {
                const selectedVehicleId = this.value;
                
                if (selectedVehicleId) {
                    const selectedVehicle = vehicles.find(v => v.VehicleID == selectedVehicleId || v.vehicleId == selectedVehicleId || v.id == selectedVehicleId);
                    
                    if (selectedVehicle) {
                        // Cập nhật form với thông tin xe đã chọn
                        const licensePlate = selectedVehicle.LicensePlate || selectedVehicle.licensePlate || selectedVehicle.plate;
                        const brand = selectedVehicle.Brand || selectedVehicle.brand || '';
                        const model = selectedVehicle.Model || selectedVehicle.model || '';
                        const year = selectedVehicle.Year || selectedVehicle.year || '';
                        
                        if (document.getElementById('licensePlate')) document.getElementById('licensePlate').value = licensePlate;
                        if (document.getElementById('brand')) document.getElementById('brand').value = brand;
                        if (document.getElementById('model')) document.getElementById('model').value = model;
                        if (document.getElementById('vehicleYear')) document.getElementById('vehicleYear').value = year;
                        
                        // Cập nhật dữ liệu đặt lịch
                        bookingData.vehicle.id = selectedVehicleId;
                        bookingData.vehicle.licensePlate = licensePlate;
                        bookingData.vehicle.brand = brand;
                        bookingData.vehicle.model = model;
                        bookingData.vehicle.year = year;
                    }
                } else {
                    // Reset form khi chọn "--Chọn xe--"
                    if (document.getElementById('licensePlate')) document.getElementById('licensePlate').value = '';
                    if (document.getElementById('brand')) document.getElementById('brand').value = '';
                    if (document.getElementById('model')) document.getElementById('model').value = '';
                    if (document.getElementById('vehicleYear')) document.getElementById('vehicleYear').value = '';
                    
                    // Reset dữ liệu xe
                    bookingData.vehicle.id = null;
                    bookingData.vehicle.licensePlate = '';
                    bookingData.vehicle.brand = '';
                    bookingData.vehicle.model = '';
                    bookingData.vehicle.year = '';
                }
            });
        } else {
            // Ẩn phần chọn xe nếu không có xe
            const userVehiclesSection = document.getElementById('userVehiclesSection');
            if (userVehiclesSection) userVehiclesSection.style.display = 'none';
        }
    }
    
    /**
     * Tính toán tổng thời gian dự kiến từ các dịch vụ đã chọn
     * @returns {number} Tổng thời gian dự kiến (phút)
     */
    function calculateTotalServiceTime() {
        let totalMinutes = 0;
        
        if (bookingData.services && bookingData.services.length > 0) {
            bookingData.services.forEach(service => {
                totalMinutes += (service.time || 0);
            });
        }
        
        return totalMinutes;
    }
    
    /**
     * Tính toán thời gian kết thúc dự kiến dựa trên thời gian bắt đầu và tổng thời gian dịch vụ
     * @param {string} startTime Thời gian bắt đầu (định dạng "HH:MM")
     * @param {number} durationMinutes Tổng thời gian (phút)
     * @returns {string} Thời gian kết thúc (định dạng "HH:MM")
     */
    function calculateEndTime(startTime, durationMinutes) {
        const [hours, minutes] = startTime.split(':').map(Number);
        
        // Chuyển thời gian bắt đầu sang phút
        let totalMinutes = hours * 60 + minutes;
        
        // Thêm thời gian dịch vụ
        totalMinutes += durationMinutes;
        
        // Chuyển lại thành giờ:phút
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        // Format lại thành chuỗi "HH:MM"
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    }
    
    /**
     * Cập nhật danh sách dịch vụ đã chọn
     */
    function updateSelectedServices() {
        const selectedServicesList = document.getElementById('selectedServicesList');
        const totalSection = document.getElementById('totalSection');
        
        if (!selectedServicesList || !totalSection) return;
        
        const totalPrice = document.getElementById('totalPrice');
        const totalTime = document.getElementById('totalTime');
        
        if (bookingData.services.length === 0) {
            selectedServicesList.innerHTML = `<p class="text-muted">Chưa có dịch vụ nào được chọn</p>`;
            totalSection.style.display = 'none';
            if (stepButtons.nextToStep2) stepButtons.nextToStep2.disabled = true;
            return;
        }
        
        let html = '';
        let sum = 0;
        let totalMinutes = 0;
        
        bookingData.services.forEach(service => {
            html += `
                <div class="selected-service-item">
                    <div>${service.name}</div>
                    <div class="d-flex align-items-center">
                        <span class="me-3">${formatCurrency(service.price)}</span>
                        <i class="bi bi-x-circle remove-service" data-id="${service.id}"></i>
                    </div>
                </div>
            `;
            
            // Đảm bảo price là số
            const servicePrice = Number(service.price) || 0;
            sum += servicePrice;
            totalMinutes += (Number(service.time) || 0);
        });
        
        selectedServicesList.innerHTML = html;
        if (totalPrice) totalPrice.textContent = formatCurrency(sum);
        if (totalTime) totalTime.textContent = formatDuration(totalMinutes);
        totalSection.style.display = 'block';
        
        // Enable nút tiếp tục
        if (stepButtons.nextToStep2) stepButtons.nextToStep2.disabled = false;
        
        // Thêm event listeners cho nút xóa
        document.querySelectorAll('.remove-service').forEach(button => {
            button.addEventListener('click', function() {
                const serviceId = parseInt(this.getAttribute('data-id'));
                removeService(serviceId);
            });
        });
        
        // Cập nhật lại khung giờ nếu người dùng đã chọn ngày
        if (bookingData.appointment.date) {
            const [day, month, year] = bookingData.appointment.date.split('-');
            const formattedDate = `${year}-${month}-${day}`;
            loadAvailableTimeSlots(formattedDate);
        }
    }

    
    /**
     * Cập nhật thông tin xác nhận
     */
    function updateConfirmationInfo() {
        const confirmServices = document.getElementById('confirmServices');
        const confirmTotalPrice = document.getElementById('confirmTotalPrice');
        const confirmVehicle = document.getElementById('confirmVehicle');
        const confirmDateTime = document.getElementById('confirmDateTime');
        const confirmNotes = document.getElementById('confirmNotes');
        const confirmNotesSection = document.getElementById('confirmNotesSection');
        
        if (!confirmServices || !confirmTotalPrice || !confirmVehicle || !confirmDateTime) return;
        
        // Dịch vụ
        let servicesHtml = '';
        let totalPrice = 0;
        
        bookingData.services.forEach(service => {
            servicesHtml += `
                <div class="confirm-service-item">
                    <div>${service.name}</div>
                    <div>${formatCurrency(service.price)}</div>
                </div>
            `;
            // Đảm bảo price là số
            const servicePrice = Number(service.price) || 0;
            totalPrice += service.price;
        });
        
        confirmServices.innerHTML = servicesHtml;
        confirmTotalPrice.textContent = formatCurrency(totalPrice);
        
        // Thông tin xe
        const vehicleInfo = `
            <p><strong>Biển số:</strong> ${bookingData.vehicle.licensePlate}</p>
            <p><strong>Hãng xe:</strong> ${bookingData.vehicle.brand || 'Không có thông tin'}</p>
            <p><strong>Dòng xe:</strong> ${bookingData.vehicle.model || 'Không có thông tin'}</p>
            <p><strong>Năm sản xuất:</strong> ${bookingData.vehicle.year || 'Không có thông tin'}</p>
        `;
        confirmVehicle.innerHTML = vehicleInfo;
        
        // Thời gian
        const dateTime = `
            <p><strong>Ngày:</strong> ${bookingData.appointment.date}</p>
            <p><strong>Thời gian bắt đầu:</strong> ${bookingData.appointment.time}</p>
            <p><strong>Thời gian dự kiến kết thúc:</strong> ${bookingData.appointment.endTime || calculateEndTime(bookingData.appointment.time, bookingData.appointment.totalServiceTime)}</p>
            <p><strong>Tổng thời gian dịch vụ:</strong> ${formatDuration(bookingData.appointment.totalServiceTime)}</p>
            <p><strong>Kỹ thuật viên:</strong> ${bookingData.appointment.mechanicName || 'Chưa chọn'}</p>
        `;
        confirmDateTime.innerHTML = dateTime;
        
        // Ghi chú
        if (confirmNotes && confirmNotesSection) {
            if (bookingData.appointment.notes && bookingData.appointment.notes.trim()) {
                confirmNotes.textContent = bookingData.appointment.notes;
                confirmNotesSection.style.display = 'block';
            } else {
                confirmNotesSection.style.display = 'none';
            }
        }
    }
    
    // === EVENT HANDLERS ===
    
    /**
     * Xử lý chọn/bỏ chọn dịch vụ
     */
    function toggleServiceSelection(checkbox) {
        const serviceId = parseInt(checkbox.getAttribute('data-id'));
        const isChecked = checkbox.checked;
        const card = checkbox.closest('.service-card');
        
        if (isChecked) {
            // Thêm dịch vụ vào danh sách đã chọn
            if (!bookingData.services.some(s => s.id === serviceId)) {
                // Tìm thông tin dịch vụ từ danh sách đã tải
                const service = findServiceById(serviceId);
                
                if (service) {
                    // Đảm bảo các giá trị là số
                    const price = Number(service.Price || service.price || 0);
                    const time = Number(service.EstimatedTime || service.estimatedTime || service.time || 0);
                    
                    bookingData.services.push({
                        id: serviceId,
                        name: service.ServiceName || service.serviceName || service.name,
                        price: price,
                        time: time
                    });
                    
                    card.classList.add('selected');
                }
            }
        } else {
            // Xóa dịch vụ khỏi danh sách đã chọn
            bookingData.services = bookingData.services.filter(s => s.id !== serviceId);
            card.classList.remove('selected');
        }
        
        // Cập nhật danh sách dịch vụ đã chọn
        updateSelectedServices();
    }
    
    /**
     * Tìm dịch vụ theo ID
     */
    function findServiceById(serviceId) {
        return allServices.find(s => 
            s.ServiceID === serviceId || 
            s.serviceId === serviceId || 
            s.id === serviceId
        );
    }
    
    /**
     * Xóa dịch vụ khỏi danh sách đã chọn
     */
    function removeService(serviceId) {
        // Xóa dịch vụ khỏi danh sách
        bookingData.services = bookingData.services.filter(s => s.id !== serviceId);
        
        // Bỏ chọn checkbox tương ứng
        const checkbox = document.getElementById(`service-${serviceId}`);
        if (checkbox) {
            checkbox.checked = false;
            checkbox.closest('.service-card').classList.remove('selected');
        }
        
        // Cập nhật lại UI
        updateSelectedServices();
    }
    
    /**
     * Xử lý lọc dịch vụ theo từ khóa
     */
    function filterServices() {
        const searchInput = document.getElementById('searchService');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (!allServices || allServices.length === 0) return;
        
        const filteredServices = searchTerm 
            ? allServices.filter(service => {
                const serviceName = service.ServiceName || service.serviceName || service.name || '';
                const serviceDesc = service.Description || service.description || '';
                return serviceName.toLowerCase().includes(searchTerm) || 
                       (serviceDesc && serviceDesc.toLowerCase().includes(searchTerm));
            })
            : allServices;
            
        renderServiceList(filteredServices);
    }
    
    /**
     * Chuyển đến bước tiếp theo
     */
    function goToStep(step) {
        console.log('Chuyển đến bước:', step);
        
        // Ẩn tất cả các bước
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Ẩn active từ tất cả các bước trong nav
        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Hiện bước được chọn
        const stepContent = document.getElementById(`stepContent${step}`);
        const stepIndicator = document.getElementById(`step${step}`);
        
        if (stepContent) {
            stepContent.classList.add('active');
            console.log(`Đã kích hoạt bước ${step}`);
        } else {
            console.error(`Không tìm thấy phần tử có id stepContent${step}`);
        }
        
        if (stepIndicator) stepIndicator.classList.add('active');
        
        // Đánh dấu các bước trước là đã hoàn thành
        for (let i = 1; i < step; i++) {
            const prevStep = document.getElementById(`step${i}`);
            if (prevStep) prevStep.classList.add('active');
        }
        
        // Xử lý dữ liệu tùy theo bước
        if (step === 4) {
            updateConfirmationInfo();
        }

        // Xử lý riêng cho bước 5
        if (step === 5) {
    console.log('Đang xử lý bước 5 - Payment');
    
    // Xóa event listeners cũ (nếu có)
    const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethodRadios.forEach(radio => {
        // Clone để xóa listeners cũ
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
    });
    
    // Lấy lại references sau khi clone
    const updatedRadios = document.querySelectorAll('input[name="paymentMethod"]');
    let paymentMethodSelected = false;
    
    // Thiết lập event listeners MỚI
    updatedRadios.forEach(radio => {
        if (radio.checked) {
            paymentMethodSelected = true;
            bookingData.paymentMethod = radio.value;
        }
        
        // ✅ THÊM EVENT LISTENER cho mỗi radio button
        radio.addEventListener('change', async function() {
            if (this.checked) {
                console.log('💳 Chọn phương thức:', this.value);
                bookingData.paymentMethod = this.value;
                
                const paymentInfo = document.getElementById('paymentInfo');
                const paymentStatusInfo = document.getElementById('paymentStatusInfo');
                
                if (this.value === 'Chuyển khoản') {
                    // ✅ HIỂN THỊ QR CODE
                    console.log('🔄 Loading QR code...');
                    
                    // Tính tổng tiền
                    const totalPrice = bookingData.services.reduce((sum, service) => sum + service.price, 0);
                    
                    // Hiển thị loading
                    if (paymentInfo) {
                        paymentInfo.innerHTML = `
                            <div class="text-center py-4">
                                <div class="spinner-border text-danger" role="status"></div>
                                <p class="mt-2 text-muted">Đang tải mã QR thanh toán...</p>
                            </div>
                        `;
                        paymentInfo.style.display = 'block';
                    }
                    
                    // Tạo temporary appointmentId để load QR
                    // Sau khi đặt lịch thành công, sẽ update với ID thật
                    const tempId = `TEMP${Date.now()}`;
                    
                    // Load QR code
                    const paymentData = await loadPaymentQR(totalPrice, tempId);
                    
                    if (paymentData && paymentInfo) {
                        // ✅ Hiển thị QR
                        displayPaymentQR(paymentData, totalPrice);
                        console.log('✅ QR code displayed');
                    } else if (paymentInfo) {
                        // ❌ Hiển thị lỗi
                        paymentInfo.innerHTML = `
                            <div class="alert alert-danger">
                                <i class="bi bi-x-circle me-2"></i>
                                <strong>Không thể tải mã QR.</strong><br>
                                <small>Vui lòng thử lại hoặc chọn thanh toán tại tiệm.</small>
                            </div>
                        `;
                        console.error('❌ Failed to load QR');
                    }
                    
                    // Hiển thị status info
                    if (paymentStatusInfo) {
                        paymentStatusInfo.innerHTML = `
                            <div class="alert alert-info mt-3">
                                <i class="bi bi-info-circle me-2"></i>
                                Vui lòng chuyển khoản theo thông tin bên dưới để hoàn tất đặt lịch.
                            </div>
                        `;
                        paymentStatusInfo.style.display = 'block';
                    }
                    
                } else {
                    // ❌ ẨN QR CODE - Thanh toán tại tiệm
                    console.log('💵 Thanh toán tại tiệm - Ẩn QR');
                    
                    if (paymentInfo) {
                        paymentInfo.style.display = 'none';
                    }
                    
                    if (paymentStatusInfo) {
                        paymentStatusInfo.innerHTML = `
                            <div class="alert alert-warning mt-3">
                                <i class="bi bi-wallet me-2"></i>
                                Bạn sẽ thanh toán trực tiếp tại cửa hàng khi đến sửa xe.
                            </div>
                        `;
                        paymentStatusInfo.style.display = 'block';
                    }
                }
            }
        });
    });
    
    // Nếu chưa chọn, set mặc định
    if (!paymentMethodSelected && updatedRadios.length > 0) {
        updatedRadios[0].checked = true;
        bookingData.paymentMethod = updatedRadios[0].value;
    }
    
    // Trigger change event cho radio đã checked để hiển thị UI
    updatedRadios.forEach(radio => {
        if (radio.checked) {
            radio.dispatchEvent(new Event('change'));
        }
    });
}


    // Thêm event listener cho nút "Tiếp tục" ở bước 4
    // Sử dụng một handler duy nhất cho nextToStep5
    const nextToStep5Handler = function() {
        // Kiểm tra điều khoản dịch vụ
        const agreePolicy = document.getElementById('agreePolicy');
        
        if (agreePolicy && !agreePolicy.checked) {
            alert('Vui lòng đồng ý với điều khoản dịch vụ');
            return;
        }
        
        // Chuyển sang bước 5
        goToStep(5);
    };
    
    // Áp dụng handler cho nút trong stepButtons nếu có
    if (stepButtons.nextToStep5) {
        stepButtons.nextToStep5.addEventListener('click', nextToStep5Handler);
    }
    
    // Cũng áp dụng cho nút được tìm trực tiếp bằng ID (đảm bảo luôn có handler)
    const nextToStep5Element = document.getElementById('nextToStep5');
    if (nextToStep5Element) {
        nextToStep5Element.addEventListener('click', nextToStep5Handler);
    }

    // Event listener cho nút quay lại từ bước 5 về bước 4
    if (stepButtons.backToStep4) {
        stepButtons.backToStep4.addEventListener('click', function() {
            goToStep(4);
        });
    }

    // === BOOKING SUBMISSION ===
    
    /**
     * Gửi đơn đặt lịch
     */
    async function submitBooking() {
        try {
            // Lấy token xác thực
            const token = localStorage.getItem('token');
            const userInfoString = localStorage.getItem('user');
            
            // Validate đăng nhập
            if (!token || !userInfoString) {
                throw new Error('Vui lòng đăng nhập để đặt lịch');
            }
            
            // Parse thông tin người dùng
            const userInfo = JSON.parse(userInfoString);
            const userId = userInfo.id || userInfo.userId;
            
            // Validate các trường bắt buộc
            if (!userId) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            
            if (!bookingData.vehicle.licensePlate) {
                throw new Error('Vui lòng nhập biển số xe');
            }
            
            if (!bookingData.appointment.date || !bookingData.appointment.time) {
                throw new Error('Vui lòng chọn ngày và giờ đặt lịch');
            }
            
            if (!bookingData.appointment.mechanicId) {
                throw new Error('Vui lòng chọn kỹ thuật viên');
            }
            
            if (bookingData.services.length === 0) {
                throw new Error('Vui lòng chọn ít nhất một dịch vụ');
            }
            
            // Validate phương thức thanh toán
            const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
            let paymentMethod = bookingData.paymentMethod;
            
            if (!paymentMethod && paymentMethodRadios.length > 0) {
                paymentMethodRadios[0].checked = true;
                paymentMethod = paymentMethodRadios[0].value;
                bookingData.paymentMethod = paymentMethod;
            }
            
            if (!paymentMethod) {
                throw new Error('Vui lòng chọn phương thức thanh toán');
            }
            
            // Hiển thị spinner và disable nút submit
            const submitSpinner = document.getElementById('submitSpinner');
            const submitBookingBtn = document.getElementById('submitBooking');
            
            if (submitSpinner) submitSpinner.style.display = 'inline-block';
            if (submitBookingBtn) submitBookingBtn.disabled = true;
            
            // Chuẩn bị dữ liệu gửi đi
            const [day, month, year] = bookingData.appointment.date.split('-');
            
            // Format ngày giờ cho MySQL
            const appointmentDate = `${year}-${month}-${day} ${bookingData.appointment.time}:00`;
            
            // Tính toán thời gian kết thúc
            const endTime = bookingData.appointment.endTime || calculateEndTime(
                bookingData.appointment.time, 
                bookingData.appointment.totalServiceTime
            );
            const formattedEndTime = `${year}-${month}-${day} ${endTime}:00`;
            
            // Tổng giá dịch vụ
            const totalPrice = bookingData.services.reduce((sum, service) => sum + service.price, 0);
            
            // Chuẩn bị request data cho đặt lịch
            const requestData = {
                userId: userId,
                vehicleId: bookingData.vehicle.id,
                licensePlate: bookingData.vehicle.licensePlate,
                brand: bookingData.vehicle.brand,
                model: bookingData.vehicle.model,
                year: bookingData.vehicle.year,
                appointmentDate: appointmentDate,
                mechanicId: bookingData.appointment.mechanicId,
                services: bookingData.services.map(s => s.id),
                notes: bookingData.appointment.notes || '',
                totalServiceTime: bookingData.appointment.totalServiceTime,
                paymentMethod: paymentMethod,
                endTime: formattedEndTime
            };
            
            console.log('Dữ liệu đặt lịch:', requestData);
            
            // Gửi request đặt lịch
            const response = await fetch(`${API_URL}/booking/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            
            // Xử lý phản hồi đặt lịch
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Không thể đặt lịch. Vui lòng thử lại.');
            }
            
            // Lấy ID đặt lịch
            const appointmentId = result.appointmentId || result.id;
            
            // Chuẩn bị dữ liệu thanh toán
            const paymentData = {
                appointmentId: appointmentId,
                userId: userId,
                totalAmount: totalPrice,
                paymentMethod: paymentMethod,
                status: 'Completed',
                paymentDetails: paymentMethod === 'Chuyển khoản' 
                    ? 'Chuyển khoản ngân hàng Vietcombank' 
                    : 'Thanh toán tại tiệm'
            };

            console.log('Phương thức thanh toán gửi đi:', paymentMethod);
            
            // Gửi request tạo thanh toán
            const paymentResponse = await fetch(`${API_URL}/booking/appointments/${appointmentId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const paymentResult = await paymentResponse.json();
            
            // Xử lý thanh toán
            if (!paymentResponse.ok) {
                console.warn('Không thể tạo bản ghi thanh toán:', paymentResult.message);
            } else {
                console.log('Tạo bản ghi thanh toán thành công');
            }
            
            // Xử lý hiển thị thanh toán
            const paymentInfo = document.getElementById('paymentInfo');
            const paymentAmount = document.getElementById('paymentAmount');
            const paymentNote = document.getElementById('paymentNote');
            
            if (paymentMethod === 'Chuyển khoản' && paymentInfo) {
                if (paymentAmount) paymentAmount.textContent = formatCurrency(totalPrice);
                if (paymentNote) paymentNote.textContent = `BK${appointmentId} - ${userInfo.fullName || 'Khách hàng'}`;
                
                paymentInfo.style.display = 'block';
            }
            
            // Ẩn form đặt lịch và hiển thị trang thành công
            const bookingFormContainer = document.getElementById('bookingFormContainer');
            const bookingSuccess = document.getElementById('bookingSuccess');
            const bookingIdElement = document.getElementById('bookingId');
            
            if (bookingFormContainer) bookingFormContainer.style.display = 'none';
            if (bookingSuccess) bookingSuccess.style.display = 'block';
            if (bookingIdElement) bookingIdElement.textContent = `BK${appointmentId}`;
            
            return true;
            
        } catch (error) {
            console.error('Lỗi khi đặt lịch:', error);
            
            // Hiển thị lỗi chi tiết
            const errorAlert = document.getElementById('bookingErrorAlert');
            if (errorAlert) {
                errorAlert.textContent = `Lỗi: ${error.message}`;
                errorAlert.style.display = 'block';
                
                // Tự động ẩn thông báo lỗi sau 5 giây
                setTimeout(() => {
                    errorAlert.style.display = 'none';
                }, 5000);
            }
            
            return false;
            
        } finally {
            // Luôn ẩn spinner và enable nút submit
            const submitSpinner = document.getElementById('submitSpinner');
            const submitBookingBtn = document.getElementById('submitBooking');
            
            if (submitSpinner) submitSpinner.style.display = 'none';
            if (submitBookingBtn) submitBookingBtn.disabled = false;
        }
    }

    // Thiết lập phương thức thanh toán
    function setupPaymentMethodListeners() {
        const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
        const submitBookingBtn = document.getElementById('submitBooking');
        const paymentStatusInfo = document.getElementById('paymentStatusInfo'); // Element mới để hiển thị thông tin trạng thái
        
        paymentMethodRadios.forEach(radio => {
            console.log('Tìm thấy radio button:', radio.value);
            
            radio.addEventListener('change', function() {
                if (this.checked) {
                    console.log('Đã chọn phương thức thanh toán:', this.value);
                    
                    // Lưu phương thức thanh toán vào bookingData
                    bookingData.paymentMethod = this.value;
                    
                    // Hiển thị thông tin thanh toán và trạng thái tương ứng
                    const paymentInfo = document.getElementById('paymentInfo');
                    const paymentAmountElement = document.getElementById('paymentAmount');
                    
                    if (paymentInfo && paymentStatusInfo) {
                        if (this.value === 'Chuyển khoản') {
                            // Tính tổng giá dịch vụ
                            const totalPrice = bookingData.services.reduce((sum, service) => sum + service.price, 0);
                            
                            // Hiển thị số tiền
                            if (paymentAmountElement) {
                                paymentAmountElement.textContent = formatCurrency(totalPrice);
                            }
                            
                            // Hiển thị thông tin thanh toán
                            paymentInfo.style.display = 'block';
                            
                            // Hiển thị trạng thái thanh toán
                            paymentStatusInfo.innerHTML = `
                                <div class="alert alert-info mt-3">
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    Khi bạn chọn thanh toán chuyển khoản, hệ thống sẽ ghi nhận thanh toán của bạn ngay sau khi đặt lịch thành công.
                                </div>
                            `;
                            paymentStatusInfo.style.display = 'block';
                        } else {
                            // Ẩn thông tin chuyển khoản
                            paymentInfo.style.display = 'none';
                            
                            // Hiển thị thông báo thanh toán tại tiệm
                            paymentStatusInfo.innerHTML = `
                                <div class="alert alert-warning mt-3">
                                    <i class="bi bi-wallet-fill me-2"></i>
                                    Khi bạn chọn thanh toán tại tiệm, thanh toán sẽ được ghi nhận sau khi bạn đến cửa hàng vào ngày đã đặt lịch.
                                </div>
                            `;
                            paymentStatusInfo.style.display = 'block';
                        }
                    }
                    
                    // Enable nút submit
                    if (submitBookingBtn) {
                        submitBookingBtn.disabled = false;
                    }
                }
            });
        });
    }

    // Gọi hàm thiết lập listeners cho phương thức thanh toán
    setupPaymentMethodListeners();

    // Mở rộng hàm submitBooking để hỗ trợ phương thức thanh toán
    const originalSubmitBooking = submitBooking;
    submitBooking = async function() {
        try {
            // Validate phương thức thanh toán
            if (!bookingData.paymentMethod) {
                // Nếu chưa chọn, chọn mặc định phương thức đầu tiên
                const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
                if (paymentMethodRadios.length > 0) {
                    paymentMethodRadios[0].checked = true;
                    bookingData.paymentMethod = paymentMethodRadios[0].value;
                }
            }

            // Gọi hàm submit gốc
            return await originalSubmitBooking.call(this);
        } catch (error) {
            console.error('Lỗi trong submit booking mở rộng:', error);
            throw error;
        }
    };
    
    // === UTILITY FUNCTIONS ===
    
    /**
     * Format định dạng thời gian từ API
     * @param {string} timeStr Thời gian từ API (có thể là hh:mm:ss hoặc Date object)
     * @returns {string} Thời gian định dạng "HH:MM"
     */
    function formatTimeString(timeStr) {
        if (!timeStr) return null;
        
        if (timeStr instanceof Date) {
            return `${String(timeStr.getHours()).padStart(2, '0')}:${String(timeStr.getMinutes()).padStart(2, '0')}`;
        }
        
        if (typeof timeStr === 'string') {
            // Nếu định dạng là "hh:mm:ss", cắt bỏ phần giây
            if (timeStr.includes(':')) {
                return timeStr.substring(0, 5);
            }
        }
        
        return timeStr;
    }
    
    // === EVENT LISTENERS ===
    
    // Tìm kiếm dịch vụ
    const searchService = document.getElementById('searchService');
    if (searchService) {
        searchService.addEventListener('input', filterServices);
    }
    
    // Chuyển bước: STEP 1 -> STEP 2
    if (stepButtons.nextToStep2) {
        stepButtons.nextToStep2.addEventListener('click', function() {
            goToStep(2);
        });
    }
    
    // Chuyển bước: STEP 2 -> STEP 1
    if (stepButtons.backToStep1) {
        stepButtons.backToStep1.addEventListener('click', function() {
            goToStep(1);
        });
    }
    
    // Chuyển bước: STEP 2 -> STEP 3
    if (stepButtons.nextToStep3) {
        stepButtons.nextToStep3.addEventListener('click', function() {
            // Validate thông tin xe
            const licensePlate = document.getElementById('licensePlate').value.trim();
            
            if (!licensePlate) {
                alert('Vui lòng nhập biển số xe');
                return;
            }
            
            // Lưu thông tin xe
            bookingData.vehicle.licensePlate = licensePlate;
            
            const brandElement = document.getElementById('brand');
            const modelElement = document.getElementById('model');
            const yearElement = document.getElementById('vehicleYear');
            
            if (brandElement) bookingData.vehicle.brand = brandElement.value;
            if (modelElement) bookingData.vehicle.model = modelElement.value;
            if (yearElement) bookingData.vehicle.year = yearElement.value;
            
            goToStep(3);
        });
    }
    
    // Chuyển bước: STEP 3 -> STEP 2
    if (stepButtons.backToStep2) {
        stepButtons.backToStep2.addEventListener('click', function() {
            goToStep(2);
        });
    }
    
    // Chuyển bước: STEP 3 -> STEP 4
    if (stepButtons.nextToStep4) {
        stepButtons.nextToStep4.addEventListener('click', function() {
            // Validate thời gian
            if (!bookingData.appointment.time) {
                alert('Vui lòng chọn thời gian');
                return;
            }
            
            if (!bookingData.appointment.mechanicId) {
                alert('Vui lòng chọn kỹ thuật viên');
                return;
            }
            
            // Lưu thông tin đặt lịch
            const notesElement = document.getElementById('notes');
            if (notesElement) {
                bookingData.appointment.notes = notesElement.value.trim();
            }
            
            goToStep(4);
        });
    }
    
    // Chuyển bước: STEP 4 -> STEP 3
    if (stepButtons.backToStep3) {
        stepButtons.backToStep3.addEventListener('click', function() {
            goToStep(3);
        });
    }
    
    // Checkbox đồng ý điều khoản
    const agreePolicy = document.getElementById('agreePolicy');
    if (agreePolicy && stepButtons.nextToStep5) {
        agreePolicy.addEventListener('change', function() {
            stepButtons.nextToStep5.disabled = !this.checked;
        });
    }
    
    // Nút gửi đặt lịch
    if (stepButtons.submitBooking) {
        stepButtons.submitBooking.addEventListener('click', submitBooking);
    }
    
    // Xuất hàm ra global scope để có thể gọi từ bên ngoài (như nút Thử lại)
    window.loadServices = loadServices;
    window.loadAvailableTimeSlots = loadAvailableTimeSlots;


    /**
 * Gọi API lấy QR code thanh toán
 */
async function loadPaymentQR(totalAmount, appointmentId) {
    try {
        console.log(`💳 Loading QR: ID=${appointmentId}, Amount=${totalAmount}`);
        
        // Gọi API với appointmentId
        const response = await fetch(`${PAYMENT_API_URL}/qr/${appointmentId}`);
        
        if (!response.ok) {
            throw new Error('Không thể tải QR code');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Lỗi tải QR');
        }
        
        console.log('✅ QR loaded successfully');
        return result.data;
        
    } catch (error) {
        console.error('❌ Error loading QR:', error);
        return null;
    }
}

/**
 * Hiển thị QR code trong paymentInfo div
 */
function displayPaymentQR(paymentData, totalAmount) {
    const paymentInfo = document.getElementById('paymentInfo');
    if (!paymentInfo) {
        console.error('❌ Không tìm thấy element paymentInfo');
        return;
    }
    
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(totalAmount);
    
    // Tạo HTML với QR code
    const html = `
        <div class="payment-qr-section" style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
            <h5 class="text-primary mb-3">
                <i class="bi bi-qr-code me-2"></i>
                Quét mã QR để thanh toán
            </h5>
            
            <!-- QR Code Image -->
            <div class="text-center mb-4">
                <img src="${paymentData.qrUrl}" 
                     alt="QR Payment" 
                     class="img-fluid"
                     style="max-width: 280px; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
                <p class="text-muted mt-2 mb-0">
                    <small>
                        <i class="bi bi-phone"></i>
                        Quét mã này bằng app ngân hàng
                    </small>
                </p>
            </div>
            
            <!-- Booking Code -->
            <div class="alert alert-warning mb-3">
                <strong>Mã đơn hàng:</strong> 
                <span class="text-danger fw-bold fs-5">${paymentData.bookingCode}</span>
            </div>
            
            <!-- Bank Info -->
            <h6 class="mb-3">
                <i class="bi bi-bank"></i>
                Hoặc chuyển khoản thủ công
            </h6>
            
            <ul class="list-unstyled">
                <li class="mb-2">
                    <strong>Ngân hàng:</strong> ${paymentData.bankInfo.bankName}
                </li>
                <li class="mb-2">
                    <strong>Số tài khoản:</strong> 
                    <span class="text-primary">${paymentData.bankInfo.accountNo}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" 
                            onclick="copyPaymentText('${paymentData.bankInfo.accountNo}')">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </li>
                <li class="mb-2">
                    <strong>Chủ tài khoản:</strong> ${paymentData.bankInfo.accountName}
                </li>
                <li class="mb-2">
                    <strong>Số tiền:</strong> 
                    <span class="text-danger fw-bold">${formattedAmount}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" 
                            onclick="copyPaymentText('${totalAmount}')">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </li>
                <li class="mb-2">
                    <strong>Nội dung CK:</strong> 
                    <span class="text-primary fw-bold">${paymentData.bankInfo.transferContent}</span>
                    <button class="btn btn-sm btn-outline-secondary ms-2" 
                            onclick="copyPaymentText('${paymentData.bankInfo.transferContent}')">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </li>
            </ul>
            
            <!-- Warning -->
            <div class="alert alert-danger mt-3 mb-0">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Quan trọng:</strong> Vui lòng nhập <strong>ĐÚNG nội dung</strong>: 
                <code class="text-danger">${paymentData.bookingCode}</code> để chúng tôi xác nhận thanh toán.
            </div>
        </div>
    `;
    
    paymentInfo.innerHTML = html;
    paymentInfo.style.display = 'block';
}

/**
 * Copy text to clipboard
 */
function copyPaymentText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showPaymentNotification('success', `Đã copy: ${text}`);
        }).catch(err => {
            console.error('Copy failed:', err);
            showPaymentNotification('error', 'Không thể copy');
        });
    } else {
        // Fallback cho trình duyệt cũ
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showPaymentNotification('success', `Đã copy: ${text}`);
        } catch (err) {
            showPaymentNotification('error', 'Không thể copy');
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Hiển thị notification toast
 */
function showPaymentNotification(type, message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'} me-2"></i>${message}`;
    
    // Add animation styles
    if (!document.getElementById('payment-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'payment-toast-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Auto remove after 2.5s
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2500);
}
    }
});