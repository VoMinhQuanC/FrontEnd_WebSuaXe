/**
 * ============================================================================
 * BOOKING.JS - MỖI STEP = 1 FUNCTION
 * ============================================================================
 * Tất cả logic của mỗi step gộp vào 1 function duy nhất
 * Dễ quản lý, dễ tìm, dễ sửa
 * ============================================================================
 */

(function() {
    'use strict';
    
    console.log('🚀 Hệ thống đặt lịch - Mỗi step 1 function');
    
    // ========================================================================
    // CONFIG & STATE
    // ========================================================================
    const API_BASE = 'https://suaxeweb-production.up.railway.app/api';
    const CLOUDINARY_BASE = 'https://res.cloudinary.com/dqdl9ursa/image/upload/services';
    
    const bookingData = {
        services: [],
        vehicle: { id: null, licensePlate: '', brand: '', model: '', year: '' },
        appointment: { date: '', time: '' },
        customerInfo: { fullName: '', phoneNumber: '', email: '' },
        paymentMethod: 'Thanh toán tại tiệm'
    };
    
    let allServices = [];
    let userVehicles = [];
    let availableTimeSlots = [];
    
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
    
    function getToken() {
        return localStorage.getItem('token');
    }
    
    function getUserInfo() {
        return JSON.parse(localStorage.getItem('user') || '{}');
    }
    
    function getCloudinaryUrl(img) {
        if (!img) return 'images/service-placeholder.jpg';
        if (img.startsWith('http')) return img;
        return `${CLOUDINARY_BASE}/${img.replace(/\.[^/.]+$/, '')}`;
    }
    
    function showAlert(msg, type = 'danger') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.querySelector('.booking-content')?.insertBefore(alert, document.querySelector('.booking-content').firstChild);
        setTimeout(() => alert.remove(), 5000);
    }
    
    function goToStep(step) {
        // Ẩn tất cả
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step-content').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        // Hiện step hiện tại
        const stepEl = document.getElementById(`step${step}`);
        const contentEl = document.getElementById(`stepContent${step}`);
        if (stepEl) stepEl.classList.add('active');
        if (contentEl) {
            contentEl.classList.add('active');
            contentEl.style.display = 'block';
        }
        
        // Đánh dấu các step trước
        for (let i = 1; i < step; i++) {
            const prev = document.getElementById(`step${i}`);
            if (prev) prev.classList.add('active');
        }
        
        // Scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ========================================================================
    // STEP 1: CHỌN DỊCH VỤ - TẤT CẢ TRONG 1 FUNCTION
    // ========================================================================
    async function handleStep1() {
        console.log('📋 STEP 1: Chọn dịch vụ');
        
        const serviceList = document.getElementById('serviceList');
        const searchInput = document.getElementById('searchService');
        const selectedList = document.getElementById('selectedServicesList');
        const totalPrice = document.getElementById('totalPrice');
        const totalTime = document.getElementById('totalTime');
        const nextBtn = document.getElementById('nextToStep2');
        
        // Load dịch vụ từ API
        try {
            const res = await fetch(`${API_BASE}/services`);
            const data = await res.json();
            allServices = data.services || [];
            
            renderServices(allServices);
        } catch (err) {
            showAlert('Không thể tải danh sách dịch vụ');
        }
        
        // Render danh sách dịch vụ
        function renderServices(services) {
            serviceList.innerHTML = services.map(s => `
                <div class="service-card" data-service-id="${s.ServiceID}">
                    <input type="checkbox" class="form-check-input" value="${s.ServiceID}">
                    <img src="${getCloudinaryUrl(s.ServiceImage)}" class="service-image" alt="${s.ServiceName}">
                    <div class="service-details">
                        <h6>${s.ServiceName}</h6>
                        <p>${s.Description || 'Dịch vụ chất lượng'}</p>
                        <div class="service-price-time">
                            <span class="service-price">${formatCurrency(s.Price)}</span>
                            <span class="service-time">${s.EstimatedTime} phút</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Event: Click vào service card
            serviceList.querySelectorAll('.service-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    if (e.target.type === 'checkbox') return;
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                });
            });
            
            // Event: Checkbox change
            serviceList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const card = this.closest('.service-card');
                    card.classList.toggle('selected', this.checked);
                    updateSelectedServices();
                });
            });
        }
        
        // Cập nhật dịch vụ đã chọn
        function updateSelectedServices() {
            const checked = serviceList.querySelectorAll('input[type="checkbox"]:checked');
            bookingData.services = Array.from(checked).map(cb => {
                const id = cb.value;
                const service = allServices.find(s => s.ServiceID == id);
                return {
                    id: service.ServiceID,
                    name: service.ServiceName,
                    price: Number(service.Price) || 0,          // ✅ Convert to Number
                    time: Number(service.EstimatedTime) || 0    // ✅ Convert to Number
                };
            });
            
            // Hiển thị
            if (bookingData.services.length === 0) {
                selectedList.innerHTML = '<p class="text-muted">Chưa có dịch vụ nào được chọn</p>';
                nextBtn.disabled = true;
            } else {
                // Render danh sách dịch vụ
                const servicesHTML = bookingData.services.map(s => `
                    <div class="selected-service-item">
                        <span>${s.name}</span>
                        <span>${formatCurrency(s.price)}</span>
                    </div>
                `).join('');

                // Tính tổng
                const total = bookingData.services.reduce((sum, s) => sum + s.price, 0);
                const time = bookingData.services.reduce((sum, s) => sum + s.time, 0);

                // Thêm phần tổng tiền
                const totalHTML = `
                    <div class="total-section">
                        <div class="total-row">
                            <span class="label">Thời gian dự kiến:</span>
                            <span class="value">${time} phút</span>
                        </div>
                        <div class="total-row grand-total">
                            <span class="label">Tổng tiền:</span>
                            <span class="value">${formatCurrency(total)}</span>
                        </div>
                    </div>
                `;

                selectedList.innerHTML = servicesHTML + totalHTML;
                nextBtn.disabled = false;
                
                // Cập nhật totalPrice và totalTime (nếu có)
                if (totalPrice) totalPrice.textContent = formatCurrency(total);
                if (totalTime) totalTime.textContent = `${time} phút`;
            }
        }
        
        // Search
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const keyword = this.value.toLowerCase();
                const filtered = allServices.filter(s => 
                    s.ServiceName.toLowerCase().includes(keyword)
                );
                renderServices(filtered);
            });
        }
        
        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToStep(2);
                handleStep2();
            });
        }
    }
    
    // ========================================================================
    // STEP 2: THÔNG TIN XE - TẤT CẢ TRONG 1 FUNCTION
    // ========================================================================
    async function handleStep2() {
        console.log('🚗 STEP 2: Thông tin xe');
        
        const vehicleSelect = document.getElementById('vehicleSelect');
        const licensePlateInput = document.getElementById('licensePlate');
        const brandSelect = document.getElementById('brand');
        const modelInput = document.getElementById('model');
        const yearInput = document.getElementById('vehicleYear');     // ✅ Đổi yearSelect → yearInput
        const yearList = document.getElementById('yearList');         // ✅ Thêm yearList
        const nextBtn = document.getElementById('nextToStep3');
        const backBtn = document.getElementById('backToStep1');

        // ✅ TỰ ĐỘNG CẬP NHẬT NĂM HIỆN TẠI
        if (yearInput && yearList) {
            const currentYear = new Date().getFullYear();
            
            // Set max = năm hiện tại
            yearInput.setAttribute('max', currentYear);
            yearInput.setAttribute('placeholder', `Gõ hoặc chọn năm (vd: ${currentYear})`);
            
            // Tạo danh sách năm
            yearList.innerHTML = '';
            for (let year = currentYear; year >= 1974; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year === currentYear ? `${year} (Mới nhất)` : year;
                yearList.appendChild(option);
            }
            
            console.log(`✅ Năm từ 1974 đến ${currentYear}`);
        }
        
        // Load xe của user
        const token = getToken();
        const user = getUserInfo();
        
        if (token && user.userId) {
            try {
                const res = await fetch(`${API_BASE}/vehicles/user/${user.userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                userVehicles = data.data || data.vehicles || [];
                
                // Populate dropdown
                userVehicles.forEach(v => {
                    const plate = v.LicensePlate || v.licensePlate || '';
                    const brand = v.Brand || v.brand || '';
                    const model = v.Model || v.model || '';
                    
                    const option = document.createElement('option');
                    option.value = v.VehicleID || v.vehicleId;
                    option.textContent = brand || model ? `${plate} - ${brand} ${model}` : plate;
                    vehicleSelect.appendChild(option);
                });
            } catch (err) {
                console.log('Không load được xe:', err);
            }
        }
        
        // Event: Chọn xe có sẵn
        vehicleSelect.addEventListener('change', function() {
            const id = this.value;
            if (!id) {
                licensePlateInput.value = '';
                brandSelect.value = '';
                modelInput.value = '';
                yearSelect.value = '';
                return;
            }
            
            const vehicle = userVehicles.find(v => 
                (v.VehicleID || v.vehicleId) == id
            );
            
            if (vehicle) {
                licensePlateInput.value = vehicle.LicensePlate || vehicle.licensePlate || '';
                brandSelect.value = vehicle.Brand || vehicle.brand || '';
                modelInput.value = vehicle.Model || vehicle.model || '';
                yearSelect.value = vehicle.Year || vehicle.year || '';
                
                bookingData.vehicle = {
                    id: id,
                    licensePlate: licensePlateInput.value,
                    brand: brandSelect.value,
                    model: modelInput.value,
                    year: yearInput.value || null  // ✅ Cho phép null nếu bỏ trống
                };
            }
        });
        
        // Validate & Next
        nextBtn.addEventListener('click', async () => {
            const plate = licensePlateInput.value.trim();
            
            if (!plate) {
                showAlert('Vui lòng nhập biển số xe');
                return;
            }
            
            // Lưu hoặc tạo xe mới
            bookingData.vehicle = {
                id: bookingData.vehicle.id,
                licensePlate: plate,
                brand: brandSelect.value,
                model: modelInput.value,
                year: yearInput.value || null  // ✅ Cho phép null nếu bỏ trống
            };
            
            // Nếu chưa có ID, tạo mới
            if (!bookingData.vehicle.id && token && user.userId) {
                try {
                    const res = await fetch(`${API_BASE}/vehicles`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userId: user.userId,
                            licensePlate: plate,
                            brand: brandSelect.value,
                            model: modelInput.value,
                            year: yearInput.value || null  // ✅ Cho phép null nếu bỏ trống
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        bookingData.vehicle.id = data.id || data.data?.VehicleID;
                    }
                } catch (err) {
                    console.log('Lỗi tạo xe:', err);
                }
            }
            
            goToStep(3);
            handleStep3();
        });
        
        // Back
        backBtn.addEventListener('click', () => goToStep(1));
    }
    
    // ========================================================================
    // STEP 3: CHỌN THỜI GIAN - TẤT CẢ TRONG 1 FUNCTION
    // ========================================================================
    async function handleStep3() {
        console.log('📅 STEP 3: Chọn thời gian');
        
        const dateInput = document.getElementById('appointmentDate');
        const timeSlotsContainer = document.getElementById('timeSlots');
        const nextBtn = document.getElementById('nextToStep4');
        const backBtn = document.getElementById('backToStep2');
        
        let selectedSlot = null;
        
        // Event: Chọn ngày
        dateInput.addEventListener('change', async function() {
            const date = this.value;
            if (!date) return;
            
            bookingData.appointment.date = date;
            
            // Load khung giờ trống
            try {
                timeSlotsContainer.innerHTML = '<div class="spinner-border"></div>';
                
                const res = await fetch(`${API_BASE}/schedules/available-slots?date=${date}`);
                const data = await res.json();
                availableTimeSlots = data.slots || [];
                
                renderTimeSlots(availableTimeSlots);
            } catch (err) {
                timeSlotsContainer.innerHTML = '<p class="text-danger">Không thể tải khung giờ</p>';
            }
        });
        
        // Render khung giờ
        function renderTimeSlots(slots) {
            if (slots.length === 0) {
                timeSlotsContainer.innerHTML = '<p class="text-muted">Không có khung giờ trống</p>';
                return;
            }
            
            timeSlotsContainer.innerHTML = slots.map(slot => `
                <div class="time-slot" data-time="${slot.time}">
                    <div>${slot.time}</div>
                    <small>${slot.available ? 'Còn trống' : 'Đã đầy'}</small>
                </div>
            `).join('');
            
            // Event: Click chọn giờ
            timeSlotsContainer.querySelectorAll('.time-slot').forEach(slot => {
                if (!slot.classList.contains('disabled')) {
                    slot.addEventListener('click', function() {
                        timeSlotsContainer.querySelectorAll('.time-slot').forEach(s => 
                            s.classList.remove('selected')
                        );
                        this.classList.add('selected');
                        selectedSlot = this.dataset.time;
                        bookingData.appointment.time = selectedSlot;
                        nextBtn.disabled = false;
                    });
                }
            });
        }
        
        // Next
        nextBtn.addEventListener('click', () => {
            if (!bookingData.appointment.date || !bookingData.appointment.time) {
                showAlert('Vui lòng chọn ngày và giờ');
                return;
            }
            goToStep(4);
            handleStep4();
        });
        
        // Back
        backBtn.addEventListener('click', () => goToStep(2));
    }
    
    // ========================================================================
    // STEP 4: XÁC NHẬN - TẤT CẢ TRONG 1 FUNCTION
    // ========================================================================
    function handleStep4() {
        console.log('✅ STEP 4: Xác nhận thông tin');
        
        const confirmServices = document.getElementById('confirmServices');
        const confirmVehicle = document.getElementById('confirmVehicle');
        const confirmDateTime = document.getElementById('confirmDateTime');
        const confirmTotal = document.getElementById('confirmTotal');
        const nextBtn = document.getElementById('nextToStep5');
        const backBtn = document.getElementById('backToStep3');
        
        // Hiển thị thông tin xác nhận
        if (confirmServices) {
            confirmServices.innerHTML = bookingData.services.map(s => `
                <div class="d-flex justify-content-between mb-2">
                    <span>${s.name}</span>
                    <span>${formatCurrency(s.price)}</span>
                </div>
            `).join('');
        }
        
        if (confirmVehicle) {
            confirmVehicle.innerHTML = `
                <p>Biển số: <strong>${bookingData.vehicle.licensePlate}</strong></p>
                ${bookingData.vehicle.brand ? `<p>Hãng: ${bookingData.vehicle.brand}</p>` : ''}
                ${bookingData.vehicle.model ? `<p>Dòng: ${bookingData.vehicle.model}</p>` : ''}
            `;
        }
        
        if (confirmDateTime) {
            confirmDateTime.innerHTML = `
                <p>Ngày: <strong>${bookingData.appointment.date}</strong></p>
                <p>Giờ: <strong>${bookingData.appointment.time}</strong></p>
            `;
        }
        
        if (confirmTotal) {
            const total = bookingData.services.reduce((sum, s) => sum + s.price, 0);
            confirmTotal.textContent = formatCurrency(total);
        }
        
        // Next
        nextBtn.addEventListener('click', () => {
            goToStep(5);
            handleStep5();
        });
        
        // Back
        backBtn.addEventListener('click', () => goToStep(3));
    }
    
    // ========================================================================
    // STEP 5: THANH TOÁN - TẤT CẢ TRONG 1 FUNCTION
    // ========================================================================
    function handleStep5() {
        console.log('💳 STEP 5: Thanh toán');
        
        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        const submitBtn = document.getElementById('finalSubmit');
        const backBtn = document.getElementById('backToStep4');
        
        // Event: Chọn phương thức thanh toán
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                bookingData.paymentMethod = this.value;
                
                // Hiện thông tin chuyển khoản nếu chọn
                const paymentInfo = document.getElementById('paymentInfo');
                if (this.value === 'Chuyển khoản' && paymentInfo) {
                    const total = bookingData.services.reduce((sum, s) => sum + s.price, 0);
                    const amountEl = document.getElementById('paymentAmount');
                    if (amountEl) amountEl.textContent = formatCurrency(total);
                    paymentInfo.style.display = 'block';
                } else if (paymentInfo) {
                    paymentInfo.style.display = 'none';
                }
            });
        });
        
        // Submit đặt lịch
        submitBtn.addEventListener('click', async () => {
            const token = getToken();
            const user = getUserInfo();
            
            if (!token) {
                showAlert('Vui lòng đăng nhập để đặt lịch');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang xử lý...';
            
            try {
                // Tạo appointment
                const appointmentData = {
                    userId: user.userId,
                    vehicleId: bookingData.vehicle.id,
                    appointmentDate: bookingData.appointment.date,
                    appointmentTime: bookingData.appointment.time,
                    services: bookingData.services.map(s => s.id),
                    paymentMethod: bookingData.paymentMethod,
                    notes: ''
                };
                
                const res = await fetch(`${API_BASE}/booking/appointments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appointmentData)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    showBookingSuccess(data.appointmentId || 'BK' + Date.now());
                } else {
                    showAlert(data.message || 'Đặt lịch thất bại');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Hoàn tất đặt lịch';
                }
            } catch (err) {
                showAlert('Lỗi kết nối server');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Hoàn tất đặt lịch';
            }
        });
        
        // Back
        backBtn.addEventListener('click', () => goToStep(4));
    }
    
    // ========================================================================
    // SUCCESS - Hiển thị thành công
    // ========================================================================
    function showBookingSuccess(appointmentId) {
        console.log('🎉 Đặt lịch thành công:', appointmentId);
        
        
        // ẨN TẤT CẢ step-content (bao gồm step 5) - QUAN TRỌNG!
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });
        
        // ẨN tất cả step indicators
        document.querySelectorAll('.step').forEach(el => {
            el.classList.remove('active');
        });
        
        // ẨN form booking
        
        const bookingForm = document.getElementById('bookingFormContainer');
        if (bookingForm) bookingForm.style.display = 'none';
        // HIỆN success message
        const successDiv = document.getElementById('bookingSuccess');
        if (successDiv) {
            successDiv.style.display = 'block';
            
            const bookingIdEl = document.getElementById('bookingId');
            if (bookingIdEl) bookingIdEl.textContent = appointmentId;
            
            // Hiện payment info nếu chuyển khoản
            if (bookingData.paymentMethod === 'Chuyển khoản') {
                const paymentInfo = document.querySelector('#bookingSuccess #paymentInfo');
                if (paymentInfo) {
                    const total = bookingData.services.reduce((sum, s) => sum + s.price, 0);
                    const amountEl = document.getElementById('paymentAmount');
                    if (amountEl) amountEl.textContent = formatCurrency(total);
                    
                    const noteEl = document.getElementById('paymentNote');
                    if (noteEl) noteEl.textContent = `${appointmentId} - ${user.fullName || 'Khách hàng'}`;
                    
                    paymentInfo.style.display = 'block';
                }
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ========================================================================
    // INIT - Khởi động
    // ========================================================================
    window.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM loaded, khởi động step 1');
        handleStep1();
    });
    
})();