// Quick Tags & Victim Map Logic
document.addEventListener('DOMContentLoaded', () => {
    const quickTags = document.getElementById('quickTags');
    const messageInput = document.getElementById('message');
    
    if (quickTags && messageInput) {
        quickTags.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-btn')) {
                const tagText = e.target.textContent;
                const currentVal = messageInput.value.trim();
                if (currentVal) {
                    messageInput.value = currentVal + ', ' + tagText;
                } else {
                    messageInput.value = tagText;
                }
            }
        });
    }
    
    const btnGetLocation = document.getElementById('btnGetLocation');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', handleGetLocationOnly);
    }
});

async function handleGetLocationOnly() {
    const btnGetLocation = document.getElementById('btnGetLocation');
    btnGetLocation.disabled = true;
    btnGetLocation.textContent = 'Đang lấy vị trí...';
    
    try {
        await getCurrentLocation();
        btnGetLocation.style.display = 'none'; // Ẩn nút sau khi lấy thành công
    } catch (e) {
        console.error(e);
    } finally {
        btnGetLocation.disabled = false;
        if (btnGetLocation.style.display !== 'none') {
            btnGetLocation.textContent = '📍 Lấy Vị Trí Hiện Tại';
        }
    }
}

// Custom Alert Function
function showAlert(message, type = 'info', onOk = null) {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.alert-overlay');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Determine alert type based on message content if not specified
    if (type === 'info') {
        if (message.includes('thành công') || message.includes('Cảm ơn')) {
            type = 'success';
        } else if (message.includes('lỗi') || message.includes('Lỗi') || message.includes('không thể')) {
            type = 'error';
        }
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'alert-modal';
    
    // Create header with icon
    const header = document.createElement('div');
    header.className = 'alert-header';
    
    const icon = document.createElement('div');
    icon.className = `alert-icon ${type}`;
    if (type === 'success') {
        icon.innerHTML = '✓';
    } else if (type === 'error') {
        icon.innerHTML = '✕';
    } else {
        icon.innerHTML = 'ℹ';
    }
    
    const title = document.createElement('h3');
    title.className = 'alert-title';
    if (type === 'success') {
        title.textContent = 'Thành công';
    } else if (type === 'error') {
        title.textContent = 'Lỗi';
    } else {
        title.textContent = 'Thông báo';
    }
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'alert-body';
    body.textContent = message;
    
    // Create footer with button
    const footer = document.createElement('div');
    footer.className = 'alert-footer';
    
    const btn = document.createElement('button');
    btn.className = 'alert-btn alert-btn-primary';
    btn.textContent = 'OK';
    btn.onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        modal.style.animation = 'slideDown 0.2s ease';
        setTimeout(() => {
            overlay.remove();
            if (typeof onOk === 'function') onOk();
        }, 200);
    };
    
    footer.appendChild(btn);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    
    // Assemble overlay
    overlay.appendChild(modal);
    
    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            btn.click();
        }
    };
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Focus button for accessibility
    setTimeout(() => btn.focus(), 100);
}

// Get current location using Geolocation API
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        const addressInput = document.getElementById('address');
        const locationStatus = document.getElementById('locationStatus');
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            const errorMsg = 'Trình duyệt của bạn không hỗ trợ định vị GPS';
            locationStatus.innerHTML = '<span class="error">' + errorMsg + '</span>';
            locationStatus.style.display = 'block';
            locationStatus.className = 'location-status error';
            reject(new Error(errorMsg));
            return;
        }

        // Show loading state
        locationStatus.innerHTML = '<span class="loading">📍 Đang lấy vị trí của bạn...</span>';
        locationStatus.style.display = 'block';
        locationStatus.className = 'location-status loading';

        // Request location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update hidden inputs
                latitudeInput.value = lat;
                longitudeInput.value = lng;

                // Resolve immediately for fast UX on weak networks.
                const coordAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                addressInput.value = coordAddress;
                locationStatus.innerHTML = '<span class="success">✓ Đã lấy tọa độ thành công</span>';
                locationStatus.className = 'location-status success';
                resolve({ latitude: lat, longitude: lng, address: coordAddress });

                // Best-effort reverse geocoding in background (with cache + timeout).
                try {
                    const address = await reverseGeocode(lat, lng);
                    if (address && addressInput.value === coordAddress) {
                        addressInput.value = address;
                        locationStatus.innerHTML = '<span class="success">✓ Đã lấy vị trí thành công</span>';
                        locationStatus.className = 'location-status success';
                    }
                } catch (_) {}
            },
            (error) => {
                // Handle errors
                let errorMessage = 'Không thể lấy vị trí. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Thông tin vị trí không khả dụng.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Yêu cầu lấy vị trí đã hết thời gian chờ.';
                        break;
                    default:
                        errorMessage += 'Đã xảy ra lỗi không xác định.';
                        break;
                }
                
                locationStatus.innerHTML = '<span class="error">' + errorMessage + '</span>';
                locationStatus.className = 'location-status error';
                reject(error);
            },
            {
                enableHighAccuracy: false,
                timeout: 12000,
                maximumAge: 60000
            }
        );
    });
}

