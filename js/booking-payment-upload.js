/**
 * Payment Proof Upload Module
 * Module xử lý upload ảnh chứng từ chuyển khoản cho khách hàng
 * Tích hợp với booking.js
 */

// ========================================
// CẤU HÌNH NGÂN HÀNG - SỬA THÔNG TIN NÀY
// ========================================
const BANK_CONFIG = {
    bankId: '970422',           // Mã ngân hàng VietQR (VCB = 970436)
    bankName: 'MBBank (MB)',
    accountNo: '0947084064',    // SỐ TÀI KHOẢN CỦA BẠN
    accountName: 'VO MINH QUAN'  // TÊN CHỦ TÀI KHOẢN
};

// API URL - Tự động detect môi trường
const API_BASE_URL = (function() {
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) {
        return API_CONFIG.BASE_URL;
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080/api';
    }
    return 'https://suaxeweb-production.up.railway.app/api';
})();

// ========================================
// PAYMENT PROOF MODULE
// ========================================
const PaymentProofModule = {
    proofId: null,
    appointmentId: null,
    amount: 0,
    countdownInterval: null,
    expiresAt: null,

    /**
     * Khởi tạo module với thông tin đơn hàng
     */
    async init(appointmentId, amount) {
        console.log('🔄 PaymentProofModule.init()', { appointmentId, amount });
        
        this.appointmentId = appointmentId;
        this.amount = amount;
        
        try {
            // Gọi API tạo payment proof request
            const response = await this.createPaymentProof();
            
            if (response && response.success) {
                this.proofId = response.data.proofId;
                this.expiresAt = new Date(response.data.expiresAt);
                
                // Render UI
                this.renderPaymentUI(response.data);
                
                // Bắt đầu countdown
                this.startCountdown();
            } else {
                throw new Error(response?.message || 'Không thể tạo yêu cầu thanh toán');
            }
        } catch (error) {
            console.error('❌ PaymentProofModule init error:', error);
            this.renderError(error.message);
        }
    },

    /**
     * Gọi API tạo payment proof
     */
    async createPaymentProof() {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/payment-proof/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                appointmentId: this.appointmentId,
                amount: this.amount
            })
        });
        
        return await response.json();
    },

    /**
     * Render giao diện thanh toán với QR code
     */
    renderPaymentUI(data) {
        const paymentInfo = document.getElementById('paymentInfo');
        if (!paymentInfo) {
            console.error('❌ Không tìm thấy element #paymentInfo');
            return;
        }

        const transferContent = data.transferContent || `BK${this.appointmentId}`;
        const formattedAmount = this.amount.toLocaleString('vi-VN');
        
        // Tạo QR URL từ VietQR
        const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.jpg?amount=${this.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

        paymentInfo.innerHTML = `
            <div class="payment-proof-container" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 16px; color: white;">
                
                <!-- Header -->
                <div class="text-center mb-4">
                    <h4 style="margin: 0; font-weight: 600;">
                        <i class="bi bi-qr-code me-2"></i>Thanh toán chuyển khoản
                    </h4>
                    <p class="mb-0 mt-2 opacity-75">Quét mã QR hoặc chuyển khoản thủ công</p>
                </div>

                <!-- Countdown Badge -->
                <div class="text-center mb-3">
                    <span id="countdownBadge" class="badge bg-warning text-dark px-4 py-2" style="font-size: 1.1rem; border-radius: 20px;">
                        <i class="bi bi-clock me-2"></i>
                        <span id="countdownTimer">15:00</span>
                    </span>
                </div>

                <!-- QR Code -->
                <div class="text-center mb-4">
                    <div style="background: white; padding: 15px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <img src="${qrUrl}" alt="QR Code" style="max-width: 220px; display: block;">
                    </div>
                </div>

                <!-- Bank Info Cards -->
                <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; backdrop-filter: blur(10px);">
                    <div class="row g-2">
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light border-opacity-25">
                                <span class="opacity-75">Ngân hàng:</span>
                                <strong>${BANK_CONFIG.bankName}</strong>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light border-opacity-25">
                                <span class="opacity-75">Số tài khoản:</span>
                                <div>
                                    <strong class="me-2">${BANK_CONFIG.accountNo}</strong>
                                    <button class="btn btn-sm btn-light" onclick="PaymentProofModule.copyText('${BANK_CONFIG.accountNo}')">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light border-opacity-25">
                                <span class="opacity-75">Chủ TK:</span>
                                <strong style="font-size: 0.9rem;">${BANK_CONFIG.accountName}</strong>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light border-opacity-25">
                                <span class="opacity-75">Số tiền:</span>
                                <div>
                                    <strong class="text-warning me-2">${formattedAmount} ₫</strong>
                                    <button class="btn btn-sm btn-light" onclick="PaymentProofModule.copyText('${this.amount}')">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center py-2">
                                <span class="opacity-75">Nội dung CK:</span>
                                <div>
                                    <strong class="text-warning me-2">${transferContent}</strong>
                                    <button class="btn btn-sm btn-light" onclick="PaymentProofModule.copyText('${transferContent}')">
                                        <i class="bi bi-clipboard"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Warning -->
                <div class="alert alert-warning mt-3 mb-3" style="border-radius: 10px;">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Quan trọng:</strong> Nhập đúng nội dung <code class="text-danger">${transferContent}</code> để xác nhận tự động.
                </div>

                <!-- Upload Section -->
                <div style="background: white; padding: 20px; border-radius: 12px; color: #333;">
                    <h5 class="mb-3" style="color: #667eea;">
                        <i class="bi bi-cloud-upload me-2"></i>Upload ảnh chuyển khoản
                    </h5>
                    
                    <div id="uploadArea" style="border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; cursor: pointer; transition: all 0.3s;" 
                         onclick="document.getElementById('proofImageInput').click()"
                         ondragover="this.style.borderColor='#764ba2'; this.style.background='#f0f0ff'; event.preventDefault();"
                         ondragleave="this.style.borderColor='#667eea'; this.style.background='white';"
                         ondrop="PaymentProofModule.handleDrop(event)">
                        
                        <div id="uploadPlaceholder">
                            <i class="bi bi-image" style="font-size: 3rem; color: #667eea;"></i>
                            <p class="mt-2 mb-0">Kéo thả hoặc <strong>click</strong> để chọn ảnh</p>
                            <small class="text-muted">PNG, JPG (tối đa 5MB)</small>
                        </div>
                        
                        <div id="uploadPreview" style="display: none;">
                            <img id="previewImage" src="" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                            <p class="mt-2 mb-0 text-success"><i class="bi bi-check-circle me-1"></i>Ảnh đã chọn</p>
                        </div>
                    </div>
                    
                    <input type="file" id="proofImageInput" accept="image/*" style="display: none;" onchange="PaymentProofModule.handleFileSelect(event)">
                    
                    <button id="uploadProofBtn" class="btn btn-primary w-100 mt-3" onclick="PaymentProofModule.uploadProof()" disabled style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; padding: 12px;">
                        <i class="bi bi-send me-2"></i>Gửi ảnh chứng từ
                    </button>
                </div>

                <!-- Status Section (hidden by default) -->
                <div id="proofStatusSection" style="display: none; background: white; padding: 20px; border-radius: 12px; color: #333; margin-top: 15px;">
                </div>
            </div>
        `;

        paymentInfo.style.display = 'block';
    },

    /**
     * Xử lý chọn file
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith('image/')) {
            this.showToast('error', 'Vui lòng chọn file ảnh');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('error', 'Ảnh phải nhỏ hơn 5MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('uploadPlaceholder').style.display = 'none';
            document.getElementById('uploadPreview').style.display = 'block';
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('uploadProofBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    },

    /**
     * Xử lý drag & drop
     */
    handleDrop(event) {
        event.preventDefault();
        event.target.style.borderColor = '#667eea';
        event.target.style.background = 'white';
        
        const file = event.dataTransfer.files[0];
        if (file) {
            document.getElementById('proofImageInput').files = event.dataTransfer.files;
            this.handleFileSelect({ target: { files: [file] } });
        }
    },

    /**
     * Upload ảnh chứng từ
     */
    async uploadProof() {
        const fileInput = document.getElementById('proofImageInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('error', 'Vui lòng chọn ảnh');
            return;
        }

        const uploadBtn = document.getElementById('uploadProofBtn');
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang upload...';

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('proofImage', file);

            const response = await fetch(`${API_BASE_URL}/payment-proof/upload/${this.proofId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('success', 'Upload thành công! Đang chờ admin duyệt.');
                this.stopCountdown();
                this.renderWaitingStatus();
            } else {
                throw new Error(result.message || 'Upload thất bại');
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            this.showToast('error', error.message);
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="bi bi-send me-2"></i>Gửi ảnh chứng từ';
        }
    },

    /**
     * Hiển thị trạng thái đang chờ duyệt
     */
    renderWaitingStatus() {
        const statusSection = document.getElementById('proofStatusSection');
        const uploadArea = document.getElementById('uploadArea');
        const uploadBtn = document.getElementById('uploadProofBtn');

        if (uploadArea) uploadArea.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'none';

        if (statusSection) {
            statusSection.style.display = 'block';
            statusSection.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status"></div>
                    <h5 class="text-primary">Đang chờ xác nhận</h5>
                    <p class="text-muted mb-0">Ảnh chứng từ của bạn đã được gửi đi.</p>
                    <p class="text-muted">Admin sẽ xác nhận trong thời gian sớm nhất.</p>
                    <a href="booking-history.html" class="btn btn-outline-primary mt-2">
                        <i class="bi bi-clock-history me-2"></i>Xem lịch sử đặt lịch
                    </a>
                </div>
            `;
        }
    },

    /**
     * Bắt đầu countdown 15 phút
     */
    startCountdown() {
        const timerElement = document.getElementById('countdownTimer');
        const badgeElement = document.getElementById('countdownBadge');
        
        if (!timerElement || !this.expiresAt) return;

        this.countdownInterval = setInterval(() => {
            const now = new Date();
            const diff = this.expiresAt - now;

            if (diff <= 0) {
                this.handleExpired();
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Warning colors
            if (minutes < 1) {
                badgeElement.className = 'badge bg-danger px-4 py-2';
                badgeElement.style.animation = 'pulse 1s infinite';
            } else if (minutes < 3) {
                badgeElement.className = 'badge bg-warning text-dark px-4 py-2';
            }
        }, 1000);
    },

    /**
     * Dừng countdown
     */
    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    },

    /**
     * Xử lý hết thời gian
     */
    handleExpired() {
        this.stopCountdown();
        
        const paymentInfo = document.getElementById('paymentInfo');
        if (paymentInfo) {
            paymentInfo.innerHTML = `
                <div class="alert alert-danger text-center" style="border-radius: 12px; padding: 30px;">
                    <i class="bi bi-clock" style="font-size: 3rem;"></i>
                    <h4 class="mt-3">Hết thời gian thanh toán</h4>
                    <p>Đơn đặt lịch của bạn đã bị hủy do quá thời gian thanh toán.</p>
                    <a href="booking.html" class="btn btn-danger mt-2">
                        <i class="bi bi-arrow-repeat me-2"></i>Đặt lịch lại
                    </a>
                </div>
            `;
        }
    },

    /**
     * Render lỗi
     */
    renderError(message) {
        const paymentInfo = document.getElementById('paymentInfo');
        if (paymentInfo) {
            paymentInfo.innerHTML = `
                <div class="alert alert-danger" style="border-radius: 12px;">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Lỗi:</strong> ${message}
                </div>
            `;
            paymentInfo.style.display = 'block';
        }
    },

    /**
     * Copy text vào clipboard
     */
    copyText(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('success', `Đã copy: ${text}`);
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('success', `Đã copy: ${text}`);
        });
    },

    /**
     * Hiển thị toast notification
     */
    showToast(type, message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 99999;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'} me-2"></i>${message}`;

        // Add animation style if not exists
        if (!document.getElementById('toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Expose to global scope
window.PaymentProofModule = PaymentProofModule;

console.log('✅ PaymentProofModule loaded');