// Reverse geocoding to get address from coordinates
async function reverseGeocode(lat, lng) {
    try {
        const roundedLat = Number(lat.toFixed(6));
        const roundedLng = Number(lng.toFixed(6));
        const cacheKey = `revgeo:${roundedLat},${roundedLng}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) return cached;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        // Using OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'RescueApp/1.0'
                },
                signal: controller.signal
            }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            // Build address string
            const addressParts = [];
            
            if (addr.house_number) addressParts.push(addr.house_number);
            if (addr.road) addressParts.push(addr.road);
            if (addr.suburb || addr.neighbourhood) addressParts.push(addr.suburb || addr.neighbourhood);
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
            if (addr.state) addressParts.push(addr.state);
            
            const result = addressParts.length > 0 
                ? addressParts.join(', ') 
                : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            sessionStorage.setItem(cacheKey, result);
            return result;
        }

        const fallback = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        sessionStorage.setItem(cacheKey, fallback);
        return fallback;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Return coordinates as fallback
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// API Configuration
const API_BASE_URL = 'https://huy3009-api-for-phobert-urgency-model.hf.space/';

// Form Submission
async function submitForm(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    const locationStatus = document.getElementById('locationStatus');
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lấy vị trí...';
    
    try {
        // Get location first
        let lat = document.getElementById('latitude').value;
        let lng = document.getElementById('longitude').value;
        let address = document.getElementById('address').value || `${lat}, ${lng}`;
        if (!lat || !lng) {
            showAlert('Vui lòng nhấn nút "Lấy Vị Trí Hiện Tại" trước khi gửi yêu cầu!', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }
        
        // Update button text
        submitBtn.textContent = 'Đang gửi...';
        
        // Prepare form data according to API requirements
        const contactName = document.getElementById('contactName').value.trim();
        const situationDesc = document.getElementById('message').value.trim();
        
        const formData = {
            phone: document.getElementById('phone').value.trim(),
            message: `Họ tên: ${contactName}\n\nTình trạng: ${situationDesc}`,
            lat: parseFloat(document.getElementById('latitude').value),
            lng: parseFloat(document.getElementById('longitude').value)
        };
        
        if (!navigator.onLine) {
            const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
            offlineRequests.push(formData);
            localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
            showAlert(`Thiết bị đang ngoại tuyến. Yêu cầu của bạn đã được lưu tạm và sẽ tự động gửi đi khi có mạng trở lại.\n\nVị trí: ${address}`, 'success');
            
            event.target.reset();
            locationStatus.style.display = 'none';
            locationStatus.className = 'location-status';
            return;
        }
        
        // Call API
        const response = await fetch(`${API_BASE_URL}/api/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.ok) {
            // Handle API error
            const errorMessage = result.error || 'Đã xảy ra lỗi khi gửi yêu cầu';
            throw new Error(errorMessage);
        }
        
        // Show success message with location info
        showAlert(`Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công.\n\nVị trí: ${address}\nTọa độ: ${lat}, ${lng}\n\nChúng tôi sẽ liên hệ với bạn sớm nhất có thể.`, 'success');
        
        // Reset form
        event.target.reset();
        
        // Reset location status
        locationStatus.style.display = 'none';
        locationStatus.className = 'location-status';
        
    } catch (error) {
        // Handle errors
        let errorMessage = 'Không thể gửi yêu cầu. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Vui lòng thử lại sau.';
        }
        
        showAlert(errorMessage, 'error');
        
        // Show error in location status if location failed
        if (error.message && error.message.includes('vị trí')) {
            locationStatus.innerHTML = '<span class="error">' + error.message + '</span>';
            locationStatus.style.display = 'block';
            locationStatus.className = 'location-status error';
        }
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Đăng ký Service Worker cho PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => console.log('ServiceWorker đã đăng ký thành công:', registration.scope))
            .catch(err => console.log('Đăng ký ServiceWorker thất bại:', err));
    });
}

// Xử lý gửi lại dữ liệu khi có mạng (Offline Sync)
window.addEventListener('online', async () => {
    const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
    if (offlineRequests.length > 0) {
        showAlert('Đã kết nối mạng trở lại. Đang đồng bộ các yêu cầu chưa gửi...', 'info');
        let successCount = 0;
        const remainingRequests = [];
        
        for (const formData of offlineRequests) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (response.ok) {
                    successCount++;
                } else {
                    remainingRequests.push(formData);
                }
            } catch (e) {
                remainingRequests.push(formData);
            }
        }
        
        localStorage.setItem('offlineRequests', JSON.stringify(remainingRequests));
        if (successCount > 0) {
            showAlert(`Đã gửi thành công ${successCount} yêu cầu ngoại tuyến.`, 'success');
        }
    }
});
